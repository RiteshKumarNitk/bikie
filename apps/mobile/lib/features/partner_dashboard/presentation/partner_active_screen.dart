import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/empty_state.dart';
import '../../sos/data/sos_model.dart';
import '../data/partner_dashboard_model.dart';
import '../domain/partner_dashboard_providers.dart';

/// Full "Active" tab (ADR-044) — every `SOSSession` this partner is currently the assigned helper
/// on, across every status from `ACTIVE` through `ASSISTANCE_IN_PROGRESS`. Also surfaces this
/// partner's own outstanding offers (made, not yet accepted/rejected by the rider) — otherwise an
/// offer has no visible home anywhere in the app between "Nearby Requests" (which deliberately
/// excludes it once responded to) and here (which only gets it once a rider accepts).
class PartnerActiveScreen extends ConsumerWidget {
  const PartnerActiveScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeAsync = ref.watch(partnerActiveSessionsProvider);
    final pendingAsync = ref.watch(partnerPendingOffersProvider);

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
        onRefresh: () async {
          ref.invalidate(partnerActiveSessionsProvider);
          ref.invalidate(partnerPendingOffersProvider);
        },
        child: activeAsync.when(
          data: (sessions) {
            final pending = pendingAsync.valueOrNull ?? const <PartnerPendingOffer>[];
            if (sessions.isEmpty && pending.isEmpty) {
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
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (pending.isNotEmpty) ...[
                  const _ListSectionHeader(title: 'Waiting for Confirmation'),
                  const SizedBox(height: 8),
                  ...pending.map(
                    (o) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: _PendingCard(offer: o),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                if (sessions.isNotEmpty) ...[
                  const _ListSectionHeader(title: 'Confirmed'),
                  const SizedBox(height: 8),
                  ...sessions.map(
                    (s) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: _ActiveCard(session: s),
                    ),
                  ),
                ],
              ],
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

class _ListSectionHeader extends StatelessWidget {
  const _ListSectionHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(title, style: Theme.of(context).textTheme.titleSmall);
  }
}

class _PendingCard extends StatelessWidget {
  const _PendingCard({required this.offer});

  final PartnerPendingOffer offer;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.hourglass_top, color: Colors.orange),
        title: Text(sosTypeLabels[offer.alertType] ?? offer.alertType),
        subtitle: Text(
          [
            'Waiting for rider to confirm',
            if (offer.distanceMeters != null) _formatDistance(offer.distanceMeters!),
          ].join(' · '),
        ),
        trailing: OutlinedButton(
          onPressed: () => context.push('/sos/${offer.alertId}'),
          child: const Text('Open'),
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
