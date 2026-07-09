import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../bikes/domain/bike_providers.dart';
import '../../bikes/presentation/widgets/bike_card.dart';
import '../../destinations/domain/destination_providers.dart';
import '../domain/home_providers.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final featuredBikes = ref.watch(featuredBikesProvider);
    final destinations = ref.watch(popularDestinationsProvider);
    final testimonials = ref.watch(testimonialsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('BIKIE', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1)),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(featuredBikesProvider);
          ref.invalidate(popularDestinationsProvider);
          ref.invalidate(testimonialsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text('Rent the ride, own the road', style: Theme.of(context).textTheme.headlineSmall),
            ),
            const SizedBox(height: 4),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'Airbnb for motorcycles — find your next ride anywhere in India.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
            const SizedBox(height: 20),
            _SectionHeader(title: 'Featured bikes', onSeeAll: () => context.go('/bikes')),
            SizedBox(
              height: 260,
              child: featuredBikes.when(
                data: (bikes) => ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: bikes.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) => SizedBox(width: 170, child: BikeCard(bike: bikes[index])),
                ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => const Center(child: Text('Could not load bikes')),
              ),
            ),
            const SizedBox(height: 20),
            _SectionHeader(title: 'Popular destinations', onSeeAll: () => context.push('/destinations')),
            SizedBox(
              height: 140,
              child: destinations.when(
                data: (list) => ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final d = list[index];
                    return GestureDetector(
                      onTap: () => context.push('/destinations/${d.slug}'),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Stack(
                          children: [
                            SizedBox(
                              width: 160,
                              height: 140,
                              child: Image.network(d.imageUrl, fit: BoxFit.cover),
                            ),
                            Positioned(
                              left: 8,
                              bottom: 8,
                              child: Text(
                                d.name,
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => const Center(child: Text('Could not load destinations')),
              ),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text('What riders say', style: Theme.of(context).textTheme.titleMedium),
            ),
            const SizedBox(height: 12),
            testimonials.when(
              data: (list) => Column(
                children: list
                    .take(3)
                    .map(
                      (t) => Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('"${t.quote}"', style: Theme.of(context).textTheme.bodyMedium),
                                const SizedBox(height: 8),
                                Text(t.authorName, style: Theme.of(context).textTheme.titleSmall),
                              ],
                            ),
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.onSeeAll});

  final String title;
  final VoidCallback onSeeAll;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const Spacer(),
          TextButton(onPressed: onSeeAll, child: const Text('See all')),
        ],
      ),
    );
  }
}
