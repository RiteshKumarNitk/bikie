import 'package:flutter/material.dart';

/// Color tokens ported verbatim from `.docs/UI_GUIDELINES.md`
/// (source of truth: `apps/web/app/globals.css`).
class AppColors {
  AppColors._();

  // Dark (default)
  static const darkBackground = Color(0xFF0A0E1A);
  static const darkSurface = Color(0xFF0F172A);
  static const darkCard = Color(0xFF111827);
  static const darkForeground = Color(0xFFF8FAFC);
  static const darkSecondary = Color(0xFF1E293B);
  static const darkAccent = Color(0xFF26258F);
  // #26258F as an icon/text foreground against this near-black background is
  // ~1.6:1 contrast (fails WCAG AA). Lighter tint of the same hue for
  // text/icon usages; darkAccent stays literal for button/badge fills. See
  // ADR-011 in .docs/DECISIONS.md and apps/web/app/globals.css --color-accent-text.
  static const darkAccentText = Color(0xFF8585D6);

  // Light
  static const lightBackground = Color(0xFFFAFAFA);
  static const lightSurface = Color(0xFFFFFFFF);
  static const lightCard = Color(0xFFFFFFFF);
  static const lightForeground = Color(0xFF0F172A);
  static const lightSecondary = Color(0xFF1E293B);
  static const lightAccent = Color(0xFF26258F);
  // #26258F already contrasts well (~10.7:1) against the light background.
  static const lightAccentText = Color(0xFF26258F);

  // Shared
  static const success = Color(0xFF22C55E);
  static const warning = Color(0xFFF59E0B);
}
