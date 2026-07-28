import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../core/widgets/empty_state.dart';
import '../data/trip_models.dart';
import '../data/trip_repository.dart';
import '../domain/trip_providers.dart';

/// `/dashboard/requests` on mobile — every pending join request across all
/// rides the caller organizes (`GET /api/requests/pending`), with inline
/// approve/reject calling the same endpoints as the per-ride organizer panel.
class RideRequestsScreen extends ConsumerWidget {
  const RideRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requests = ref.watch(allPendingRequestsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Requests')),
      body: AsyncValueView(
        value: requests,
        onRetry: () => ref.invalidate(allPendingRequestsProvider),
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(
              icon: Icons.inbox_outlined,
              title: 'No pending requests',
              message: 'Join requests for rides you organize will show up here.',
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(allPendingRequestsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) => _RequestInboxCard(request: list[index]),
            ),
          );
        },
      ),
    );
  }
}

class _RequestInboxCard extends ConsumerStatefulWidget {
  const _RequestInboxCard({required this.request});

  final RideJoinRequest request;

  @override
  ConsumerState<_RequestInboxCard> createState() => _RequestInboxCardState();
}

class _RequestInboxCardState extends ConsumerState<_RequestInboxCard> {
  bool _isDeciding = false;

  Future<void> _decide(bool approve) async {
    setState(() => _isDeciding = true);
    try {
      final repo = ref.read(tripRepositoryProvider);
      if (approve) {
        await repo.approveRequest(widget.request.tripSlug, widget.request.id);
      } else {
        await repo.rejectRequest(widget.request.tripSlug, widget.request.id);
      }
      ref.invalidate(allPendingRequestsProvider);
      ref.invalidate(myRidesProvider);
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _isDeciding = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final request = widget.request;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundImage: request.rider.image != null ? NetworkImage(request.rider.image!) : null,
                  child: request.rider.image == null ? Text(request.rider.name[0]) : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(request.rider.name, style: Theme.of(context).textTheme.titleSmall),
                      Text(
                        'Requested to join ${request.tripTitle}',
                        style: Theme.of(context).textTheme.bodySmall,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (request.message != null && request.message!.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text('"${request.message}"', style: Theme.of(context).textTheme.bodySmall),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isDeciding ? null : () => _decide(true),
                    child: const Text('Approve'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isDeciding ? null : () => _decide(false),
                    child: const Text('Reject'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
