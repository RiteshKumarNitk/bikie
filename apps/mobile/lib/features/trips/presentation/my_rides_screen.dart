import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/async_value_view.dart';
import '../../../core/widgets/empty_state.dart';
import '../data/trip_models.dart';
import '../domain/trip_providers.dart';

/// `/dashboard/trips` on mobile — "My Rides": organized / joined / requested,
/// plus the reputation stat tiles from `RideStatsDTO` (`GET /api/trips/mine`).
class MyRidesScreen extends ConsumerWidget {
  const MyRidesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final myRides = ref.watch(myRidesProvider);

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('My Rides'),
          actions: [
            IconButton(
              tooltip: 'Requests',
              icon: const Icon(Icons.inbox_outlined),
              onPressed: () => context.push('/requests'),
            ),
          ],
          bottom: const TabBar(tabs: [
            Tab(text: 'Organized'),
            Tab(text: 'Joined'),
            Tab(text: 'Requested'),
          ]),
        ),
        body: AsyncValueView(
          value: myRides,
          onRetry: () => ref.invalidate(myRidesProvider),
          data: (mine) => RefreshIndicator(
            onRefresh: () async => ref.invalidate(myRidesProvider),
            child: Column(
              children: [
                _StatsRow(stats: mine.stats),
                Expanded(
                  child: TabBarView(
                    children: [
                      _RideList(rides: mine.organized, emptyMessage: "You haven't organized a ride yet."),
                      _RideList(rides: mine.joined, emptyMessage: "You haven't joined any rides yet."),
                      _RideList(rides: mine.requested, emptyMessage: 'No pending join requests.'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.stats});

  final RideStats stats;

  @override
  Widget build(BuildContext context) {
    final tiles = [
      ('Organized', '${stats.ridesOrganized}'),
      ('Requests sent', '${stats.requestsSent}'),
      ('Approved', '${stats.requestsApproved}'),
      ('Approval rate', stats.approvalRate == null ? '—' : '${stats.approvalRate}%'),
    ];
    return SizedBox(
      height: 88,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.all(16),
        itemCount: tiles.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final (label, value) = tiles[index];
          return Container(
            width: 120,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 2),
                Text(label, style: Theme.of(context).textTheme.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _RideList extends StatelessWidget {
  const _RideList({required this.rides, required this.emptyMessage});

  final List<TripSummary> rides;
  final String emptyMessage;

  @override
  Widget build(BuildContext context) {
    if (rides.isEmpty) {
      return EmptyState(icon: Icons.map_outlined, title: emptyMessage);
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      itemCount: rides.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final trip = rides[index];
        return Card(
          child: ListTile(
            onTap: () => context.push('/trips/${trip.slug}'),
            leading: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.network(trip.imageUrl, width: 52, height: 52, fit: BoxFit.cover),
            ),
            title: Text(trip.title, maxLines: 1, overflow: TextOverflow.ellipsis),
            subtitle: Text('${trip.startDate.split('T').first} · ${trip.seatsLeft}/${trip.seatsTotal} seats'),
            trailing: const Icon(Icons.chevron_right),
          ),
        );
      },
    );
  }
}
