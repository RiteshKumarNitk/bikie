import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/async_value_view.dart';
import '../domain/trip_providers.dart';

class TripDetailScreen extends ConsumerWidget {
  const TripDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(tripDetailProvider(slug));

    return Scaffold(
      body: AsyncValueView(
        value: detail,
        onRetry: () => ref.invalidate(tripDetailProvider(slug)),
        data: (trip) => CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 240,
              pinned: true,
              flexibleSpace: FlexibleSpaceBar(
                title: Text(trip.title),
                background: Image.network(trip.imageUrl, fit: BoxFit.cover),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      children: [
                        Chip(label: Text(trip.type.replaceAll('_', ' '))),
                        Chip(label: Text(trip.difficulty)),
                        Chip(label: Text('${trip.seatsLeft}/${trip.seatsTotal} seats left')),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (trip.destination != null)
                      Text('Destination: ${trip.destination!.name}', style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 8),
                    Text(
                      '${trip.startDate.split('T').first} → ${trip.endDate.split('T').first}',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 16),
                    Text(trip.description),
                    const SizedBox(height: 20),
                    Text('Organized by ${trip.organizer.name}', style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Text('Price', style: Theme.of(context).textTheme.bodyMedium),
                        const Spacer(),
                        Text('₹${trip.price.toStringAsFixed(0)}', style: Theme.of(context).textTheme.headlineSmall),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
