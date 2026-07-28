import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers.dart';
import '../../../core/theme/app_theme.dart';

class _IntroSlide {
  const _IntroSlide({required this.emoji, required this.title, required this.description});

  final String emoji;
  final String title;
  final String description;
}

const _slides = [
  _IntroSlide(
    emoji: '🏍️',
    title: 'Rent Any Ride',
    description: 'Find and rent the perfect motorcycle, anywhere in India — hourly, daily, or for a whole trip.',
  ),
  _IntroSlide(
    emoji: '🤝',
    title: 'Ride With Community',
    description: 'Create group rides, request to join ones others are leading, and chat in your own Ride Room.',
  ),
  _IntroSlide(
    emoji: '🆘',
    title: 'Stay Safe, Always',
    description: 'One-tap SOS alerts nearby members and admins the moment something goes wrong on the road.',
  ),
];

/// First-launch-only onboarding carousel — mobile-only, the web has no
/// equivalent. Marks itself seen (`hasSeenIntroProvider` + `AppPreferences`)
/// on Skip/Get Started so it never shows again.
class IntroScreen extends ConsumerStatefulWidget {
  const IntroScreen({super.key});

  @override
  ConsumerState<IntroScreen> createState() => _IntroScreenState();
}

class _IntroScreenState extends ConsumerState<IntroScreen> {
  final _controller = PageController();
  int _page = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await ref.read(appPreferencesProvider).setHasSeenIntro();
    ref.read(hasSeenIntroProvider.notifier).state = true;
    if (mounted) context.go('/welcome');
  }

  @override
  Widget build(BuildContext context) {
    final isLast = _page == _slides.length - 1;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: TextButton(onPressed: _finish, child: const Text('Skip')),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _slides.length,
                onPageChanged: (i) => setState(() => _page = i),
                itemBuilder: (context, index) {
                  final slide = _slides[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(slide.emoji, style: const TextStyle(fontSize: 88)),
                        const SizedBox(height: 32),
                        Text(
                          slide.title,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          slide.description,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _slides.length,
                (i) => AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  height: 8,
                  width: i == _page ? 24 : 8,
                  decoration: BoxDecoration(
                    color: i == _page ? Theme.of(context).colorScheme.primary : AppTheme.accentTextOf(context).withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isLast
                      ? _finish
                      : () => _controller.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeOut),
                  child: Text(isLast ? 'Get Started' : 'Next'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
