import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_logo.dart';
import '../../auth/domain/role_provider.dart';

// Matches `apps/web/app/welcome/welcome.module.css` — a splash-page-only palette, not part of
// the shared design tokens, per the same product decision that page's CSS documents (kept
// scoped to this one screen rather than changing the app-wide accent).
const _splashTop = Color(0xE026258F); // rgba(38,37,143,.88)
const _splashBottom = Color(0xEB1A1960); // rgba(26,25,96,.92)
const _amber = Color(0xFFFFAA00);

/// `/welcome` — mirrors the web page of the same name (`apps/web/app/welcome/page.tsx`): pick
/// Rider or Service Provider, then always continue to `/login` (per ADR-014, not a dedicated
/// signup step — `/login` already offers a "no account? sign up" fallback once a phone number
/// turns out not to exist).
class WelcomeScreen extends ConsumerWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          const DecoratedBox(
            decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [_splashTop, _splashBottom])),
          ),
          Opacity(
            opacity: 0.22,
            child: Image.network(
              'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1400&auto=format&fit=crop',
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const SizedBox.shrink(),
            ),
          ),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                  child: ConstrainedBox(
                    // Centers content on tall/tablet screens but never clips on a short phone
                    // viewport — scrolls instead of a bare centered Column would.
                    constraints: BoxConstraints(minHeight: constraints.maxHeight),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const AppLogo(size: 76, glow: true),
                        const SizedBox(height: 16),
                        const Text(
                          'BIKIE',
                          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1.4),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'ANYTIME ANYWHERE — YOUR ONLY COMPANION',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 10, letterSpacing: 1.5, color: Colors.white.withValues(alpha: 0.6)),
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
                          accent: kBrandOrange,
                          title: "I'm a Biker",
                          description:
                              'Rent a motorbike, create group trips, connect with riders, and access the BIKIE safety panic network.',
                          ctaLabel: 'Join as Rider',
                          onTap: () {
                            ref.read(selectedRoleProvider.notifier).state = 'RENTER';
                            context.go('/login');
                          },
                        ),
                        const SizedBox(height: 14),
                        _RoleCard(
                          emoji: '🔧',
                          accent: _amber,
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
                        GestureDetector(
                          onTap: () => context.go('/login'),
                          child: RichText(
                            text: TextSpan(
                              style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.7)),
                              children: [
                                const TextSpan(text: 'Already have an account? '),
                                const TextSpan(
                                  text: 'Log in',
                                  style: TextStyle(color: kBrandOrange, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.emoji,
    required this.accent,
    required this.title,
    required this.description,
    required this.ctaLabel,
    required this.onTap,
  });

  final String emoji;
  final Color accent;
  final String title;
  final String description;
  final String ctaLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 44,
                  width: 44,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: accent.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(14)),
                  child: Text(emoji, style: const TextStyle(fontSize: 20)),
                ),
                const SizedBox(height: 12),
                Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Colors.white)),
                const SizedBox(height: 6),
                Text(description, style: TextStyle(fontSize: 12.5, color: Colors.white.withValues(alpha: 0.7), height: 1.4)),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                  decoration: BoxDecoration(
                    color: accent,
                    borderRadius: BorderRadius.circular(999),
                    boxShadow: [BoxShadow(color: accent.withValues(alpha: 0.4), blurRadius: 16, offset: const Offset(0, 6))],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(ctaLabel, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white)),
                      const SizedBox(width: 8),
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
