import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/empty_state.dart';
import '../../sos/data/sos_model.dart';
import '../data/partner_dashboard_model.dart';
import '../domain/partner_dashboard_providers.dart';

/// "Completed Assistance"/"Assistance History" (ADR-046b) — every finished
/// (COMPLETED/CANCELLED) `SOSSession` this partner was the helper on, newest first.
class PartnerHistoryScreen extends ConsumerWidget {
  const PartnerHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(partnerHistoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Assistance History')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(partnerHistoryProvider),
        child: historyAsync.when(
          data: (sessions) {
            if (sessions.isEmpty) {
              return ListView(
                children: const [
                  EmptyState(
                    icon: Icons.history_outlined,
                    title: 'No history yet',
                    message: "Completed and cancelled assistance sessions will show up here.",
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: sessions.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) => _HistoryCard(session: sessions[index]),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => EmptyState(
            icon: Icons.error_outline,
            title: "Couldn't load history",
            message: error is ApiException ? error.message : null,
            actionLabel: 'Retry',
            onAction: () => ref.invalidate(partnerHistoryProvider),
          ),
        ),
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.session});

  final PartnerHistorySession session;

  @override
  Widget build(BuildContext context) {
    final isCancelled = session.status == 'CANCELLED';
    final when = session.completedAt ?? session.cancelledAt;
    return Card(
      child: ListTile(
        leading: Icon(isCancelled ? Icons.cancel_outlined : Icons.check_circle_outline, color: isCancelled ? Colors.grey : Colors.green),
        title: Text(session.riderName),
        subtitle: Text(
          [
            sosTypeLabels[session.alertType] ?? session.alertType,
            isCancelled ? 'Cancelled' : 'Completed',
            if (session.rating != null) '★ ${session.rating}',
            if (when != null) DateTime.parse(when).toLocal().toString().split(' ').first,
          ].join(' · '),
        ),
        trailing: OutlinedButton(
          onPressed: () => context.push('/sos/${session.alertId}'),
          child: const Text('View'),
        ),
      ),
    );
  }
}
