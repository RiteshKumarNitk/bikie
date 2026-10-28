import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:uuid/uuid.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/app_config.dart' show isTestPhoneNumber;
import '../../../core/payments/razorpay_checkout.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../core/widgets/app_toast.dart';
import '../../auth/domain/auth_controller.dart';
import '../data/membership_model.dart';
import '../data/membership_repository.dart';
import '../domain/membership_providers.dart';
import '../domain/membership_subscription_display.dart';

/// Razorpay's hosted Subscription authorization page has no `callback_url`/redirect mechanism
/// (unlike one-time Checkout) — `_subscribe` below opens it externally (Chrome Custom Tab /
/// browser / UPI app) and there is no reliable way for Razorpay to hand control back to this
/// screen. Razorpay's own guidance is not to rely on a redirect at all; the nearest achievable
/// "auto-refresh on return" is re-fetching on `AppLifecycleState.resumed` — covers the Rider
/// switching back to BIKIE after completing (or abandoning) authorization in the external
/// browser/UPI app, same reasoning as the web page's tab-focus refresh and
/// `RiderFindabilityGate`'s existing resume handling.
class MembershipScreen extends ConsumerStatefulWidget {
  const MembershipScreen({super.key});

  @override
  ConsumerState<MembershipScreen> createState() => _MembershipScreenState();
}

