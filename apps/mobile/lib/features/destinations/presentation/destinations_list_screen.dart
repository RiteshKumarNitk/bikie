import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/async_value_view.dart';
import '../domain/destination_providers.dart';

class DestinationsListScreen extends ConsumerWidget {
  const DestinationsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final destinations = ref.watch(allDestinationsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Destinations')),
      body: AsyncValueView(
        value: destinations,
        onRetry: () => ref.invalidate(allDestinationsProvider),
        data: (list) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(allDestinationsProvider),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final d = list[index];
              return Card(
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: () => context.push('/destinations/${d.slug}'),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 100,
                        height: 90,
                        child: Image.network(d.imageUrl, fit: BoxFit.cover),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(d.name, style: Theme.of(context).textTheme.titleMedium),
                              const SizedBox(height: 4),
                              Text(d.state, style: Theme.of(context).textTheme.bodySmall),
                              const SizedBox(height: 4),
                              Text('${d.bikeCount} bikes available', style: Theme.of(context).textTheme.bodySmall),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
