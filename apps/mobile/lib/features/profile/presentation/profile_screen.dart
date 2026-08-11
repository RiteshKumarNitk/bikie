import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
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

    // ADR-049 — capability (an active, non-suspended profile), not verification/'APPROVED'.
    final isCapableServiceProvider = user.partnerStatus != null && user.partnerStatus != 'SUSPENDED';
    final storedMode = ref.watch(activeModeProvider);
    final isPartnerMode = resolveActiveMode(user.partnerStatus, storedMode) == 'PARTNER';

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
          // Once in Service Provider mode, there's no UI path back to Rider mode — the
          // underlying dual-capability model is unchanged, only this control is one-directional.
          if (isCapableServiceProvider && !isPartnerMode) ...[
            const SizedBox(height: 16),
            const _ModeSwitch(),
          ],
          const SizedBox(height: 24),
          _PhoneField(initialPhone: user.phone),
          const SizedBox(height: 24),
          _ProfileTile(
            icon: Icons.notifications_none,
            label: 'Notifications',
            badgeCount: unreadNotifications,
            onTap: () => context.push('/notifications'),
          ),
          if (isPartnerMode) ...const [_PartnerProfileSection()] else ...[_RiderProfileSection(isCapableServiceProvider: isCapableServiceProvider)],
          _ProfileTile(icon: Icons.chat_bubble_outline, label: 'Messages', onTap: () => context.push('/messages')),
          _ProfileTile(icon: Icons.card_giftcard, label: 'Referrals', onTap: () => context.push('/referrals')),
          const SizedBox(height: 24),
          const _SignOutButton(),
        ],
      ),
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

/// ADR-046b/ADR-049 — shown once the account has Service Provider CAPABILITY (an active,
/// non-suspended profile — verification status irrelevant here) and is currently in Rider mode;
/// mirrors web's Navbar "Switch Mode" control. Only offers Rider -> Service Provider — once in
/// Service Provider mode there's no UI path back (see the gate at this widget's call site), the
/// underlying dual-capability model is unaffected. Switching is server-verified (see
/// [switchActiveMode], including a membership check) — this button being visible is a UX
/// convenience, not the actual authorization.
class _ModeSwitch extends ConsumerStatefulWidget {
  const _ModeSwitch();

  @override
  ConsumerState<_ModeSwitch> createState() => _ModeSwitchState();
}

class _ModeSwitchState extends ConsumerState<_ModeSwitch> {
  bool _busy = false;

  Future<void> _handleSwitch() async {
    setState(() => _busy = true);
    final result = await switchActiveMode(ref, 'PARTNER');
    if (!mounted) return;
    setState(() => _busy = false);

    switch (result) {
      case SwitchModeResult.success:
        // Replaces the stack root (not a push) so no Rider-mode screens linger underneath the
        // new tab set, and lands on Home so the freshly-swapped tabs render immediately.
        context.go('/');
      case SwitchModeResult.notCapable:
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("You don't have a Service Provider profile yet.")),
        );
        context.push('/become-provider');
      case SwitchModeResult.membershipRequired:
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('An active Service Provider membership is required for Service Provider mode.')),
        );
        context.push('/partner-membership');
      case SwitchModeResult.networkError:
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Couldn't verify Service Provider status. Please try again.")),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: _busy ? null : _handleSwitch,
      icon: _busy
          ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
          : const Icon(Icons.swap_horiz),
      label: Text(_busy ? 'Checking…' : 'Switch to Service Provider mode'),
    );
  }
}

/// The Rider-specific tiles, shown whenever the account is currently in Rider mode.
class _RiderProfileSection extends StatelessWidget {
  const _RiderProfileSection({required this.isCapableServiceProvider});

  final bool isCapableServiceProvider;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _ProfileTile(
          icon: Icons.badge_outlined,
          label: 'Rider Details',
          onTap: () => context.push('/onboarding'),
        ),
        // ADR-046b — an already-approved partner uses the mode switch above instead; this tile
        // is for starting/resuming/checking an application.
        if (!isCapableServiceProvider)
          _ProfileTile(
            icon: Icons.storefront_outlined,
            label: 'Become a Service Provider',
            onTap: () => context.push('/become-provider'),
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
    setState(() => _loading = true);
    try {
      final profile = await ref.read(partnerProfileRepositoryProvider).getProfile();
      if (mounted) {
        await context.push('/partner-onboarding', extra: profile);
        ref.invalidate(partnerProfileSummaryProvider);
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
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
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Phone number updated')));
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
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
