import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/async_value_view.dart';
import '../../bikes/presentation/widgets/bike_card.dart';
import '../domain/destination_providers.dart';

class DestinationDetailScreen extends ConsumerWidget {
  const DestinationDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(destinationDetailProvider(slug));

    return Scaffold(
      body: AsyncValueView(
        value: detail,
        onRetry: () => ref.invalidate(destinationDetailProvider(slug)),
        data: (destination) => CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 220,
              pinned: true,
              flexibleSpace: FlexibleSpaceBar(
                title: Text(destination.name),
                background: Image.network(destination.imageUrl, fit: BoxFit.cover),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(destination.state, style: Theme.of(context).textTheme.bodyMedium),
                    if (destination.description != null) ...[
                      const SizedBox(height: 12),
                      Text(destination.description!),
                    ],
                    const SizedBox(height: 20),
                    Text('Bikes here', style: Theme.of(context).textTheme.titleMedium),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 0.68,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) => BikeCard(bike: destination.bikes[index]),
                  childCount: destination.bikes.length,
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }
}
