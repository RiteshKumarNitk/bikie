import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Mirrors `apps/web/components/ui/Toast.tsx`'s `ToastVariant` — same four variants, same
/// intent, different platform-native rendering (a themed `SnackBar` here vs a custom overlay on
/// web, since Flutter already has a first-class bottom notification widget).
enum AppToastVariant { success, error, warning, info }

/// Global toast/notification helper. Wraps Flutter's own `SnackBar` — already themed app-wide via
/// `AppTheme`'s `snackBarTheme` (floating, rounded, card-colored) — with consistent variant
/// coloring/iconography and an explicit dismiss action, so every screen shows the same
/// success/error/warning/info feedback instead of each screen inventing its own bare
/// `SnackBar(content: Text(...))` (as most of this app's screens did before this helper existed).
/// Reused, not replaced: this still goes through `ScaffoldMessenger`, so it inherits the app's
/// existing swipe-to-dismiss, queuing, and Material 3 floating behavior for free.
void showAppToast(
  BuildContext context,
  String message, {
  AppToastVariant variant = AppToastVariant.info,
}) {
  final messenger = ScaffoldMessenger.of(context);
  final scheme = Theme.of(context).colorScheme;
  final (background, icon) = switch (variant) {
    AppToastVariant.success => (AppColors.success, Icons.check_circle_outline),
    AppToastVariant.error => (scheme.error, Icons.error_outline),
    AppToastVariant.warning => (AppColors.warning, Icons.warning_amber_outlined),
    AppToastVariant.info => (scheme.primary, Icons.info_outline),
  };

  messenger.hideCurrentSnackBar();
  messenger.showSnackBar(
    SnackBar(
      backgroundColor: background,
      duration: const Duration(seconds: 4),
      content: Row(
        children: [
          Icon(icon, color: Colors.white, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(message, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
          ),
        ],
      ),
      action: SnackBarAction(
        label: 'Dismiss',
        textColor: Colors.white,
        onPressed: messenger.hideCurrentSnackBar,
      ),
    ),
  );
}
