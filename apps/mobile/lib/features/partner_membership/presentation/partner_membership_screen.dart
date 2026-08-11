import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../data/partner_membership_model.dart';
import '../data/partner_membership_repository.dart';
import '../domain/partner_membership_providers.dart';

/// ADR-051 — mirrors `MembershipScreen`, entirely separate data: a Service Provider's own
/// membership, not the Rider one.
class PartnerMembershipScreen extends ConsumerWidget {
  const PartnerMembershipScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final active = ref.watch(activePartnerMembershipProvider);
    final plans = ref.watch(partnerMembershipPlansProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Service Provider Membership')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(activePartnerMembershipProvider);
          ref.invalidate(partnerMembershipPlansProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            active.when(
              data: (membership) => membership == null
                  ? const SizedBox.shrink()
                  : Card(
                      color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Active: ${membership.plan.name}', style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 4),
                            Text('${membership.daysLeft} days left · ${membership.status}'),
                          ],
                        ),
                      ),
                    ),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 16),
            Text('Plans', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            AsyncValueView(
              value: plans,
              onRetry: () => ref.invalidate(partnerMembershipPlansProvider),
              data: (list) => Column(
                children: list.where((p) => p.isActive).map((plan) => _PlanCard(plan: plan)).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PlanCard extends ConsumerStatefulWidget {
  const _PlanCard({required this.plan});

  final PartnerMembershipPlan plan;

  @override
  ConsumerState<_PlanCard> createState() => _PlanCardState();
}

class _PlanCardState extends ConsumerState<_PlanCard> {
  bool _isPurchasing = false;

  Future<void> _purchase() async {
    final isFree = widget.plan.price == 0;
    setState(() => _isPurchasing = true);
    try {
      if (!isFree) {
        // Mirrors web's pre-Razorpay simulated checkout (ADR-043) — mobile has no native
        // Razorpay integration yet. Only actually works while the server has no live Razorpay
        // keys configured; once configured, purchase must move to web until mobile gets its own
        // real checkout, same caveat the Rider membership screen already carries.
        await Future.delayed(const Duration(milliseconds: 1400));
      }
      final paymentId = isFree ? null : 'DUMMY-${const Uuid().v4()}';
      await ref.read(partnerMembershipRepositoryProvider).purchase(planId: widget.plan.id, paymentId: paymentId);
      ref.invalidate(activePartnerMembershipProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${widget.plan.name} activated!')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _isPurchasing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isFree = widget.plan.price == 0;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.plan.name, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(widget.plan.description, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 8),
            ...widget.plan.benefits.map(
              (b) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  children: [
                    Icon(Icons.check_circle, size: 16, color: AppTheme.accentTextOf(context)),
                    const SizedBox(width: 6),
                    Expanded(child: Text(b)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Text(
                  isFree ? 'Free / ${widget.plan.durationDays} days' : '₹${widget.plan.price.toStringAsFixed(0)} / ${widget.plan.durationDays} days',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const Spacer(),
                ElevatedButton(
                  onPressed: _isPurchasing ? null : _purchase,
                  child: _isPurchasing
                      ? const SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(isFree ? 'Activate' : 'Purchase'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
