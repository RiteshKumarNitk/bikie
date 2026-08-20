import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/app_toast.dart';
import '../../auth/domain/auth_controller.dart';
import '../../auth/domain/role_provider.dart';
import '../../notifications/domain/notification_providers.dart';
import '../../onboarding/data/partner_profile_repository.dart';
import '../data/profile_repository.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final unreadNotifications = ref.watch(unreadNotificationCountProvider);

    if (user == null) return const SizedBox.shrink();

    // ADR-053 — server-authoritative, mutually exclusive: this account IS a Service Provider or
    // it isn't, no "mode" to resolve.
    final isPartnerMode = isServiceProviderAccountType(user.accountType);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          CircleAvatar(
            radius: 36,
            child: Text(user.name.isNotEmpty ? user.name[0].toUpperCase() : '?', style: const TextStyle(fontSize: 28)),
          ),
          const SizedBox(height: 12),
          Center(child: Text(user.name, style: Theme.of(context).textTheme.titleLarge)),
          Center(child: Text(user.email, style: Theme.of(context).textTheme.bodyMedium)),
          const SizedBox(height: 24),
          _PhoneField(initialPhone: user.phone),
          const SizedBox(height: 24),
          _ProfileTile(
            icon: Icons.notifications_none,
            label: 'Notifications',
            badgeCount: unreadNotifications,
            onTap: () => context.push('/notifications'),
          ),
          if (isPartnerMode) ...const [_PartnerProfileSection()] else ...const [_RiderProfileSection()],
          _ProfileTile(icon: Icons.chat_bubble_outline, label: 'Messages', onTap: () => context.push('/messages')),
          _ProfileTile(icon: Icons.card_giftcard, label: 'Referrals', onTap: () => context.push('/referrals')),
          const SizedBox(height: 24),
          const _SignOutButton(),
          const SizedBox(height: 16),
          const _AppVersionFooter(),
        ],
      ),
    );
  }
}

/// So a build can be identified from inside the running app itself — `flutter --release`
/// installs and Play Store updates don't otherwise expose this anywhere the user can see.
/// `PackageInfo` reads it straight from the platform (App Info on Android), not `pubspec.yaml`
/// at runtime, so it always matches the actual installed build.
class _AppVersionFooter extends StatelessWidget {
  const _AppVersionFooter();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<PackageInfo>(
      future: PackageInfo.fromPlatform(),
      builder: (context, snapshot) {
        final info = snapshot.data;
        final label = info == null ? '' : 'Version ${info.version} (build ${info.buildNumber})';
        return Center(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.outline),
          ),
        );
      },
    );
  }
}

/// Non-critical cleanup (push-token unregister) is fired-and-forgotten by
/// `AuthController.signOut()` itself, so the only await left on this button's critical path is
/// the sign-out call — this busy state is just feedback while that runs.
class _SignOutButton extends ConsumerStatefulWidget {
  const _SignOutButton();

  @override
  ConsumerState<_SignOutButton> createState() => _SignOutButtonState();
}

class _SignOutButtonState extends ConsumerState<_SignOutButton> {
  bool _busy = false;

  Future<void> _handleSignOut() async {
    setState(() => _busy = true);
    await ref.read(authControllerProvider.notifier).signOut();
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: _busy ? null : _handleSignOut,
      icon: _busy
          ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
          : const Icon(Icons.logout),
      label: Text(_busy ? 'Signing out…' : 'Sign out'),
    );
  }
}

/// The Rider-specific tiles, shown whenever the account's `accountType` is RIDER.
class _RiderProfileSection extends StatelessWidget {
  const _RiderProfileSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _ProfileTile(
          icon: Icons.badge_outlined,
          label: 'Rider Details',
          onTap: () => context.push('/onboarding'),
        ),
        _ProfileTile(
          icon: Icons.storefront_outlined,
          label: 'Service Providers',
          onTap: () => context.push('/partners'),
        ),
        _ProfileTile(icon: Icons.favorite_border, label: 'Wishlist', onTap: () => context.push('/wishlist')),
        _ProfileTile(
          icon: Icons.workspace_premium_outlined,
          label: 'Membership',
          onTap: () => context.push('/membership'),
        ),
        _ProfileTile(
          icon: Icons.support_agent_outlined,
          label: 'Customer Support',
          subtitle: 'Request an account type change',
          onTap: () => context.push('/account-type-request'),
        ),
      ],
    );
  }
}

/// Mirrors the web's `/partner/settings` (`PartnerSettingsForm.tsx`) from the Profile tab: a
/// Business Profile tile (verification badge, opens the same business-details form onboarding
/// uses, pre-filled for editing) plus the Available/Offline toggle already surfaced persistently
/// in `PartnerAvailabilityBanner` above every partner screen — not duplicated here, just linked.
class _PartnerProfileSection extends ConsumerStatefulWidget {
  const _PartnerProfileSection();

