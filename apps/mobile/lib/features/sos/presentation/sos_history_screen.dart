import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/empty_state.dart';
import '../data/sos_model.dart';
import '../domain/sos_providers.dart';

const _typeLabels = {
  'ACCIDENT': '🚨 Accident',
  'LIFE_THREATENING': '🔥 Life Threatening',
  'MEDICAL': '🏥 Medical Emergency',
  'BIKE_BREAKDOWN': '🔧 Bike Breakdown',
  'FLAT_TYRE': '🔩 Flat Tyre',
  'FUEL_EMPTY': '⛽ Fuel Required',
  'BATTERY_ISSUE': '🔋 Battery Issue',
  'LOST': '🗺️ Lost',
  'OTHER': '❗ Other',
};

/// The caller's past SOS alerts (`GET /api/sos/alerts/history`) — no dedicated web page consumes
/// this route yet (it's orphaned there), but the backend has always supported it and the task
/// spec explicitly asks for a mobile history view, so this reuses the existing endpoint as-is.
class SosHistoryScreen extends ConsumerWidget {
  const SosHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(sosHistoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('SOS History')),
      body: history.when(
        data: (entries) {
          if (entries.isEmpty) {
            return const EmptyState(
              icon: Icons.history_outlined,
              title: 'No past alerts',
              message: "You haven't sent any SOS alerts yet.",
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(sosHistoryProvider),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              itemCount: entries.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) => _HistoryCard(entry: entries[index]),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => EmptyState(
          icon: Icons.error_outline,
          title: "Couldn't load your SOS history",
          message: error is ApiException ? error.message : null,
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(sosHistoryProvider),
        ),
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.entry});

  final SOSHistoryEntry entry;

  @override
  Widget build(BuildContext context) {
    final isResolved = entry.status == 'RESOLVED' || entry.status == 'CANCELLED';
    return Card(
      child: InkWell(
        onTap: () => context.push('/sos/${entry.id}'),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      _typeLabels[entry.type] ?? entry.type.replaceAll('_', ' '),
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  Chip(
                    label: Text(entry.status, style: const TextStyle(fontSize: 11)),
                    backgroundColor: isResolved
                        ? Theme.of(context).colorScheme.surfaceContainerHighest
                        : Colors.orange.withValues(alpha: 0.15),
                    padding: EdgeInsets.zero,
                    visualDensity: VisualDensity.compact,
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(entry.city, style: Theme.of(context).textTheme.bodyMedium),
              if (entry.description != null) ...[
                const SizedBox(height: 4),
                Text(entry.description!, maxLines: 2, overflow: TextOverflow.ellipsis),
              ],
              const SizedBox(height: 8),
              Text(
                [
                  entry.createdAt,
                  if (entry.responses.isNotEmpty) '${entry.responses.length} response(s)',
                ].join(' · '),
                style: Theme.of(context).textTheme.labelSmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
