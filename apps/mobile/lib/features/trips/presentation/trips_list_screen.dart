import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/async_value_view.dart';
import '../../../core/widgets/empty_state.dart';
import '../domain/trip_providers.dart';

class TripsListScreen extends ConsumerWidget {
  const TripsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trips = ref.watch(tripsProvider);
    final selectedTab = ref.watch(tripTabProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Trips')),
      body: Column(
        children: [
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              itemCount: tripTabs.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final tab = tripTabs[index];
                return ChoiceChip(
                  label: Text(tab.replaceAll('-', ' ')),
                  selected: tab == selectedTab,
                  onSelected: (_) => ref.read(tripTabProvider.notifier).state = tab,
                );
              },
            ),
          ),
          Expanded(
            child: AsyncValueView(
              value: trips,
              onRetry: () => ref.invalidate(tripsProvider),
              data: (list) {
                if (list.isEmpty) {
                  return const EmptyState(icon: Icons.map_outlined, title: 'No trips in this category yet');
                }
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(tripsProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: list.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final trip = list[index];
                      return Card(
                        clipBehavior: Clip.antiAlias,
                        child: InkWell(
                          onTap: () => context.push('/trips/${trip.slug}'),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              AspectRatio(aspectRatio: 16 / 9, child: Image.network(trip.imageUrl, fit: BoxFit.cover)),
                              Padding(
                                padding: const EdgeInsets.all(12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(trip.title, style: Theme.of(context).textTheme.titleMedium),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${trip.difficulty} · ${trip.seatsLeft}/${trip.seatsTotal} seats left',
                                      style: Theme.of(context).textTheme.bodySmall,
                                    ),
                                    const SizedBox(height: 8),
                                    Text('₹${trip.price.toStringAsFixed(0)}', style: Theme.of(context).textTheme.titleSmall),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
