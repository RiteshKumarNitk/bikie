import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/app_logo.dart';
import '../../../core/widgets/app_toast.dart';
import '../data/auth_repository.dart';
import '../data/msg91_otp_repository.dart';
import '../domain/auth_controller.dart';
import '../domain/role_provider.dart';
import 'widgets/dev_otp_banner.dart';
import 'widgets/otp_channel_toggle.dart';
import 'widgets/phone_number_field.dart';
import 'widgets/resend_countdown.dart';

const _noAccountError = 'NO_ACCOUNT';

/// ADR-071 — the mobile app is Rider / Service Provider only and, for this phase,
/// login is **phone + OTP only**. Email/password sign-in is hidden: set this back
/// to `true` to restore the "Log in with email instead" fallback for legacy
/// accounts that predate phone login. The `_emailSignIn` handler and the email
/// sub-form are left intact and dormant behind this flag — not deleted.
/// Intentionally a mutable top-level (not `const`) so the gated code isn't dead.
bool mobileEmailLoginEnabled = false;

/// `/login` — phone + OTP (ADR-013). Email/password login is gated off for this
/// phase (see `mobileEmailLoginEnabled`).
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> with ResendCountdownMixin<LoginScreen> {
  String _mode = 'phone'; // 'phone' | 'email'
  String _step = 'phone'; // 'phone' | 'otp' | 'mismatch'

  String _localNumber = '';
  String _phoneNumber = '';
  final _otpController = TextEditingController();
  // ADR-057 — which channel the OTP goes out on; see `Msg91OtpRepository`'s doc comment for why
  // WhatsApp only works in release builds. `_reqId` is the MSG91 widget session id (release
  // builds only — null in debug mode, where the backend-proxied path needs no session tracking).
  OtpChannel _otpChannel = OtpChannel.sms;
  String? _reqId;

  final _emailFormKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  String? _error;
  String? _devOtp;
  bool _sendingOtp = false;
  bool _verifying = false;
  bool _signingIn = false;
  // ADR-053 — populated when the account's real accountType doesn't match what was picked on
  // /welcome; never sign the account back out over this, just show the choice.
  String? _mismatchCurrentType;
  // True only for the defensive post-verify fallback (a session already exists then) — the
  // common case is caught in _sendCode before any OTP is sent, where there's no session yet, so
  // "Continue as X" there means "resume login as that type," not "go to that dashboard."
  bool _mismatchHasSession = false;

  @override
  void dispose() {
    _otpController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
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
      // Check existence up front, before texting a code — the backend
      // auto-creates an account on any successful verification (ADR-013),
      // so a login screen shouldn't OTP a number with no account at all.
      final result = await repo.phoneExists(normalized);
      if (!result.exists) {
        setState(() => _error = _noAccountError);
        return;
      }
      // ADR-053 — same reasoning: don't text a code just to find out afterward that the
      // selected role doesn't match this account. Caught here, before any OTP is sent.
      final selectedRole = ref.read(selectedRoleProvider);
      if (result.accountType != null && result.accountType != selectedRole) {
        setState(() {
          _phoneNumber = normalized;
          _mismatchHasSession = false;
          _mismatchCurrentType = result.accountType;
          _step = 'mismatch';
        });
        return;
      }
      final sendResult = await repo.sendOtp(normalized, channel: _otpChannel);
      setState(() {
        _phoneNumber = normalized;
        _reqId = sendResult.reqId;
        _step = 'otp';
      });
      startResendCountdown();
      _fetchDevOtp(normalized);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
      if (mounted) showAppToast(context, e.message, variant: AppToastVariant.error);
    } finally {
      if (mounted) setState(() => _sendingOtp = false);
    }
  }

  Future<void> _resend() async {
    if (!canResend) return;
    setState(() => _sendingOtp = true);
    try {
      await ref.read(authRepositoryProvider).resendOtp(_phoneNumber, reqId: _reqId, channel: _otpChannel);
      startResendCountdown();
      _fetchDevOtp(_phoneNumber);
      if (mounted) showAppToast(context, 'Verification code resent', variant: AppToastVariant.success);
    } on ApiException catch (e) {
      if (mounted) showAppToast(context, e.message, variant: AppToastVariant.error);
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
      await ref
          .read(authControllerProvider.notifier)
          .verifyOtp(phoneNumber: _phoneNumber, code: _otpController.text.trim(), reqId: _reqId);
      final user = ref.read(authControllerProvider).user;
      final selectedRole = ref.read(selectedRoleProvider);

      final currentType = user?.accountType ?? 'RIDER';
      if (currentType != selectedRole) {
        // Defensive fallback now (_sendCode's phoneExists check already catches this before an
        // OTP is ever sent) — reachable only if accountType changed in the brief window since.
        setState(() {
          _mismatchHasSession = true;
          _mismatchCurrentType = currentType;
          _step = 'mismatch';
        });
        return;
      }

      if (mounted) {
        showAppToast(context, 'Signed in successfully', variant: AppToastVariant.success);
        context.go('/');
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
      if (mounted) showAppToast(context, e.message, variant: AppToastVariant.error);
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  Future<void> _emailSignIn() async {
    if (!_emailFormKey.currentState!.validate()) return;
    setState(() {
      _error = null;
      _signingIn = true;
    });
    try {
      await ref.read(authControllerProvider.notifier).signIn(
            email: _emailController.text.trim(),
            password: _passwordController.text,
          );
      final user = ref.read(authControllerProvider).user;
      final selectedRole = ref.read(selectedRoleProvider);

      final currentType = user?.accountType ?? 'RIDER';
      if (currentType != selectedRole) {
        setState(() {
          _mismatchHasSession = true;
          _mismatchCurrentType = currentType;
          _step = 'mismatch';
        });
        return;
      }

      if (mounted) {
        showAppToast(context, 'Signed in successfully', variant: AppToastVariant.success);
        context.go('/');
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
      if (mounted) showAppToast(context, e.message, variant: AppToastVariant.error);
    } finally {
      if (mounted) setState(() => _signingIn = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedRole = ref.watch(selectedRoleProvider);

    return Scaffold(
      appBar: AppBar(
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
                const Center(child: AppLogo(size: 60, glow: true)),
                const SizedBox(height: 18),
                Text(
                  'BIKIE',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(letterSpacing: 1.2),
                ),
                const SizedBox(height: 6),
                if (_step != 'mismatch')
                  Text(
                    selectedRole == 'SERVICE_PROVIDER' ? 'Sign in to Service Provider' : 'Sign in to Rider',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: Theme.of(context).hintColor),
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
                      if (_step == 'mismatch' && _mismatchCurrentType != null) ...[
                        Text(
                          'Already registered as ${_mismatchCurrentType == 'SERVICE_PROVIDER' ? 'a Service Provider' : 'a Rider'}',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'This mobile number is already registered with BIKIE as '
                          '${_mismatchCurrentType == 'SERVICE_PROVIDER' ? 'a Service Provider' : 'a Rider'}. '
                          "Did you select ${selectedRole == 'SERVICE_PROVIDER' ? 'Service Provider' : 'Rider'} by mistake?",
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: _sendingOtp
                              ? null
                              : () {
                                  if (_mismatchHasSession) {
                                    // Already logged in (defensive fallback path) — just go there.
                                    context.go('/');
                                    return;
                                  }
                                  // Not logged in yet (the common path) — resume login as the
                                  // account's real type instead of the one originally selected.
                                  ref.read(selectedRoleProvider.notifier).state = _mismatchCurrentType!;
                                  setState(() => _step = 'phone');
                                  _sendCode();
                                },
                          child: Text(
                            _sendingOtp
                                ? 'Sending code...'
                                : 'Continue as ${_mismatchCurrentType == 'SERVICE_PROVIDER' ? 'Service Provider' : 'Rider'}',
                          ),
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton(
                          onPressed: () => context.push('/account-type-request'),
                          child: const Text('Contact Support to change account type'),
                        ),
                      ],
                      if (_mode == 'phone' && _step == 'phone') ...[
                        if (mobileEmailLoginEnabled) ...[
                          Align(
                            alignment: Alignment.centerLeft,
                            child: TextButton(
                              style: TextButton.styleFrom(padding: EdgeInsets.zero, alignment: Alignment.centerLeft),
                              onPressed: () => setState(() {
                                _mode = 'email';
                                _error = null;
                              }),
                              child: const Text('Have an email account? Log in with email instead',
                                  style: TextStyle(fontSize: 12)),
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],
                        PhoneNumberField(
                          onLocalNumberChanged: (v) => _localNumber = v,
                        ),
                        const SizedBox(height: 10),
                        OtpChannelToggle(
                          value: _otpChannel,
                          onChanged: (c) => setState(() => _otpChannel = c),
                          enabled: !_sendingOtp,
                        ),
                        const SizedBox(height: 16),
                        if (_error == _noAccountError)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: Text(
                              'No account found for this number.',
                              style: TextStyle(color: Theme.of(context).colorScheme.error),
                            ),
                          )
                        else if (_error != null)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                          ),
                        if (_error == _noAccountError) ...[
                          OutlinedButton(onPressed: () => context.go('/signup'), child: const Text('Sign up instead')),
                          const SizedBox(height: 12),
                        ],
                        ElevatedButton(
                          onPressed: _sendingOtp ? null : _sendCode,
                          child: _sendingOtp ? const _Spinner() : const Text('Send code'),
                        ),
                      ],
                      if (_mode == 'email') ...[
                        Form(
                          key: _emailFormKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              TextFormField(
                                controller: _emailController,
                                keyboardType: TextInputType.emailAddress,
                                decoration: const InputDecoration(labelText: 'Email'),
                                validator: (v) => (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
                              ),
                              const SizedBox(height: 16),
                              TextFormField(
                                controller: _passwordController,
                                obscureText: true,
                                decoration: const InputDecoration(labelText: 'Password'),
                                validator: (v) => (v == null || v.isEmpty) ? 'Password is required' : null,
                                onFieldSubmitted: (_) => _emailSignIn(),
                              ),
                              if (_error != null) ...[
                                const SizedBox(height: 12),
                                Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                              ],
                              const SizedBox(height: 20),
                              ElevatedButton(
                                onPressed: _signingIn ? null : _emailSignIn,
                                child: _signingIn ? const _Spinner() : const Text('Sign in'),
                              ),
                              const SizedBox(height: 8),
                              Center(
                                child: TextButton(
                                  onPressed: () => setState(() {
                                    _mode = 'phone';
                                    _error = null;
                                  }),
                                  child: const Text('Log in with phone instead'),
                                ),
                              ),
                            ],
                          ),
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
                                  _reqId = null;
                                }),
                                child: const Text('Change'),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        OtpChannelToggle(
                          value: _otpChannel,
                          onChanged: (c) => setState(() => _otpChannel = c),
                          enabled: !_sendingOtp,
                        ),
                        const SizedBox(height: 4),
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
                            child: Text(canResend ? 'Resend' : 'Resend in ${resendRemaining}s'),
                          ),
                        ),
                        const SizedBox(height: 4),
                        if (_error != null) ...[
                          Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                          const SizedBox(height: 8),
                        ],
                        ElevatedButton(
                          onPressed: _verifying ? null : _verify,
                          child: _verifying ? const _Spinner() : const Text('Sign in'),
                        ),
                      ],
                    ],
                  ),
                ),
                if (_mode == 'phone' && _step != 'mismatch') ...[
                  const SizedBox(height: 20),
                  Center(
                    child: TextButton(
                      onPressed: () => context.go('/signup'),
                      child: const Text("Don't have an account? Sign up"),
                    ),
                  ),
                ],
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
