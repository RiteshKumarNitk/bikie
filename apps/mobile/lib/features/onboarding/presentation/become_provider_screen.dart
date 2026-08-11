import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../data/partner_profile_model.dart';
import '../data/partner_profile_repository.dart';

/// `/become-provider` (ADR-046b) — mirrors the web `/dashboard/become-provider` page: the single
/// entry point for "Become a Service Provider," rendering a different view per
/// `PartnerVerificationStatus`, all driven by `GET /api/partner/application`. The actual
/// field-editing step reuses `PartnerOnboardingScreen` (pushed with `initialProfile` when
/// resuming a draft) rather than a second form.
class BecomeProviderScreen extends ConsumerStatefulWidget {
  const BecomeProviderScreen({super.key});

  @override
  ConsumerState<BecomeProviderScreen> createState() => _BecomeProviderScreenState();
}

class _BecomeProviderScreenState extends ConsumerState<BecomeProviderScreen> {
  PartnerApplication? _application;
  bool _loading = true;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final application = await ref.read(partnerProfileRepositoryProvider).getApplication();
      if (mounted) setState(() => _application = application);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _startOrEdit() async {
    final profile = _application?.profile;
    await context.push('/partner-onboarding', extra: profile);
    if (mounted) _load();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(partnerProfileRepositoryProvider).submitApplication();
      await _load();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _reapply() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(partnerProfileRepositoryProvider).reapply();
      await _load();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Become a Service Provider')),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'List your bikes, offer roadside assistance, and grow your business with '
                      'BIKIE — without losing anything about your Rider account.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 20),
                    if (_error != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                      ),
                    _buildStatusCard(context),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildStatusCard(BuildContext context) {
    final status = _application?.status ?? 'NOT_APPLIED';
    final profile = _application?.profile;

    switch (status) {
      case 'NOT_APPLIED':
        return _card(
          context,
          title: 'Tell us about your business',
          body:
              'Create your Service Provider profile and start operating right away — no admin '
              'approval needed. Verification is an optional trust step you can request anytime '
              'to earn the ✓ BIKIE Verified badge.',
          action: ElevatedButton(onPressed: _startOrEdit, child: const Text('Create my Service Provider profile')),
        );
      case 'DRAFT':
        return _card(
          context,
          title: 'Your profile is live',
          body: 'Your Service Provider profile is already active. Add details anytime, and get '
              'verified whenever you want the ✓ BIKIE Verified badge.',
          action: Wrap(
            spacing: 12,
            children: [
              OutlinedButton(onPressed: _startOrEdit, child: const Text('Edit details')),
              ElevatedButton(
                onPressed: _busy ? null : _submit,
                child: Text(_busy ? 'Please wait…' : 'Get Verified'),
              ),
            ],
          ),
        );
      case 'MORE_INFORMATION_REQUIRED':
        return _card(
          context,
          title: 'More information needed',
          body: profile?.reviewNote ?? 'Please review and update your profile.',
          action: Wrap(
            spacing: 12,
            children: [
              OutlinedButton(onPressed: _startOrEdit, child: const Text('Edit details')),
              ElevatedButton(
                onPressed: _busy ? null : _submit,
                child: Text(_busy ? 'Please wait…' : 'Resubmit for verification'),
              ),
            ],
          ),
        );
      case 'PENDING_VERIFICATION':
        return _card(
          context,
          title: 'Verification pending — you can operate now',
          body: 'Your profile is already live. You\'re not blocked while an admin reviews your '
              'optional verification.${profile?.submittedAt != null ? ' Submitted ${DateTime.parse(profile!.submittedAt!).toLocal().toString().split(' ').first}.' : ''}',
        );
      case 'REJECTED':
        return _card(
          context,
          title: 'Verification not approved',
          titleColor: Theme.of(context).colorScheme.error,
          body:
              '${profile?.rejectionReason != null ? '${profile!.rejectionReason} ' : ''}Your profile stays active — you can keep operating as an unverified Service Provider.',
          action: ElevatedButton(
            onPressed: _busy ? null : _reapply,
            child: Text(_busy ? 'Please wait…' : 'Re-apply for verification'),
          ),
        );
      case 'SUSPENDED':
        return _card(
          context,
          title: 'Service Provider account suspended',
          titleColor: Theme.of(context).colorScheme.error,
          body: profile?.reviewNote ?? 'Contact support to appeal this decision.',
        );
      case 'APPROVED':
        return _card(
          context,
          title: "You're a verified Service Provider",
          body: 'Switch to Service Provider mode from your Profile to get started.',
        );
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _card(
    BuildContext context, {
    required String title,
    required String body,
    Color? titleColor,
    Widget? action,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(20)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(color: titleColor)),
          const SizedBox(height: 8),
          Text(body, style: Theme.of(context).textTheme.bodyMedium),
          if (action != null) ...[const SizedBox(height: 16), action],
        ],
      ),
    );
  }
}
