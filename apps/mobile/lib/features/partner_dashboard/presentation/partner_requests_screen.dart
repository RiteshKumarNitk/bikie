import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/empty_state.dart';
import '../../sos/data/sos_model.dart';
import '../data/partner_dashboard_model.dart';
import '../domain/partner_dashboard_providers.dart';

/// Full "Requests" tab (ADR-044) — the same eligible-and-open-request list `partner_home_screen`
/// previews, in full, refreshed on pull and whenever `partnerNearbyRequestsProvider` refetches.
class PartnerRequestsScreen extends ConsumerWidget {
  const PartnerRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final nearbyAsync = ref.watch(partnerNearbyRequestsProvider);
    final pendingCount = ref.watch(partnerPendingOffersProvider).valueOrNull?.length ?? 0;

    return Scaffold(
      appBar: AppBar(title: const Text('Nearby Requests')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(partnerNearbyRequestsProvider),
        child: nearbyAsync.when(
          data: (requests) {
            if (requests.isEmpty && pendingCount == 0) {
              return ListView(
                children: const [
                  EmptyState(
                    icon: Icons.check_circle_outline,
                    title: 'No open requests nearby',
                    message: "You'll see assistance requests here as soon as one matches your service area.",
                  ),
                ],
              );
            }
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (pendingCount > 0) ...[
                  Card(
                    color: Colors.orange.withValues(alpha: 0.1),
                    child: ListTile(
                      leading: const Icon(Icons.hourglass_top, color: Colors.orange),
                      title: Text(
                        pendingCount == 1
                            ? 'You have 1 response waiting for rider confirmation'
                            : 'You have $pendingCount responses waiting for rider confirmation',
                      ),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => context.push('/partner/active'),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                ...requests.map(
                  (r) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _RequestCard(request: r),
                  ),
                ),
              ],
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => EmptyState(
            icon: Icons.error_outline,
            title: "Couldn't load requests",
            message: error is ApiException ? error.message : null,
            actionLabel: 'Retry',
            onAction: () => ref.invalidate(partnerNearbyRequestsProvider),
          ),
        ),
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  const _RequestCard({required this.request});

  final PartnerNearbyRequest request;

  @override
  Widget build(BuildContext context) {
    final isHighPriority = request.severity == 'EMERGENCY';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (isHighPriority)
                  Chip(
                    label: const Text('🔴 HIGH PRIORITY'),
                    backgroundColor: Colors.red.withValues(alpha: 0.15),
                    visualDensity: VisualDensity.compact,
                  ),
                const Spacer(),
                Text(_formatDistance(request.distanceMeters), style: Theme.of(context).textTheme.labelMedium),
              ],
            ),
            const SizedBox(height: 8),
            Text(sosTypeLabels[request.type] ?? request.type, style: Theme.of(context).textTheme.titleMedium),
            Text(request.city, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton(
                onPressed: () => context.push('/sos/${request.id}'),
                child: const Text('View'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _formatDistance(num meters) =>
    meters < 1000 ? '${meters.round()} m away' : '${(meters / 1000).toStringAsFixed(1)} km away';
