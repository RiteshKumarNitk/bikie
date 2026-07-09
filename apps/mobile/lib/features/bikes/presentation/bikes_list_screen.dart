import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/async_value_view.dart';
import '../../../core/widgets/empty_state.dart';
import '../data/bike_models.dart';
import '../domain/bike_providers.dart';
import 'widgets/bike_card.dart';

class BikesListScreen extends ConsumerWidget {
  const BikesListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final result = ref.watch(bikeSearchResultProvider);
    final params = ref.watch(bikeSearchParamsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Bikes')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: 'Search by city or destination',
              ),
              onSubmitted: (value) {
                ref.read(bikeSearchParamsProvider.notifier).state =
                    params.copyWith(location: value, page: 1);
              },
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _SortChip(
                  label: 'Rating',
                  selected: params.sort == 'rating',
                  onSelected: () => ref.read(bikeSearchParamsProvider.notifier).state =
                      params.copyWith(sort: 'rating', page: 1),
                ),
                const SizedBox(width: 8),
                _SortChip(
                  label: 'Price: low to high',
                  selected: params.sort == 'price_asc',
                  onSelected: () => ref.read(bikeSearchParamsProvider.notifier).state =
                      params.copyWith(sort: 'price_asc', page: 1),
                ),
                const SizedBox(width: 8),
                _SortChip(
                  label: 'Price: high to low',
                  selected: params.sort == 'price_desc',
                  onSelected: () => ref.read(bikeSearchParamsProvider.notifier).state =
                      params.copyWith(sort: 'price_desc', page: 1),
                ),
                const SizedBox(width: 8),
                _SortChip(
                  label: 'Instant booking',
                  selected: params.instantBooking == true,
                  onSelected: () => ref.read(bikeSearchParamsProvider.notifier).state = BikeSearchParams(
                    location: params.location,
                    category: params.category,
                    sort: params.sort,
                    instantBooking: params.instantBooking == true ? null : true,
                    page: 1,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: AsyncValueView(
              value: result,
              onRetry: () => ref.invalidate(bikeSearchResultProvider),
              data: (data) {
                if (data.bikes.isEmpty) {
                  return const EmptyState(
                    icon: Icons.two_wheeler_outlined,
                    title: 'No bikes found',
                    message: 'Try adjusting your search or filters.',
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(bikeSearchResultProvider),
                  child: GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      childAspectRatio: 0.68,
                    ),
                    itemCount: data.bikes.length,
                    itemBuilder: (context, index) => BikeCard(bike: data.bikes[index]),
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

class _SortChip extends StatelessWidget {
  const _SortChip({required this.label, required this.selected, required this.onSelected});

  final String label;
  final bool selected;
  final VoidCallback onSelected;

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(label: Text(label), selected: selected, onSelected: (_) => onSelected());
  }
}
