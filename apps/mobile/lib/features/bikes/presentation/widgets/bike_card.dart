import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';
import '../../data/bike_models.dart';
import '../../../../core/widgets/app_network_image.dart';

/// Grid layout for [BikeCard]s. Two columns on phones, more on tablets / landscape — and the
/// maximum card width grows with the system font size, so very large text drops to one wider
/// card per row instead of overflowing the fixed-ratio card.
SliverGridDelegate bikeCardGridDelegate(BuildContext context) {
  final textScale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 2.0);
  return SliverGridDelegateWithMaxCrossAxisExtent(
    maxCrossAxisExtent: 240 * textScale,
    mainAxisSpacing: 16,
    crossAxisSpacing: 16,
    childAspectRatio: 0.68,
  );
}

class BikeCard extends StatelessWidget {
  const BikeCard({super.key, required this.bike});

  final BikeSummary bike;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/bikes/${bike.slug}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Always laid out in a fixed-extent grid cell: the photo takes whatever height the
            // text below leaves, so a larger system font shrinks the photo instead of
            // overflowing the card.
            Expanded(
              child: SizedBox(
                width: double.infinity,
                child: AppNetworkImage(bike.imageUrl, fit: BoxFit.cover),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(bike.name, style: Theme.of(context).textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 2),
                  Text(
                    '${bike.brand} · ${bike.city}',
                    style: Theme.of(context).textTheme.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.star, size: 16, color: AppTheme.accentTextOf(context)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${bike.ratingAvg} (${bike.ratingCount})',
                          style: Theme.of(context).textTheme.bodySmall,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      // The price is never truncated, but in a narrow two-column card at larger
                      // font sizes it scales down to fit instead of overflowing the card.
                      Flexible(
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerRight,
                          child: Text(
                            '₹${bike.pricePerDay.toStringAsFixed(0)}/day',
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (bike.instantBooking) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Instant booking',
                        style: Theme.of(context)
                            .textTheme
                            .labelSmall
                            ?.copyWith(color: AppTheme.accentTextOf(context)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