class _MembershipScreenState extends ConsumerState<MembershipScreen> with WidgetsBindingObserver {
  Timer? _pollTimer;
  int _pollAttempts = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.invalidate(activeMembershipProvider);
      ref.invalidate(pendingSubscriptionProvider);
    }
  }

  /// Bounded polling while a subscription exists but hasn't been webhook-confirmed yet — catches
  /// a webhook that lands a few seconds after the Rider returns from Razorpay, without them
  /// needing to pull-to-refresh. Capped (12 tries, 5s apart = 1 minute): if still pending after
  /// that, `didChangeAppLifecycleState`'s resume refresh and the existing stale-subscription
  /// retry logic (on the next "Start Yearly Membership" tap) take over.
  void _schedulePoll() {
    _pollTimer?.cancel();
    if (_pollAttempts >= 12) return;
    _pollTimer = Timer(const Duration(seconds: 5), () {
      _pollAttempts += 1;
      if (mounted) {
        ref.invalidate(activeMembershipProvider);
        ref.invalidate(pendingSubscriptionProvider);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final active = ref.watch(activeMembershipProvider);
    final pending = ref.watch(pendingSubscriptionProvider);
    final plans = ref.watch(membershipPlansProvider);
    final hasActiveMembership = active.valueOrNull != null;

    ref.listen<AsyncValue<UserMembership?>>(pendingSubscriptionProvider, (previous, next) {
      final hadPending = previous?.valueOrNull != null;
      final hasPending = next.valueOrNull != null;
      if (hasPending && !hadPending) _pollAttempts = 0;
      if (hasPending) {
        _schedulePoll();
      } else {
        _pollTimer?.cancel();
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Membership')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(activeMembershipProvider);
          ref.invalidate(pendingSubscriptionProvider);
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
            // Not yet webhook-confirmed — never shown as active. Razorpay's own AutoPay
            // authorization step can genuinely take a while, or the Rider may need to retry; this
            // is the honest "we don't know the final result yet" state, never faked to "active".
            if (!hasActiveMembership && pending.valueOrNull != null) _PendingSubscriptionCard(pending: pending.valueOrNull!),
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

/// Not yet webhook-confirmed — the honest "we don't know the final result yet" state, kept
/// distinct from both "active" and "failed". Never implies activation by itself.
class _PendingSubscriptionCard extends StatelessWidget {
  const _PendingSubscriptionCard({required this.pending});

  final UserMembership pending;

  @override
  Widget build(BuildContext context) {
    final price = pending.plan.price.toStringAsFixed(0);
    return Card(
      color: Theme.of(context).colorScheme.secondaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const SizedBox(
                  height: 16,
                  width: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                const SizedBox(width: 10),
                Text('Payment processing', style: Theme.of(context).textTheme.titleSmall),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              "We're waiting for Razorpay to confirm your ₹$price/year payment. This refreshes "
              "automatically — no need to keep checking. If this doesn't resolve in a few minutes, "
              'you can safely try again below.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _ActiveMembershipCard extends ConsumerStatefulWidget {
  const _ActiveMembershipCard({required this.membership});

  final UserMembership membership;

  @override
  ConsumerState<_ActiveMembershipCard> createState() => _ActiveMembershipCardState();
}

class _ActiveMembershipCardState extends ConsumerState<_ActiveMembershipCard> {
  bool _isCancelling = false;

  /// Stops future recurring charges (`cancelAtCycleEnd`). The already-paid-for current period is
  /// never retroactively revoked — membership stays active until `endDate` naturally passes.
  /// Mirrors `_ActivePartnerMembershipCardState._cancel` exactly.
  Future<void> _cancel() async {
    final validUntil = DateTime.tryParse(widget.membership.endDate);
    final validUntilLabel = validUntil == null ? 'the date above' : DateFormat('d MMMM y').format(validUntil);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel auto-renewal?'),
        content: Text(
          'Your membership will remain active until $validUntilLabel. After cancellation, no further '
          '₹${widget.membership.plan.price.toStringAsFixed(0)} automatic payment will be taken.',
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
      await ref.read(membershipRepositoryProvider).cancelSubscription();
      ref.invalidate(activeMembershipProvider);
      if (mounted) {
        showAppToast(
          context,
          'Auto-renewal cancelled — no further automatic payment will be taken',
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
                      '₹$price/year · Automatic payment',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    if (state.kind == SubscriptionDisplayKind.cancelled) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Auto-renewal cancelled. No further automatic payment will be taken after the current '
                        'paid period.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      _row(context, 'Membership remains active until', state.validUntilDate!),
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
                              '⚠️ There is a problem with your yearly membership renewal',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(fontWeight: FontWeight.bold, color: Colors.red),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              "We couldn't collect your ₹$price membership renewal payment. Please check your "
                              'payment method to keep your membership active.',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.red),
                            ),
                          ],
                        ),
                      ),
                      _row(context, 'Subscription status', state.statusLabel!, valueColor: Colors.red),
                      _row(context, 'Membership valid until', state.validUntilDate!),
                    ] else ...[
                      _row(context, 'Next automatic payment', state.nextPaymentDate!),
                      _row(context, 'Amount', '₹$price/year'),
                      _row(context, 'Membership valid until', state.validUntilDate!),
                      _row(context, 'Subscription status', 'Active'),
                      const SizedBox(height: 4),
                      Text(
                        '₹$price will be automatically debited on ${state.nextPaymentDate}. Your membership will '
                        'renew for another year after the successful payment.',
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
                              : const Text('Cancel Auto-Renewal'),
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

class _PlanCard extends ConsumerStatefulWidget {
  const _PlanCard({required this.plan});

  final MembershipPlan plan;

  @override
  ConsumerState<_PlanCard> createState() => _PlanCardState();
}

class _PlanCardState extends ConsumerState<_PlanCard> {
  bool _isPurchasing = false;
  bool _isSubscribing = false;

  /// Starts a recurring ₹149/year Razorpay Subscription (distinct from [_purchase]'s one-time
  /// flow — both remain available side by side; nothing here silently converts an existing
  /// one-time membership into a subscription). Membership does NOT activate here: the server
  /// only stores the Razorpay subscription id against a placeholder row; a webhook-confirmed
  /// charge is what actually grants eligibility. Opens Razorpay's hosted authorization page
  /// externally (no native-SDK subscription flow yet) — the user completes authorization there
  /// and returns to the app, where pull-to-refresh (or the next launch) picks up the activated
  /// state once the webhook has run. Mirrors `_PlanCardState._subscribe` (Service Provider) exactly.
  Future<void> _subscribe() async {
    setState(() => _isSubscribing = true);
    try {
      final repo = ref.read(membershipRepositoryProvider);
      final result = await repo.startSubscription(planId: widget.plan.id);
      final uri = Uri.tryParse(result.shortUrl);
      if (uri != null) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
      if (mounted) {
        showAppToast(
          context,
          'Complete the payment authorization. This screen updates automatically once confirmed.',
          variant: AppToastVariant.success,
        );
      }
      // Picks up the new pending subscription right away (rather than waiting for the next app
      // resume or poll tick) so the "payment processing" card appears immediately.
      ref.invalidate(pendingSubscriptionProvider);
    } on ApiException catch (e) {
      if (mounted) showAppToast(context, e.message, variant: AppToastVariant.error);
    } finally {
      if (mounted) setState(() => _isSubscribing = false);
    }
  }

  Future<void> _purchase() async {
    setState(() => _isPurchasing = true);
    try {
      final repo = ref.read(membershipRepositoryProvider);
      final order = await repo.checkout(planId: widget.plan.id);

      if (order == null) {
        // `razorpayConfigured: false` — Razorpay isn't set up server-side. The backend only
        // allows this simulated path outside production (in production `/checkout` returns
        // `503 PAYMENTS_UNAVAILABLE`, caught below as an ApiException). Kept for local dev.
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
            // field). When present, Razorpay's contact step is pre-filled and skipped;
            // when the account somehow has no number, the field is left unset and Razorpay
            // asks for it rather than us inventing one (the backend still bills against the
            // server-side User.phoneNumber regardless).
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
    final isFree = widget.plan.price == 0;
    final price = widget.plan.price.toStringAsFixed(0);
    // Store-review/QA Rider test account only — the sole remaining path that can still use the
    // one-time Purchase flow, since it can't complete a real Razorpay mandate authorization.
    // Every other Rider sees exactly one paid action: the real yearly subscription. The backend
    // enforces this independently of what this screen shows (`ONE_TIME_CHECKOUT_DISABLED`/
    // `ONE_TIME_PURCHASE_DISABLED`), so this is a UX choice, not the only thing standing between a
    // real Rider and a one-time payment. Mirrors `_PlanCardState.build` (Service Provider) exactly.
    final phoneNumber = ref.watch(authControllerProvider.select((s) => s.user?.phoneNumber));
    final showLegacyPayOnce = !isFree && isTestPhoneNumber(phoneNumber ?? '');
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
            Text(
              '₹$price / ${widget.plan.durationDays} days',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            if (!isFree && !showLegacyPayOnce) ...[
              const SizedBox(height: 2),
              Text(
                'Auto-renews automatically',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: AppTheme.accentTextOf(context), fontWeight: FontWeight.w600),
              ),
            ],
            const SizedBox(height: 12),
            if (isFree || showLegacyPayOnce)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isPurchasing ? null : _purchase,
                  child: _isPurchasing
                      ? const SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(isFree ? 'Get Started' : 'Pay once'),
                ),
              )
            else ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubscribing ? null : _subscribe,
                  child: _isSubscribing
                      ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text('Start Yearly Membership — ₹$price/year'),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Your payment will be automatically debited every year through your authorized Razorpay '
                'payment method.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
