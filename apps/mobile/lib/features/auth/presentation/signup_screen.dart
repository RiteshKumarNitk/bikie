import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../data/auth_repository.dart';
import '../domain/auth_controller.dart';
import '../domain/role_provider.dart';
import '../../../core/widgets/app_logo.dart';
import 'widgets/dev_otp_banner.dart';
import 'widgets/phone_number_field.dart';
import 'widgets/resend_countdown.dart';

const _accountExistsError = 'ACCOUNT_EXISTS';

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

class _SignupScreenState extends ConsumerState<SignupScreen> with ResendCountdownMixin<SignupScreen> {
  String _step = 'phone'; // 'phone' | 'otp'

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
    final normalized = composePhoneNumber(_localNumber);
    if (normalized == null) {
      setState(() => _error = 'Enter a 10-digit phone number.');
      return;
    }
    setState(() => _sendingOtp = true);
    try {
      final repo = ref.read(authRepositoryProvider);
      // Check existence up front, before texting a code — the converse of the login screen's
      // check. Without this, signing up with a number that already has an account silently logs
      // that existing user in instead of creating anything, which is confusing: they came here
      // to create a new account.
      final result = await repo.phoneExists(normalized);
      if (result.exists) {
        setState(() => _error = _accountExistsError);
        return;
      }
      await repo.sendOtp(normalized);
      setState(() {
        _phoneNumber = normalized;
        _exists = false;
        _step = 'otp';
      });
      startResendCountdown();
      _fetchDevOtp(normalized);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _sendingOtp = false);
    }
  }

  Future<void> _resend() async {
    if (!canResend) return;
    setState(() => _sendingOtp = true);
    try {
      await ref.read(authRepositoryProvider).sendOtp(_phoneNumber);
      startResendCountdown();
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
        // Brand-new account: collect the same profile details the website gathers post-signup
        // (mirrors web's role-based redirect in apps/web/app/(auth)/signup/page.tsx) — rider
        // profile is skippable, partner profile is not. Existing users never reach this branch.
        if (mounted) context.go(role == 'PARTNER' ? '/partner-onboarding' : '/onboarding');
        return;
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
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Center(child: AppLogo(size: 56, glow: true)),
                const SizedBox(height: 18),
                Text(
                  selectedRole == 'PARTNER' ? 'Create your partner account' : 'Create your rider account',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),
                Text(
                  selectedRole == 'PARTNER'
                      ? 'List your bikes, organize rides, and grow your business.'
                      : 'Join the community, book rides, and explore India.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).hintColor),
                ),
                const SizedBox(height: 28),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (_step == 'phone') ...[
                        PhoneNumberField(
                          onLocalNumberChanged: (v) => _localNumber = v,
                        ),
                        const SizedBox(height: 6),
                        Text("We'll text you a 6-digit code.", style: Theme.of(context).textTheme.bodySmall),
                        if (_error == _accountExistsError)
                          Padding(
                            padding: const EdgeInsets.only(top: 12),
                            child: Text(
                              'An account already exists for this number.',
                              style: TextStyle(color: Theme.of(context).colorScheme.error),
                            ),
                          )
                        else if (_error != null) ...[
                          const SizedBox(height: 12),
                          Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                        ],
                        const SizedBox(height: 16),
                        if (_error == _accountExistsError) ...[
                          OutlinedButton(onPressed: () => context.go('/login'), child: const Text('Log in instead')),
                          const SizedBox(height: 12),
                        ],
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
                          child: TextButton(
                            onPressed: (_sendingOtp || !canResend) ? null : _resend,
                            child: Text(canResend ? 'Resend code' : 'Resend code in ${resendRemaining}s'),
                          ),
                        ),
                        const SizedBox(height: 4),
                        if (_error != null) ...[
                          Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                          const SizedBox(height: 8),
                        ],
                        ElevatedButton(
                          onPressed: _verifying ? null : _verify,
                          child: _verifying ? const _Spinner() : const Text('Verify'),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Center(
                  child: TextButton(
                    onPressed: () => context.go('/login'),
                    child: const Text('Already have an account? Log in'),
                  ),
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
