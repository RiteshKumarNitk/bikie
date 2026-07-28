import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../data/auth_repository.dart';
import '../domain/auth_controller.dart';
import '../domain/role_provider.dart';
import 'widgets/dev_otp_banner.dart';
import 'widgets/phone_number_field.dart';

/// `/signup` — phone + OTP, mirroring the web (ADR-013/ADR-015). Name and
/// the fuller rider-profile onboarding form are collected later on web
/// (`/onboarding`) — that screen doesn't exist on mobile yet (a separate,
/// larger feature), so a brand-new mobile signup goes straight to Home with
/// just the role from `/welcome` applied, keeping Better Auth's placeholder
/// name (the phone number itself) until Settings/onboarding is built.
class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  String _step = 'phone'; // 'phone' | 'otp'

  String _countryCode = kDefaultCountryCode;
  String _localNumber = '';
  String _phoneNumber = '';
  bool? _exists;
  final _otpController = TextEditingController();

  String? _error;
  String? _devOtp;
  bool _sendingOtp = false;
  bool _verifying = false;

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _fetchDevOtp(String phone) async {
    final code = await ref.read(authRepositoryProvider).fetchDevOtp(phone);
    if (mounted) setState(() => _devOtp = code);
  }

  Future<void> _sendCode() async {
    setState(() => _error = null);
    final normalized = composePhoneNumber(_countryCode, _localNumber);
    if (normalized == null) {
      setState(() => _error = 'Enter a 10-digit phone number.');
      return;
    }
    setState(() => _sendingOtp = true);
    try {
      final repo = ref.read(authRepositoryProvider);
      await repo.sendOtp(normalized);
      final result = await repo.phoneExists(normalized);
      setState(() {
        _phoneNumber = normalized;
        _exists = result.exists;
        _step = 'otp';
      });
      _fetchDevOtp(normalized);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _sendingOtp = false);
    }
  }

  Future<void> _resend() async {
    setState(() => _sendingOtp = true);
    try {
      await ref.read(authRepositoryProvider).sendOtp(_phoneNumber);
      _fetchDevOtp(_phoneNumber);
    } finally {
      if (mounted) setState(() => _sendingOtp = false);
    }
  }

  Future<void> _verify() async {
    setState(() {
      _error = null;
      _verifying = true;
    });
    try {
      await ref.read(authControllerProvider.notifier).verifyOtp(phoneNumber: _phoneNumber, code: _otpController.text.trim());
      if (_exists == false) {
        final role = ref.read(selectedRoleProvider);
        await ref.read(authRepositoryProvider).completePhoneSignup(role: role);
      }
      if (mounted) context.go('/');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedRole = ref.watch(selectedRoleProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create account'),
        actions: [
          TextButton(onPressed: () => context.go('/welcome'), child: const Text('Change Role')),
        ],
      ),
      bottomNavigationBar: _devOtp != null ? DevOtpBanner(code: _devOtp!) : null,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  selectedRole == 'PARTNER' ? 'Create your partner account' : 'Create your rider account',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),
                Text(
                  selectedRole == 'PARTNER'
                      ? 'List your bikes, organize rides, and grow your business.'
                      : 'Join the community, book rides, and explore India.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 24),
                if (_step == 'phone') ...[
                  PhoneNumberField(
                    countryCode: _countryCode,
                    onCountryCodeChanged: (v) => setState(() => _countryCode = v),
                    onLocalNumberChanged: (v) => _localNumber = v,
                  ),
                  const SizedBox(height: 6),
                  Text("We'll text you a 6-digit code.", style: Theme.of(context).textTheme.bodySmall),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                  ],
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: _sendingOtp ? null : _sendCode,
                    child: _sendingOtp ? const _Spinner() : const Text('Send code'),
                  ),
                ],
                if (_step == 'otp') ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      border: Border.all(color: Theme.of(context).dividerColor),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(_phoneNumber),
                        TextButton(
                          onPressed: () => setState(() {
                            _step = 'phone';
                            _otpController.clear();
                            _error = null;
                            _devOtp = null;
                          }),
                          child: const Text('Change'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    autofillHints: const [AutofillHints.oneTimeCode],
                    decoration: const InputDecoration(labelText: 'Verification code', hintText: '6-digit code'),
                    onSubmitted: (_) => _verify(),
                  ),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(onPressed: _sendingOtp ? null : _resend, child: const Text('Resend code')),
                  ),
                  if (_error != null) ...[
                    Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                    const SizedBox(height: 8),
                  ],
                  ElevatedButton(
                    onPressed: _verifying ? null : _verify,
                    child: _verifying ? const _Spinner() : const Text('Verify'),
                  ),
                ],
                const SizedBox(height: 20),
                TextButton(
                  onPressed: () => context.go('/login'),
                  child: const Text('Already have an account? Log in'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Spinner extends StatelessWidget {
  const _Spinner();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white));
  }
}
