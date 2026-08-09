import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../auth/domain/auth_controller.dart';
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

    final isPartner = user.role == 'PARTNER';

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
          if (isPartner) ...const [_PartnerProfileSection()] else ...const [_RiderProfileSection()],
          _ProfileTile(icon: Icons.chat_bubble_outline, label: 'Messages', onTap: () => context.push('/messages')),
          _ProfileTile(icon: Icons.card_giftcard, label: 'Referrals', onTap: () => context.push('/referrals')),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: () => ref.read(authControllerProvider.notifier).signOut(),
            icon: const Icon(Icons.logout),
            label: const Text('Sign out'),
          ),
        ],
      ),
    );
  }
}

/// The Rider-specific tiles — unchanged from before the Partner/Rider profile split, just
/// extracted so `ProfileScreen` can swap them out for `_PartnerProfileSection` by role.
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
      ],
    );
  }
}

/// Mirrors the web's `/partner/settings` (`PartnerSettingsForm.tsx`) from the Profile tab: a
/// Business Profile tile (verification badge, opens the same business-details form onboarding
/// uses, pre-filled for editing) plus the Available/Offline toggle already surfaced persistently
/// in `PartnerAvailabilityBanner` above every partner screen — not duplicated here, just linked.
class _PartnerProfileSection extends ConsumerWidget {
  const _PartnerProfileSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(partnerProfileSummaryProvider);

    return Column(
      children: [
        _ProfileTile(
          icon: Icons.storefront_outlined,
          label: 'Business Profile',
          subtitle: profileAsync.when(
            data: (p) => p == null ? null : (p.isVerified ? 'Verified' : 'Verification pending'),
            loading: () => null,
            error: (_, __) => null,
          ),
          onTap: () async {
            final profile = await ref.read(partnerProfileRepositoryProvider).getProfile();
            if (context.mounted) {
              await context.push('/partner-onboarding', extra: profile);
              ref.invalidate(partnerProfileSummaryProvider);
            }
          },
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
