import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// Shown in `main.dart` while `AuthController.bootstrap()` resolves — the
/// very first thing the app displays, before it knows whether there's a
/// stored session.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              height: 88,
              width: 88,
              decoration: BoxDecoration(
                color: AppColors.darkAccent,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(color: AppColors.darkAccent.withValues(alpha: 0.5), blurRadius: 32, spreadRadius: 4),
                ],
              ),
              child: const Center(
                child: Text(
                  'B',
                  style: TextStyle(fontSize: 44, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'BIKIE',
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1.5),
            ),
            const SizedBox(height: 6),
            Text(
              'ANYTIME ANYWHERE — YOUR ONLY COMPANION',
              style: TextStyle(fontSize: 10, letterSpacing: 1.5, color: Colors.white.withValues(alpha: 0.6)),
            ),
            const SizedBox(height: 40),
            SizedBox(
              height: 22,
              width: 22,
              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.darkAccentText),
            ),
          ],
        ),
      ),
    );
  }
}
