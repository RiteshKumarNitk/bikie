import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/async_value_view.dart';
import '../data/membership_model.dart';
import '../data/membership_repository.dart';
import '../domain/membership_providers.dart';

class MembershipScreen extends ConsumerWidget {
  const MembershipScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final active = ref.watch(activeMembershipProvider);
    final plans = ref.watch(membershipPlansProvider);

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
              onRetry: () => ref.invalidate(membershipPlansProvider),
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

  final MembershipPlan plan;

  @override
  ConsumerState<_PlanCard> createState() => _PlanCardState();
}

class _PlanCardState extends ConsumerState<_PlanCard> {
  bool _isPurchasing = false;

  Future<void> _purchase() async {
    setState(() => _isPurchasing = true);
    try {
      // Mirrors `apps/web/components/membership/PaymentModal.tsx`'s simulated
      // checkout — no real payment gateway (see .docs/PROJECT.md non-goals).
      await Future.delayed(const Duration(milliseconds: 1400));
      final paymentId = 'DUMMY-${const Uuid().v4()}';
      await ref.read(membershipRepositoryProvider).purchase(planId: widget.plan.id, paymentId: paymentId);
      ref.invalidate(activeMembershipProvider);
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
                    Icon(Icons.check_circle, size: 16, color: Theme.of(context).colorScheme.primary),
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
