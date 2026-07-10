import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../auth/domain/auth_controller.dart';
import '../../auth/domain/auth_state.dart';
import '../../bookings/presentation/create_booking_sheet.dart';
import '../../reviews/domain/review_providers.dart';
import '../../wishlist/domain/wishlist_providers.dart';
import '../data/bike_models.dart';
import '../domain/bike_providers.dart';

class BikeDetailScreen extends ConsumerWidget {
  const BikeDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(bikeDetailProvider(slug));

    return Scaffold(
      body: AsyncValueView(
        value: detail,
        onRetry: () => ref.invalidate(bikeDetailProvider(slug)),
        data: (bike) => _BikeDetailBody(bike: bike),
      ),
    );
  }
}

class _BikeDetailBody extends ConsumerWidget {
  const _BikeDetailBody({required this.bike});

  final BikeDetail bike;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAuthenticated = ref.watch(authControllerProvider.select((s) => s.status)) == AuthStatus.authenticated;
    final reviews = ref.watch(bikeReviewsProvider(bike.slug));
    final wishlistAsync = ref.watch(wishlistProvider);
    final isWishlisted = ref.watch(wishlistProvider.notifier).isWishlisted(bike.id);

    final scrollView = CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 260,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(background: Image.network(bike.imageUrl, fit: BoxFit.cover)),
          actions: [
            IconButton(
              icon: Icon(isWishlisted ? Icons.favorite : Icons.favorite_border),
              onPressed: wishlistAsync.isLoading
                  ? null
                  : () {
                      if (!isAuthenticated) {
                        context.push('/login');
                        return;
                      }
                      ref.read(wishlistProvider.notifier).toggle(bike.id);
                    },
            ),
          ],
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(bike.name, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 4),
                Text('${bike.brand} · ${bike.city}', style: Theme.of(context).textTheme.bodyMedium),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(Icons.star, size: 18, color: AppTheme.accentTextOf(context)),
                    const SizedBox(width: 4),
                    Text('${bike.ratingAvg} (${bike.ratingCount} reviews)'),
                    const Spacer(),
                    Text(
                      '₹${bike.pricePerDay.toStringAsFixed(0)}/day',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ],
                ),
                const Divider(height: 32),
                if (bike.description != null) ...[
                  Text(bike.description!, style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: 20),
                ],
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    if (bike.engineCc != null) _SpecChip(label: '${bike.engineCc} cc'),
                    if (bike.mileageKmpl != null) _SpecChip(label: '${bike.mileageKmpl} km/l'),
                    if (bike.hasAbs) const _SpecChip(label: 'ABS'),
                    if (bike.helmetIncluded) const _SpecChip(label: 'Helmet included'),
                    if (bike.deliveryAvailable) const _SpecChip(label: 'Delivery available'),
                  ],
                ),
                const Divider(height: 32),
                Text('Reviews', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                reviews.when(
                  data: (list) => list.isEmpty
                      ? const Text('No reviews yet.')
                      : Column(
                          children: list
                              .map(
                                (r) => Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Text(r.author.name, style: Theme.of(context).textTheme.titleSmall),
                                          const SizedBox(width: 8),
                                          Icon(Icons.star, size: 14, color: AppTheme.accentTextOf(context)),
                                          Text('${r.rating}'),
                                        ],
                                      ),
                                      Text(r.comment),
                                    ],
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (_, __) => const Text('Could not load reviews.'),
                ),
                const SizedBox(height: 80),
              ],
            ),
          ),
        ),
      ],
    );

    return Stack(
      children: [
        scrollView,
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton(
                onPressed: () {
                  if (!isAuthenticated) {
                    context.push('/login');
                    return;
                  }
                  showCreateBookingSheet(context, bike);
                },
                child: Text(bike.instantBooking ? 'Book instantly' : 'Request to book'),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _SpecChip extends StatelessWidget {
  const _SpecChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(label: Text(label));
  }
}
