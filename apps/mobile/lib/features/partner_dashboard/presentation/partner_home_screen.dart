import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/domain/auth_controller.dart';
import '../../partner_membership/domain/partner_membership_providers.dart';
import '../../sos/data/sos_model.dart';
import '../data/partner_dashboard_model.dart';
import '../domain/partner_dashboard_providers.dart';

/// Partner's dedicated Home — replaces the renter `HomeScreen` for `role == 'PARTNER'` (ADR-044).
/// A live stats + activity dashboard, not a marketplace browse screen: partners don't rent bikes.
///
/// ADR-056 — every stats/nearby/active provider here reads a `requirePartnerCapability`-gated
/// route, which also requires an active membership; a non-member previously just saw everything
/// silently blank (`error: (_, __) => const SizedBox.shrink()`) with no explanation why. The
/// `_ActivationCard` below (self-contained, reads `activePartnerMembershipProvider`) makes the
/// real reason visible without gating anything — mirrors web's `PartnerActivationCard`.
class PartnerHomeScreen extends ConsumerWidget {
  const PartnerHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(authControllerProvider).user;
    final statsAsync = ref.watch(partnerSosDashboardProvider);
    final nearbyAsync = ref.watch(partnerNearbyRequestsProvider);
    final pendingAsync = ref.watch(partnerPendingOffersProvider);
    final activeAsync = ref.watch(partnerActiveSessionsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('BIKIE Partner', style: TextStyle(fontWeight: FontWeight.bold))),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(partnerSosDashboardProvider);
          ref.invalidate(partnerNearbyRequestsProvider);
          ref.invalidate(partnerPendingOffersProvider);
          ref.invalidate(partnerActiveSessionsProvider);
          ref.invalidate(activePartnerMembershipProvider);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            Text(me != null ? 'Hello, ${me.name}' : 'Hello', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 16),
            const _ActivationCard(),
            statsAsync.when(
              data: (stats) => _StatsGrid(stats: stats),
              loading: () => const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator())),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 24),
            _SectionHeader(title: 'Nearby Requests', onSeeAll: () => context.push('/partner/requests')),
            const SizedBox(height: 8),
            nearbyAsync.when(
              data: (requests) => requests.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: Text('No open requests near you right now.'),
                    )
                  : Column(
                      children: requests.take(3).map((r) => _NearbyRequestTile(request: r)).toList(),
                    ),
              loading: () => const LinearProgressIndicator(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 24),
            _SectionHeader(title: 'Waiting for Confirmation', onSeeAll: () => context.push('/partner/active')),
            const SizedBox(height: 8),
            pendingAsync.when(
              data: (offers) => offers.isEmpty
                  ? const SizedBox.shrink()
                  : Column(
                      children: offers.take(3).map((o) => _PendingOfferTile(offer: o)).toList(),
                    ),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 24),
            _SectionHeader(title: 'Active Assistance', onSeeAll: () => context.push('/partner/active')),
            const SizedBox(height: 8),
            activeAsync.when(
              data: (sessions) => sessions.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: Text("You're not assisting anyone right now."),
                    )
                  : Column(
                      children: sessions.take(3).map((s) => _ActiveSessionTile(session: s)).toList(),
                    ),
              loading: () => const LinearProgressIndicator(),
              error: (_, __) => const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }
}

/// Renders nothing while loading or once a membership is active — never a gate, matches web's
/// `PartnerActivationCard`. Stats/nearby/active stay visible underneath (all honestly zero/empty
/// for a brand-new account) so a non-member can still explore the dashboard shape.
class _ActivationCard extends ConsumerWidget {
  const _ActivationCard();

  static const _lockedFeatures = [
    'Receive & accept SOS assistance requests',
    'Go available to riders nearby',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final active = ref.watch(activePartnerMembershipProvider);
    final hasActiveMembership = active.valueOrNull != null;
    if (active.isLoading || hasActiveMembership) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Card(
        color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.08),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Your Service Provider profile is ready.', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 6),
              const Text(
                'Activate your ₹99/month membership to start receiving and responding to '
                'assistance requests.',
              ),
              const SizedBox(height: 10),
              ..._lockedFeatures.map(
                (f) => Padding(
                  padding: const EdgeInsets.only(bottom: 2),
                  child: Row(
                    children: [
                      const Text('🔒 ', style: TextStyle(fontSize: 12)),
                      Expanded(child: Text(f, style: Theme.of(context).textTheme.bodySmall)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () => context.push('/partner-membership'),
                child: const Text('Subscribe — ₹99/month'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.stats});

  final PartnerSosStats stats;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.8,
      children: [
        _StatCard(label: '🚨 Active Requests', value: '${stats.activeRequests}', accent: Colors.red),
        _StatCard(label: "Today's Assistance", value: '${stats.todayAssistanceCount}'),
        _StatCard(label: 'Completed', value: '${stats.completedCount}'),
        _StatCard(
          label: 'Rating',
          value: stats.ratingCount > 0 ? '${stats.ratingAvg.toStringAsFixed(1)} ★' : '—',
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, this.accent});

  final String label;
  final String value;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    final color = accent ?? Theme.of(context).colorScheme.primary;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(value, style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: color, fontWeight: FontWeight.bold)),
            Text(label, style: Theme.of(context).textTheme.labelMedium),
          ],
        ),
      ),
    );
  }
}

class _NearbyRequestTile extends StatelessWidget {
  const _NearbyRequestTile({required this.request});

  final PartnerNearbyRequest request;

  @override
  Widget build(BuildContext context) {
    final isHighPriority = request.severity == 'EMERGENCY';
    return Card(
      child: ListTile(
        leading: isHighPriority ? const Text('🔴', style: TextStyle(fontSize: 20)) : const Text('🟠', style: TextStyle(fontSize: 20)),
        title: Text(sosTypeLabels[request.type] ?? request.type),
        subtitle: Text('${_formatDistance(request.distanceMeters)} · ${request.city}'),
        trailing: FilledButton(
          onPressed: () => context.push('/sos/${request.id}'),
          child: const Text('View'),
        ),
      ),
    );
  }
}

class _PendingOfferTile extends StatelessWidget {
  const _PendingOfferTile({required this.offer});

  final PartnerPendingOffer offer;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.hourglass_top, color: Colors.orange),
        title: Text(sosTypeLabels[offer.alertType] ?? offer.alertType),
        subtitle: const Text('Waiting for rider to confirm'),
        trailing: OutlinedButton(
          onPressed: () => context.push('/sos/${offer.alertId}'),
          child: const Text('Open'),
        ),
      ),
    );
  }
}

class _ActiveSessionTile extends StatelessWidget {
  const _ActiveSessionTile({required this.session});

  final PartnerActiveSession session;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.sos, color: Colors.green),
        title: Text('${session.riderName} → ${sosTypeLabels[session.alertType] ?? session.alertType}'),
        subtitle: Text(session.etaMinutes != null ? 'ETA ~${session.etaMinutes} min' : session.status),
        trailing: OutlinedButton(
          onPressed: () => context.push('/sos/${session.alertId}'),
          child: const Text('Open'),
        ),
      ),
    );
  }
}

String _formatDistance(num meters) =>
    meters < 1000 ? '${meters.round()} m away' : '${(meters / 1000).toStringAsFixed(1)} km away';

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.onSeeAll});

  final String title;
  final VoidCallback onSeeAll;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(title, style: Theme.of(context).textTheme.titleMedium),
        const Spacer(),
        TextButton(onPressed: onSeeAll, child: const Text('See all')),
      ],
    );
  }
}
