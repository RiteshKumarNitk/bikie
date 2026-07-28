import 'package:flutter/material.dart';

/// Color tokens ported verbatim from the live `apps/web/app/globals.css`
/// `@theme`/`:root`/`.dark` blocks (NOT from `.docs/UI_GUIDELINES.md`, which
/// documents an earlier near-black dark palette that the site no longer
/// uses — see the Phase 1 mobile-parity audit).
class AppColors {
  AppColors._();

  // Dark (default) — `.dark` block in globals.css
  static const darkBackground = Color(0xFF26258F);
  static const darkSurface = Color(0xFF1E1D72);
  static const darkCard = Color(0xFF1E1D72);
  static const darkForeground = Color(0xFFEDF0F7);
  static const darkSecondary = Color(0xFF1E1D72);
  static const darkAccent = Color(0xFF3B3A91);
  static const darkAccentHover = Color(0xFF2E2D74);
  // #26258F as an icon/text foreground against this background is under
  // WCAG AA contrast. Lighter tint of the same hue for text/icon usages;
  // darkAccent stays literal for button/badge fills. See ADR-009 in
  // .docs/DECISIONS.md and apps/web/app/globals.css --color-accent-text.
  static const darkAccentText = Color(0xFF8585D6);

  // Light — `:root` block in globals.css
  static const lightBackground = Color(0xFFF0F2F5);
  static const lightSurface = Color(0xFFE2E6ED);
  static const lightCard = Color(0xFFFFFFFF);
  static const lightForeground = Color(0xFF0A1628);
  static const lightSecondary = Color(0xFF182244);
  static const lightAccent = Color(0xFF26258F);
  static const lightAccentHover = Color(0xFF1E1D70);
  // #26258F already contrasts well (~10.7:1) against the light background.
  static const lightAccentText = Color(0xFF26258F);

  // Shared
  static const success = Color(0xFF22C55E);
  static const warning = Color(0xFFF59E0B);
}
