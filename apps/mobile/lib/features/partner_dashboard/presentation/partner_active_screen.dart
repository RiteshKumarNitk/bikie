import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/empty_state.dart';
import '../../sos/data/sos_model.dart';
import '../data/partner_dashboard_model.dart';
import '../domain/partner_dashboard_providers.dart';

/// Full "Active" tab (ADR-044) — every `SOSSession` this partner is currently the assigned helper
/// on, across every status from `ACTIVE` through `ASSISTANCE_IN_PROGRESS`.
class PartnerActiveScreen extends ConsumerWidget {
  const PartnerActiveScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeAsync = ref.watch(partnerActiveSessionsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Active Assistance'),
        actions: [
          TextButton(
            onPressed: () => context.push('/partner/history'),
            child: const Text('History'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(partnerActiveSessionsProvider),
        child: activeAsync.when(
          data: (sessions) {
            if (sessions.isEmpty) {
              return ListView(
                children: const [
                  EmptyState(
                    icon: Icons.task_alt_outlined,
                    title: 'Nothing active',
                    message: "You're not currently assisting anyone.",
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: sessions.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) => _ActiveCard(session: sessions[index]),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => EmptyState(
            icon: Icons.error_outline,
            title: "Couldn't load active assistance",
            message: error is ApiException ? error.message : null,
            actionLabel: 'Retry',
            onAction: () => ref.invalidate(partnerActiveSessionsProvider),
          ),
        ),
      ),
    );
  }
}

class _ActiveCard extends StatelessWidget {
  const _ActiveCard({required this.session});

  final PartnerActiveSession session;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.sos, color: Colors.green),
        title: Text(session.riderName),
        subtitle: Text(
          [
            sosTypeLabels[session.alertType] ?? session.alertType,
            if (session.distanceMeters != null) _formatDistance(session.distanceMeters!),
            if (session.etaMinutes != null) 'ETA ~${session.etaMinutes} min',
          ].join(' · '),
        ),
        trailing: OutlinedButton(
          onPressed: () => context.push('/sos/${session.alertId}'),
          child: const Text('Open'),
        ),
      ),
    );
  }
}

String _formatDistance(num meters) =>
    meters < 1000 ? '${meters.round()} m' : '${(meters / 1000).toStringAsFixed(1)} km';