  @override
  ConsumerState<_PartnerProfileSection> createState() => _PartnerProfileSectionState();
}

class _PartnerProfileSectionState extends ConsumerState<_PartnerProfileSection> {
  bool _loading = false;

  Future<void> _openBusinessProfile() async {
    // No Partner row yet (freshly-approved Account Type Change Request, or an abandoned signup
    // onboarding) — `getProfile()` hits the capability-gated `/api/partner/profile`, which 403s
    // with "requires an active Service Provider profile" for exactly this case. Skip the network
    // call entirely and go straight to the (empty) creation form instead of surfacing that error.
    final partnerStatus = ref.read(authControllerProvider).user?.partnerStatus;
    if (partnerStatus == null) {
      await context.push('/partner-onboarding');
      ref.invalidate(partnerProfileSummaryProvider);
      return;
    }

    setState(() => _loading = true);
    try {
      final profile = await ref.read(partnerProfileRepositoryProvider).getProfile();
      if (mounted) {
        await context.push('/partner-onboarding', extra: profile);
        ref.invalidate(partnerProfileSummaryProvider);
      }
    } on ApiException catch (e) {
      if (mounted) {
        showAppToast(context, e.message, variant: AppToastVariant.error);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(partnerProfileSummaryProvider);

    return Column(
      children: [
        _ProfileTile(
          icon: Icons.storefront_outlined,
          label: 'Business Profile',
          subtitle: _loading
              ? 'Loading…'
              : profileAsync.when(
                  // FINAL PRODUCT MODEL — verification status is a separate, optional trust
                  // layer: only an APPROVED profile is "Verified", only a submitted one is
                  // "Verification pending"; everything else is plainly "Unverified" (and still
                  // fully operational).
                  data: (p) {
                    if (p == null) return null;
                    switch (p.verificationStatus) {
                      case 'APPROVED':
                        return '✓ Verified';
                      case 'PENDING_VERIFICATION':
                        return 'Verification pending';
                      default:
                        return 'Unverified — fully operational';
                    }
                  },
                  loading: () => null,
                  error: (_, __) => null,
                ),
          onTap: _loading ? () {} : _openBusinessProfile,
        ),
        if (profileAsync.valueOrNull case final p? when p.ratingCount > 0)
          _ProfileTile(
            icon: Icons.star_outline,
            label: 'Service Reviews',
            subtitle: '⭐ ${p.ratingAvg.toStringAsFixed(1)} (${p.ratingCount})',
            onTap: () => context.push('/partner/reviews'),
          ),
        _ProfileTile(
          icon: Icons.workspace_premium_outlined,
          label: 'Membership',
          onTap: () => context.push('/partner-membership'),
        ),
        _ProfileTile(
          icon: Icons.support_agent_outlined,
          label: 'Customer Support',
          subtitle: 'Request an account type change',
          onTap: () => context.push('/account-type-request'),
        ),
      ],
    );
  }
}

class _ProfileTile extends StatelessWidget {
  const _ProfileTile({required this.icon, required this.label, required this.onTap, this.badgeCount = 0, this.subtitle});

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final int badgeCount;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      subtitle: subtitle != null ? Text(subtitle!) : null,
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (badgeCount > 0)
            Container(
              margin: const EdgeInsets.only(right: 6),
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text('$badgeCount', style: const TextStyle(fontSize: 11, color: Colors.white)),
            ),
          const Icon(Icons.chevron_right),
        ],
      ),
      onTap: onTap,
    );
  }
}

class _PhoneField extends ConsumerStatefulWidget {
  const _PhoneField({this.initialPhone});

  final String? initialPhone;

  @override
  ConsumerState<_PhoneField> createState() => _PhoneFieldState();
}

class _PhoneFieldState extends ConsumerState<_PhoneField> {
  late final _controller = TextEditingController(text: widget.initialPhone);
  bool _isSaving = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _isSaving = true);
    try {
      await ref.read(profileRepositoryProvider).updatePhone(_controller.text.trim());
      if (mounted) {
        showAppToast(context, 'Profile updated successfully', variant: AppToastVariant.success);
      }
    } on ApiException catch (e) {
      if (mounted) {
        showAppToast(context, e.message, variant: AppToastVariant.error);
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _controller,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Phone number'),
          ),
        ),
        const SizedBox(width: 8),
        IconButton(
          onPressed: _isSaving ? null : _save,
          icon: _isSaving
              ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.save_outlined),
        ),
      ],
    );
  }
}
