import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../auth/domain/auth_controller.dart';
import '../data/profile_repository.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;

    if (user == null) return const SizedBox.shrink();

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
          _ProfileTile(icon: Icons.favorite_border, label: 'Wishlist', onTap: () => context.push('/wishlist')),
          _ProfileTile(icon: Icons.sos, label: 'SOS Emergency', onTap: () => context.push('/sos')),
          _ProfileTile(
            icon: Icons.workspace_premium_outlined,
            label: 'Membership',
            onTap: () => context.push('/membership'),
          ),
          _ProfileTile(icon: Icons.card_giftcard, label: 'Referrals', onTap: () => context.push('/referrals')),
          _ProfileTile(icon: Icons.chat_bubble_outline, label: 'Messages', onTap: () => context.push('/messages')),
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

class _ProfileTile extends StatelessWidget {
  const _ProfileTile({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      trailing: const Icon(Icons.chevron_right),
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
