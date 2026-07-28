import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// A persistent bottom-of-screen banner showing the dev-mode OTP code
/// (`GET /api/dev/otp`, gated server-side by `SHOW_OTP_TOAST`) — used as a
/// Scaffold `bottomNavigationBar` rather than a `SnackBar`, since a toast
/// auto-dismisses before there's time to read and re-type a 6-digit code.
class DevOtpBanner extends StatelessWidget {
  const DevOtpBanner({super.key, required this.code});

  final String code;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        color: AppColors.success.withValues(alpha: 0.15),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.vpn_key_outlined, size: 16, color: AppColors.success),
            const SizedBox(width: 8),
            Text(
              'Dev verification code: $code',
              style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
