import 'package:flutter/material.dart';

/// Widest the app's content ever gets. Every screen is a single phone-style column (lists,
/// forms, cards), so on tablets and landscape phones the column is centered at this width
/// rather than stretched edge-to-edge into unreadably long lines and giant buttons. 840dp is
/// Material 3's "expanded" window-class breakpoint, so ordinary phones (portrait and most
/// landscape) are never constrained.
const double kMaxContentWidth = 840;

/// Upper bound on the system font-size setting the app honors. Large accessibility sizes are
/// still respected up to 1.4x, but past that, fixed-height chrome (bottom navigation labels,
/// chips, app bars) starts clipping on small phones rather than getting more readable.
const double kMaxTextScaleFactor = 1.4;

/// Mounted once in `MaterialApp.builder`, above every route, dialog and bottom sheet — so these
/// two rules apply app-wide without every screen having to repeat them.
class ResponsiveFrame extends StatelessWidget {
  const ResponsiveFrame({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    return MediaQuery(
      data: mediaQuery.copyWith(
        textScaler: mediaQuery.textScaler.clamp(minScaleFactor: 1, maxScaleFactor: kMaxTextScaleFactor),
      ),
      child: ColoredBox(
        // Fills the gutters either side of the centered column on wide screens.
        color: Theme.of(context).scaffoldBackgroundColor,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: kMaxContentWidth),
            // `Center` loosens constraints; re-tighten so the navigator still fills the column.
            child: SizedBox.expand(child: child),
          ),
        ),
      ),
    );
  }
}
