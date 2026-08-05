import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_logo.dart';

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
            const AppLogo(size: 88, glow: true),
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
