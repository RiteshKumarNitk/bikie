import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Shared corner radius, matching Tailwind's `rounded-3xl` (24px) used
/// across the web app's cards, buttons, and glass panels.
const double kCardRadius = 24;

/// Bundled locally (`assets/fonts/Inter-Variable.ttf`) rather than fetched at
/// runtime via the `google_fonts` package — a runtime fetch from
/// fonts.gstatic.com crashes the app on any device/emulator without general
/// internet DNS (confirmed on a fresh Android emulator during Phase 1
/// verification). See ADR-008 in `.docs/DECISIONS.md`.
const String kFontFamily = 'Inter';

class AppTheme {
  AppTheme._();

  static ThemeData get dark => _build(
        brightness: Brightness.dark,
        background: AppColors.darkBackground,
        surface: AppColors.darkSurface,
        card: AppColors.darkCard,
        foreground: AppColors.darkForeground,
        secondary: AppColors.darkSecondary,
        accent: AppColors.darkAccent,
      );

  static ThemeData get light => _build(
        brightness: Brightness.light,
        background: AppColors.lightBackground,
        surface: AppColors.lightSurface,
        card: AppColors.lightCard,
        foreground: AppColors.lightForeground,
        secondary: AppColors.lightSecondary,
        accent: AppColors.lightAccent,
      );

  static ThemeData _build({
    required Brightness brightness,
    required Color background,
    required Color surface,
    required Color card,
    required Color foreground,
    required Color secondary,
    required Color accent,
  }) {
    final baseTextTheme =
        brightness == Brightness.dark ? ThemeData.dark().textTheme : ThemeData.light().textTheme;
    final textTheme = baseTextTheme
        .apply(fontFamily: kFontFamily, bodyColor: foreground, displayColor: foreground);

    final colorScheme = ColorScheme(
      brightness: brightness,
      primary: accent,
      onPrimary: Colors.white,
      secondary: secondary,
      onSecondary: foreground,
      surface: surface,
      onSurface: foreground,
      error: const Color(0xFFEF4444),
      onError: Colors.white,
    );

    return ThemeData(
      brightness: brightness,
      scaffoldBackgroundColor: background,
      colorScheme: colorScheme,
      textTheme: textTheme,
      cardColor: card,
      dividerColor: secondary,
      fontFamily: kFontFamily,
      appBarTheme: AppBarTheme(
        backgroundColor: background,
        foregroundColor: foreground,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kCardRadius)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accent,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kCardRadius)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: foreground,
          side: BorderSide(color: secondary),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kCardRadius)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: card,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(kCardRadius),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: card,
        selectedColor: accent,
        labelStyle: textTheme.bodyMedium!,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kCardRadius)),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: card,
        contentTextStyle: textTheme.bodyMedium,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
