import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Shared corner radius, matching Tailwind's `rounded-3xl` (24px) used
/// across the web app's cards and glass panels (`packages/ui/src/card.tsx`).
const double kCardRadius = 24;

/// Matches Tailwind's `rounded-xl` (12px), the dominant radius for text
/// inputs across the web app's forms (e.g. `ReportModal.tsx`,
/// `RideActionsPanel.tsx`'s request textarea) — distinct from card radius.
const double kInputRadius = 12;

/// Web buttons (`packages/ui/src/button.tsx`) are `rounded-full` (a true
/// stadium shape), not `rounded-3xl` — buttons and cards use different
/// radii on the web and should not share `kCardRadius`.
const double kButtonHeight = 44; // Tailwind `h-11`, the Button component's default "md" size.

/// Bundled locally (`assets/fonts/Inter-Variable.ttf`) rather than fetched at
/// runtime via the `google_fonts` package — a runtime fetch from
/// fonts.gstatic.com crashes the app on any device/emulator without general
/// internet DNS (confirmed on a fresh Android emulator during Phase 1
/// verification). See ADR-008 in `.docs/DECISIONS.md`.
const String kFontFamily = 'Inter';

class AppTheme {
  AppTheme._();

  /// Accent color for icons/text/labels (not button or badge fills — use
  /// `Theme.of(context).colorScheme.primary` for those). See the contrast
  /// note on `AppColors.darkAccentText`.
  static Color accentTextOf(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? AppColors.darkAccentText
        : AppColors.lightAccentText;
  }

  static ThemeData get dark => _build(
        brightness: Brightness.dark,
        background: AppColors.darkBackground,
        surface: AppColors.darkSurface,
        card: AppColors.darkCard,
        foreground: AppColors.darkForeground,
        secondary: AppColors.darkSecondary,
        accent: AppColors.darkAccent,
        accentHover: AppColors.darkAccentHover,
      );

  static ThemeData get light => _build(
        brightness: Brightness.light,
        background: AppColors.lightBackground,
        surface: AppColors.lightSurface,
        card: AppColors.lightCard,
        foreground: AppColors.lightForeground,
        secondary: AppColors.lightSecondary,
        accent: AppColors.lightAccent,
        accentHover: AppColors.lightAccentHover,
      );

  static ThemeData _build({
    required Brightness brightness,
    required Color background,
    required Color surface,
    required Color card,
    required Color foreground,
    required Color secondary,
    required Color accent,
    required Color accentHover,
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
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.resolveWith(
            (states) => states.contains(WidgetState.pressed) ? accentHover : accent,
          ),
          foregroundColor: const WidgetStatePropertyAll(Colors.white),
          padding: const WidgetStatePropertyAll(EdgeInsets.symmetric(horizontal: 24, vertical: 14)),
          minimumSize: const WidgetStatePropertyAll(Size(64, kButtonHeight)),
          shape: const WidgetStatePropertyAll(StadiumBorder()),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: foreground,
          side: BorderSide(color: secondary),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          minimumSize: const Size(64, kButtonHeight),
          shape: const StadiumBorder(),
        ),
      ),
      // `accent` (`#3B3A91`) is a *fill* color (buttons/badges) — as text/icon color against
      // the dark background it's ~1.8:1 contrast, well under WCAG AA (see ADR-009 in
      // .docs/DECISIONS.md, and `accentTextOf()` above for the same fix applied where a
      // BuildContext is available). `foreground` is this theme's near-white/near-black text
      // color, always readable against `background` regardless of brightness — TextButtons are
      // secondary actions read as plain text (Skip, "Don't have an account? Sign up", etc.),
      // not accent-branded links, so this is the correct default rather than a low-contrast one.
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: foreground,
          shape: const StadiumBorder(),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: card,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(kInputRadius),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: card,
        selectedColor: accent,
        labelStyle: textTheme.bodyMedium!,
        shape: const StadiumBorder(),
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
