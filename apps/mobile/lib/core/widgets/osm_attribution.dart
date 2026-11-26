import 'package:flutter/material.dart';

/// The visible "© OpenStreetMap contributors" credit OSM's tile usage policy requires on every
/// map. Replaces `flutter_map`'s `SimpleAttributionWidget`, whose fixed, non-shrinking row
/// ("flutter_map | OpenStreetMap contributors") overflowed narrow maps at larger system font
/// sizes. This one keeps the required credit and truncates gracefully instead of overflowing.
/// Place it in a `FlutterMap`'s `children`, like the widget it replaces.
class OsmAttribution extends StatelessWidget {
  const OsmAttribution({super.key});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.bottomRight,
      child: ColoredBox(
        color: Colors.white.withValues(alpha: 0.85),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
          child: Text(
            '© OpenStreetMap contributors',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.black87),
          ),
        ),
      ),
    );
  }
}
