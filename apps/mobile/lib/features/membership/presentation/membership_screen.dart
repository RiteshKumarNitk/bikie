import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../core/widgets/app_toast.dart';
import '../data/membership_model.dart';
import '../data/membership_repository.dart';
import '../domain/membership_providers.dart';

class MembershipScreen extends ConsumerWidget {
  const MembershipScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final active = ref.watch(activeMembershipProvider);
    final plans = ref.watch(membershipPlansProvider);
    final hasActiveMembership = active.valueOrNull != null;

    return Scaffold(
      appBar: AppBar(title: const Text('Membership')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(activeMembershipProvider);
          ref.invalidate(membershipPlansProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            active.when(
              // Mirrors web's `/dashboard/membership` — once a rider has an active membership,
              // this shows its full details (plan, benefits, remaining time) instead of the
              // purchasable plan list below, which only renders when there's nothing active yet.
              // Previously the details card and the "Purchase" plan list both rendered
              // unconditionally, so a rider who'd just paid still saw a live "Purchase" button
              // for the exact plan they were already on — this is the fix for that.
              data: (membership) =>
                  membership == null ? const SizedBox.shrink() : _ActiveMembershipCard(membership: membership),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            hasActiveMembership
                ? const SizedBox.shrink()
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 16),
                      Text('Plans', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 12),
                      AsyncValueView(
                        value: plans,
                        onRetry: () => ref.invalidate(membershipPlansProvider),
                        data: (list) => Column(
                          children: list.where((p) => p.isActive).map((plan) => _PlanCard(plan: plan)).toList(),
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

class _ActiveMembershipCard extends StatelessWidget {
  const _ActiveMembershipCard({required this.membership});

  final UserMembership membership;

  @override
  Widget build(BuildContext context) {
    final expiry = DateTime.tryParse(membership.endDate);
    return Card(
      color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                'ACTIVE',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppTheme.accentTextOf(context),
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
            const SizedBox(height: 10),
            Text('${membership.plan.name} Plan', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(
              expiry == null
                  ? '${membership.daysLeft} days remaining'
                  : '${membership.daysLeft} days remaining · Expires ${DateFormat('d MMMM y').format(expiry)}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            if (membership.plan.benefits.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text('Benefits included', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              ...membership.plan.benefits.map(
                (b) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.check_circle, size: 16, color: AppTheme.accentTextOf(context)),
                      const SizedBox(width: 8),
                      Expanded(child: Text(b)),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PlanCard extends ConsumerStatefulWidget {
  const _PlanCard({required this.plan});

  final MembershipPlan plan;

  @override
  ConsumerState<_PlanCard> createState() => _PlanCardState();
}

class _PlanCardState extends ConsumerState<_PlanCard> {
  bool _isPurchasing = false;

  Future<void> _purchase() async {
    setState(() => _isPurchasing = true);
    try {
      // Mirrors web's pre-Razorpay simulated checkout (ADR-043) — mobile has no native Razorpay
      // integration yet (would need the `razorpay_flutter` plugin, a real native-dependency
      // add, not done in this pass). This path only actually works while the server has no live
      // Razorpay keys configured; once `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are set,
      // `POST /api/membership/purchase` starts requiring a verified signature and rejects a
      // bare `paymentId` with a clear `PAYMENT_VERIFICATION_REQUIRED` error (shown below via the
      // normal `ApiException` message) — not a crash, but purchase must move to web until mobile
      // gets its own real checkout.
      await Future.delayed(const Duration(milliseconds: 1400));
      final paymentId = 'DUMMY-${const Uuid().v4()}';
      await ref.read(membershipRepositoryProvider).purchase(planId: widget.plan.id, paymentId: paymentId);
      ref.invalidate(activeMembershipProvider);
      if (mounted) {
        showAppToast(context, 'Subscription purchased successfully', variant: AppToastVariant.success);
      }
    } on ApiException catch (e) {
      if (mounted) {
        showAppToast(context, e.message, variant: AppToastVariant.error);
      }
    } finally {
      if (mounted) setState(() => _isPurchasing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
                  '₹${widget.plan.price.toStringAsFixed(0)} / ${widget.plan.durationDays} days',
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
                      : const Text('Purchase'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
