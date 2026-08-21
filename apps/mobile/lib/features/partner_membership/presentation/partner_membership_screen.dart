import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../core/widgets/app_toast.dart';
import '../data/partner_membership_model.dart';
import '../data/partner_membership_repository.dart';
import '../domain/partner_membership_providers.dart';

/// ADR-051/056 — mirrors `MembershipScreen`, entirely separate data: a Service Provider's own
/// membership, not the Rider one.
///
/// ADR-056 — this is the mandatory next stop after `/partner-onboarding` (never a gate: "Skip
/// for Now" always reaches `/`, the Partner Home). Reached from both onboarding and later,
/// self-service, via the same route — mirrors web's `/partner/membership`.
class PartnerMembershipScreen extends ConsumerWidget {
  const PartnerMembershipScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final active = ref.watch(activePartnerMembershipProvider);
    final plans = ref.watch(partnerMembershipPlansProvider);
    final hasActiveMembership = active.valueOrNull != null;

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
                  ? Card(
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
                              'assistance requests — or skip for now and explore your dashboard first.',
                            ),
                          ],
                        ),
                      ),
                    )
                  // Mirrors web's `/dashboard/membership` — full details (plan, benefits,
                  // remaining time) once active, instead of also leaving the purchasable plan
                  // list below rendered (previously unconditional — a provider who'd just
                  // activated still saw a live "Purchase"/"Activate" button for the same plan).
                  : _ActivePartnerMembershipCard(membership: membership),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            if (!hasActiveMembership) ...[
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
              const SizedBox(height: 12),
              Center(
                child: TextButton(
                  onPressed: () => context.go('/'),
                  child: const Text('Skip for Now — explore the dashboard first'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ActivePartnerMembershipCard extends StatelessWidget {
  const _ActivePartnerMembershipCard({required this.membership});

  final PartnerMembership membership;

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

/// Mirrors web's `billingPeriodLabel` in `apps/web/app/(main)/partner/membership/page.tsx`.
String _billingPeriodLabel(int durationDays) {
  if (durationDays == 30) return '/month';
  if (durationDays == 365) return '/year';
  return '/ $durationDays days';
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
                  isFree
                      ? 'Free ${_billingPeriodLabel(widget.plan.durationDays)}'
                      : '₹${widget.plan.price.toStringAsFixed(0)}${_billingPeriodLabel(widget.plan.durationDays)}',
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
