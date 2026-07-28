import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../auth/domain/role_provider.dart';

/// `/welcome` — mirrors the web page of the same name: pick Rider or
/// Service Provider, then always continue to `/login` (per ADR-014, not a
/// dedicated signup step — `/login` already offers a "no account? sign up"
/// fallback once a phone number turns out not to exist).
class WelcomeScreen extends ConsumerWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                height: 64,
                width: 64,
                decoration: const BoxDecoration(color: AppColors.darkAccent, shape: BoxShape.circle),
                child: const Center(
                  child: Text('B', style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'BIKIE',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1.2),
              ),
              const SizedBox(height: 4),
              Text(
                'Anytime anywhere — your only companion',
                style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.6)),
              ),
              const SizedBox(height: 16),
              Text(
                'Welcome! How would you like to join BIKIE?',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.85)),
              ),
              const SizedBox(height: 28),
              _RoleCard(
                emoji: '🏍️',
                title: "I'm a Biker",
                description:
                    'Rent a motorbike, create group trips, connect with riders, and access the BIKIE safety panic network.',
                ctaLabel: 'Join as Rider',
                onTap: () {
                  ref.read(selectedRoleProvider.notifier).state = 'RENTER';
                  context.go('/login');
                },
              ),
              const SizedBox(height: 16),
              _RoleCard(
                emoji: '🔧',
                title: 'Service Provider',
                description:
                    'List your bikes for rent, offer roadside assistance, create curated trips, and grow your business.',
                ctaLabel: 'Join as Provider',
                onTap: () {
                  ref.read(selectedRoleProvider.notifier).state = 'PARTNER';
                  context.go('/login');
                },
              ),
              const SizedBox(height: 20),
              TextButton(
                onPressed: () => context.go('/login'),
                child: Text(
                  'Already have an account? Log in',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.emoji,
    required this.title,
    required this.description,
    required this.ctaLabel,
    required this.onTap,
  });

  final String emoji;
  final String title;
  final String description;
  final String ctaLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: Material(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(24),
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 44,
                  width: 44,
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(14)),
                  child: Center(child: Text(emoji, style: const TextStyle(fontSize: 20))),
                ),
                const SizedBox(height: 12),
                Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: Colors.white)),
                const SizedBox(height: 6),
                Text(description, style: TextStyle(fontSize: 12.5, color: Colors.white.withValues(alpha: 0.7), height: 1.4)),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(color: AppColors.darkAccent, borderRadius: BorderRadius.circular(999)),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(ctaLabel, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
                      const SizedBox(width: 6),
                      const Icon(Icons.arrow_forward, size: 14, color: Colors.white),
                    ],
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
