import 'package:flutter/material.dart';

/// Exact brand hex for the logo mark only (`--color-brand` in `globals.css`) — theme
/// independent by design (ADR-009), never used as a general UI fill.
const Color kBrandOrange = Color(0xFFFF4D1A);

/// The real BIKIE mark (`assets/icon.png`) rendered as a circular badge — mirrors the web's
/// shared `LogoMark` component so the logo looks identical everywhere (intro/welcome/splash)
/// instead of several different hand-drawn approximations of it.
class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.size = 56, this.glow = false});

  final double size;
  final bool glow;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: size,
      width: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white.withValues(alpha: 0.15), width: 2),
        boxShadow: glow
            ? [
                BoxShadow(
                  color: kBrandOrange.withValues(alpha: 0.55),
                  blurRadius: size * 0.55,
                  spreadRadius: size * 0.04,
                ),
              ]
            : null,
      ),
      child: ClipOval(
        child: Image.asset('assets/icon.png', fit: BoxFit.cover),
      ),
    );
  }
}
