import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:uuid/uuid.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/payments/razorpay_checkout.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../core/widgets/app_toast.dart';
import '../../auth/domain/auth_controller.dart';
import '../data/partner_membership_model.dart';
import '../data/partner_membership_repository.dart';
import '../domain/partner_membership_providers.dart';
import '../domain/partner_subscription_display.dart';

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
            const SizedBox(height: 8),
            // ADR-070 — read-only payment / invoice history.
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.receipt_long_outlined),
              title: const Text('Payment history'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/billing'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActivePartnerMembershipCard extends ConsumerStatefulWidget {
  const _ActivePartnerMembershipCard({required this.membership});

  final PartnerMembership membership;

  @override
  ConsumerState<_ActivePartnerMembershipCard> createState() => _ActivePartnerMembershipCardState();
}

class _ActivePartnerMembershipCardState extends ConsumerState<_ActivePartnerMembershipCard> {
  bool _isCancelling = false;

  Future<void> _cancel() async {
    final validUntil = DateTime.tryParse(widget.membership.endDate);
    final validUntilLabel = validUntil == null ? 'the date above' : DateFormat('d MMMM y').format(validUntil);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel auto-renewal?'),
        content: Text(
          'Your membership will remain active until $validUntilLabel. After cancellation, no further '
          '₹${widget.membership.plan.price.toStringAsFixed(0)} automatic payments will be taken.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep Subscription')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Cancel Auto-Renewal')),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _isCancelling = true);
    try {
      await ref.read(partnerMembershipRepositoryProvider).cancelSubscription();
      ref.invalidate(activePartnerMembershipProvider);
      if (mounted) {
        showAppToast(
          context,
          'Subscription scheduled for cancellation — no further automatic payments will be taken',
          variant: AppToastVariant.success,
        );
      }
    } on ApiException catch (e) {
      if (mounted) showAppToast(context, e.message, variant: AppToastVariant.error);
    } finally {
      if (mounted) setState(() => _isCancelling = false);
    }
  }

