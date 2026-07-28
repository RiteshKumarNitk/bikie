import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../core/widgets/empty_state.dart';
import '../../auth/domain/auth_controller.dart';
import '../../auth/domain/auth_state.dart';
import '../domain/trip_providers.dart';

/// Ride Feed — the mobile-first take on `/trips`+`/community`: a browsable
/// feed of upcoming Rides, with quick access to "My Rides" and ride creation.
class TripsListScreen extends ConsumerWidget {
  const TripsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trips = ref.watch(tripsProvider);
    final selectedTab = ref.watch(tripTabProvider);
    final isAuthenticated = ref.watch(authControllerProvider.select((s) => s.status)) == AuthStatus.authenticated;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Rides'),
        actions: [
          IconButton(
            tooltip: 'My Rides',
            icon: const Icon(Icons.person_pin_circle_outlined),
            onPressed: () {
              if (!isAuthenticated) {
                context.push('/login');
                return;
              }
              context.push('/rides/mine');
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          if (!isAuthenticated) {
            context.push('/login');
            return;
          }
          context.push('/trips/create');
        },
        icon: const Icon(Icons.add),
        label: const Text('Create Ride'),
      ),
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
                  return EmptyState(
                    icon: Icons.map_outlined,
                    title: 'No rides in this category yet',
                    message: 'Be the first to organize one.',
                    actionLabel: 'Create a Ride',
                    onAction: () {
                      if (!isAuthenticated) {
                        context.push('/login');
                        return;
                      }
                      context.push('/trips/create');
                    },
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(tripsProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
                    itemCount: list.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final trip = list[index];
                      final seatsColor = trip.seatsLeft <= 0
                          ? Theme.of(context).colorScheme.error
                          : trip.seatsLeft <= 2
                              ? AppColors.warning
                              : AppColors.success;
                      return Card(
                        clipBehavior: Clip.antiAlias,
                        child: InkWell(
                          onTap: () => context.push('/trips/${trip.slug}'),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Stack(
                                children: [
                                  AspectRatio(
                                    aspectRatio: 16 / 9,
                                    child: Image.network(trip.imageUrl, fit: BoxFit.cover),
                                  ),
                                  Positioned(
                                    top: 10,
                                    right: 10,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withValues(alpha: 0.6),
                                        borderRadius: BorderRadius.circular(999),
                                      ),
                                      child: Text(
                                        trip.price > 0 ? '₹${trip.price.toStringAsFixed(0)}' : 'Free',
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              Padding(
                                padding: const EdgeInsets.all(12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(trip.title, style: Theme.of(context).textTheme.titleMedium),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Text(
                                          '${trip.type.replaceAll('_', ' ')} · ${trip.difficulty}',
                                          style: Theme.of(context).textTheme.bodySmall,
                                        ),
                                        const Spacer(),
                                        Container(
                                          width: 8,
                                          height: 8,
                                          decoration: BoxDecoration(color: seatsColor, shape: BoxShape.circle),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          trip.seatsLeft > 0 ? '${trip.seatsLeft}/${trip.seatsTotal} seats' : 'Fully booked',
                                          style: Theme.of(context).textTheme.bodySmall,
                                        ),
                                      ],
                                    ),
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
