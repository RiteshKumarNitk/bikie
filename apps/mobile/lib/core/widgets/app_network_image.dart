import 'package:flutter/material.dart';

/// `Image.network` with the two states it lacks on its own: a neutral placeholder while loading
/// and a branded fallback when the URL is empty or the image can't be loaded (removed upload,
/// offline, bad URL). Without these, a broken image rendered Flutter's error box or an empty
/// gap of the wrong size. Sizing and `fit` behave exactly like `Image.network`.
class AppNetworkImage extends StatelessWidget {
  const AppNetworkImage(
    this.url, {
    super.key,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.fallbackIcon = Icons.image_outlined,
  });

  final String? url;
  final double? width;
  final double? height;
  final BoxFit fit;
  final IconData fallbackIcon;

  @override
  Widget build(BuildContext context) {
    final source = url?.trim() ?? '';
    if (source.isEmpty) return _placeholder(context, showIcon: true);
    return Image.network(
      source,
      width: width,
      height: height,
      fit: fit,
      loadingBuilder: (context, child, progress) => progress == null ? child : _placeholder(context, showIcon: false),
      errorBuilder: (context, error, stackTrace) => _placeholder(context, showIcon: true),
    );
  }

  Widget _placeholder(BuildContext context, {required bool showIcon}) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      width: width,
      height: height,
      color: scheme.surfaceContainerHighest,
      alignment: Alignment.center,
      child: showIcon
          ? LayoutBuilder(
              builder: (context, constraints) {
                final shortest = constraints.biggest.shortestSide;
                final size = shortest.isFinite ? (shortest * 0.4).clamp(16.0, 48.0) : 32.0;
                return Icon(fallbackIcon, size: size, color: scheme.onSurfaceVariant);
              },
            )
          : null,
    );
  }
}