  Widget _row(BuildContext context, String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Theme.of(context).hintColor)),
          Text(
            value,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600, color: valueColor),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final membership = widget.membership;
    final expiry = DateTime.tryParse(membership.endDate);
    final state = subscriptionDisplayState(membership);
    final price = membership.plan.price.toStringAsFixed(0);

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
            if (state.kind != SubscriptionDisplayKind.none) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: state.kind == SubscriptionDisplayKind.paymentProblem
                      ? Colors.red.withValues(alpha: 0.1)
                      : Theme.of(context).colorScheme.surface.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Auto-Renewal', style: Theme.of(context).textTheme.titleSmall),
                    Text(
                      '₹$price/month · Automatic payment',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    if (state.kind == SubscriptionDisplayKind.cancelled) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Your subscription has been scheduled for cancellation. No further automatic payments '
                        'will be taken after the current paid period.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      _row(context, 'Current membership valid until', state.validUntilDate!),
                      _row(context, 'Next automatic payment', 'Cancelled'),
                      _row(context, 'Auto-renewal', 'OFF'),
                    ] else if (state.kind == SubscriptionDisplayKind.paymentProblem) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.red.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Auto-payment failed',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(fontWeight: FontWeight.bold, color: Colors.red),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              "We couldn't collect your ₹$price membership renewal payment. Please "
                              'update/check your payment method to keep your membership active.',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.red),
                            ),
                          ],
                        ),
                      ),
                      _row(context, 'Payment status', state.statusLabel!, valueColor: Colors.red),
                      _row(context, 'Membership valid until', state.validUntilDate!),
                    ] else ...[
                      _row(context, 'Next payment', state.nextPaymentDate!),
                      _row(context, 'Amount to be charged', '₹$price'),
                      _row(context, 'Membership renews', state.renewalDate!),
                      _row(context, 'Current membership valid until', state.validUntilDate!),
                      _row(context, 'Auto-renewal', 'ON'),
                      const SizedBox(height: 4),
                      Text(
                        '₹$price will be automatically charged on ${state.nextPaymentDate}. Your membership '
                        'will renew for another month after the successful payment.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                    if (state.kind != SubscriptionDisplayKind.cancelled) ...[
                      const SizedBox(height: 10),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: TextButton(
                          onPressed: _isCancelling ? null : _cancel,
                          style: TextButton.styleFrom(foregroundColor: Colors.red),
                          child: _isCancelling
                              ? const SizedBox(height: 14, width: 14, child: CircularProgressIndicator(strokeWidth: 2))
                              : const Text('Cancel Subscription'),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
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
  bool _isSubscribing = false;

  /// Starts a recurring ₹99/month Razorpay Subscription (distinct from [_purchase]'s one-time
  /// flow — both remain available side by side). Membership does NOT activate here: the server
  /// only stores the Razorpay subscription id against a placeholder row; a webhook-confirmed
  /// charge is what actually grants eligibility. Opens Razorpay's hosted authorization page
  /// externally (no native-SDK subscription flow yet) — the user completes authorization there
  /// and returns to the app, where pull-to-refresh (or the next launch) picks up the activated
  /// state once the webhook has run.
  Future<void> _subscribe() async {
    setState(() => _isSubscribing = true);
    try {
      final repo = ref.read(partnerMembershipRepositoryProvider);
      final result = await repo.startSubscription(planId: widget.plan.id);
      final uri = Uri.tryParse(result.shortUrl);
      if (uri != null) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
      if (mounted) {
        showAppToast(
          context,
          'Complete the payment authorization, then pull to refresh here once done.',
          variant: AppToastVariant.success,
        );
      }
    } on ApiException catch (e) {
      if (mounted) showAppToast(context, e.message, variant: AppToastVariant.error);
    } finally {
      if (mounted) setState(() => _isSubscribing = false);
    }
  }

  Future<void> _purchase() async {
    final isFree = widget.plan.price == 0;
    setState(() => _isPurchasing = true);
    try {
      final repo = ref.read(partnerMembershipRepositoryProvider);

      if (isFree) {
        // Free plan: no payment step at all — the server activates on the server-side price.
        await repo.purchase(planId: widget.plan.id);
      } else {
        final order = await repo.checkout(planId: widget.plan.id);
        if (order == null) {
          // `razorpayConfigured: false` — dev/preview only (production returns
          // `503 PAYMENTS_UNAVAILABLE` for a paid plan, caught below). Kept for local dev.
          await repo.purchase(planId: widget.plan.id, paymentId: 'DUMMY-${const Uuid().v4()}');
        } else {
          if (!mounted) return;
          final user = ref.read(authControllerProvider).user;
          final result = await showRazorpayCheckout(
            order: order,
            planName: widget.plan.name,
            prefill: RazorpayPrefill(
              name: user?.name,
              email: sanitizeRazorpayEmail(user?.email),
              // The authenticated user's registered mobile number (Better Auth phone-plugin
              // field). Pre-fills and skips Razorpay's contact step; left unset when the
              // account has no number rather than substituting one. The backend bills
              // against the server-side User.phoneNumber regardless.
              contact: user?.phoneNumber,
            ),
          );
          if (!mounted) return;
          switch (result) {
            case RazorpayCancelled():
              setState(() => _isPurchasing = false);
              return;
            case RazorpayFailed(:final message):
              showAppToast(context, message, variant: AppToastVariant.error);
              setState(() => _isPurchasing = false);
              return;
            case RazorpaySuccess(:final orderId, :final paymentId, :final signature):
              await repo.purchase(
                planId: widget.plan.id,
                razorpayOrderId: orderId,
                razorpayPaymentId: paymentId,
                razorpaySignature: signature,
              );
          }
        }
      }

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
                Expanded(
                  child: Text(
                    isFree
                        ? 'Free ${_billingPeriodLabel(widget.plan.durationDays)}'
                        : '₹${widget.plan.price.toStringAsFixed(0)}${_billingPeriodLabel(widget.plan.durationDays)}',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                ),
                const SizedBox(width: 12),
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
            // Recurring auto-renewing alternative to the one-time Purchase above — only for a
            // paid monthly plan; the one-time path above remains available either way.
            if (!isFree && widget.plan.durationDays == 30) ...[
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: OutlinedButton(
                  onPressed: _isSubscribing ? null : _subscribe,
                  child: _isSubscribing
                      ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Start Monthly Subscription (auto-renew)'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
