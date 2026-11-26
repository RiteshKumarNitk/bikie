import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/app_config.dart' show isTestPhoneNumber;
import '../../../core/payments/razorpay_checkout.dart';
import '../../../core/payments/razorpay_subscription_checkout.dart';
import '../../../core/payments/subscription_authorization.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../core/widgets/app_toast.dart';
import '../../../core/widgets/in_app_payment_webview_screen.dart';
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
///
/// Like the Rider screen, membership activation only ever comes from the backend (webhook-confirmed
/// Razorpay status). This screen re-fetches it when the Service Provider returns to BIKIE from
/// Razorpay or a UPI app, and polls briefly after AutoPay approval starts, so nobody has to
/// pull-to-refresh to see their membership turn active.
class PartnerMembershipScreen extends ConsumerStatefulWidget {
  const PartnerMembershipScreen({super.key});

  @override
  ConsumerState<PartnerMembershipScreen> createState() => _PartnerMembershipScreenState();
}

class _PartnerMembershipScreenState extends ConsumerState<PartnerMembershipScreen> with WidgetsBindingObserver {
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
    if (state == AppLifecycleState.resumed) ref.invalidate(activePartnerMembershipProvider);
  }

  /// Bounded (12 × 5s = 1 minute) refresh after AutoPay approval starts — catches a webhook that
  /// lands shortly after the Service Provider returns. Same cadence as the Rider screen.
  void _startPolling() {
    _pollTimer?.cancel();
    _pollAttempts = 0;
    _scheduleNextPoll();
  }

  void _scheduleNextPoll() {
    if (_pollAttempts >= 12) return;
    _pollTimer = Timer(const Duration(seconds: 5), () {
      _pollAttempts += 1;
      if (!mounted) return;
      ref.invalidate(activePartnerMembershipProvider);
      _scheduleNextPoll();
    });
  }

  @override
  Widget build(BuildContext context) {
    final active = ref.watch(activePartnerMembershipProvider);
    final plans = ref.watch(partnerMembershipPlansProvider);
    final hasActiveMembership = active.valueOrNull != null;

    ref.listen<AsyncValue<PartnerMembership?>>(activePartnerMembershipProvider, (previous, next) {
      if (next.valueOrNull != null) _pollTimer?.cancel();
    });

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
                  children: list
                      .where((p) => p.isActive)
                      .map((plan) => _PlanCard(plan: plan, onAuthorizationStarted: _startPolling))
                      .toList(),
                ),
              ),
              const SizedBox(height: 12),
              Center(
                child: TextButton(
                  onPressed: () => context.go('/'),
                  child: const Text('Skip for now — explore the dashboard first'),
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
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep Auto-Renewal')),
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
                              'AutoPay payment failed',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(fontWeight: FontWeight.bold, color: Colors.red),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              "We couldn't collect your ₹$price membership renewal payment. Please "
                              'check your payment method to keep your membership active.',
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

/// Mirrors web's `billingPeriodLabel` in `apps/web/app/(main)/partner/membership/page.tsx`.
String _billingPeriodLabel(int durationDays) {
  if (durationDays == 30) return '/month';
  if (durationDays == 365) return '/year';
  return '/ $durationDays days';
}

class _PlanCard extends ConsumerStatefulWidget {
  const _PlanCard({required this.plan, required this.onAuthorizationStarted});

  final PartnerMembershipPlan plan;

  /// Called once Razorpay's AutoPay page has been opened, so the screen can watch for activation.
  final VoidCallback onAuthorizationStarted;

  @override
  ConsumerState<_PlanCard> createState() => _PlanCardState();
}

class _PlanCardState extends ConsumerState<_PlanCard> {
  bool _isPurchasing = false;
  bool _isSubscribing = false;

  /// True while the "Set up AutoPay" dialog is open — disables the button (no double dialogs)
  /// without showing a spinner for a request that hasn't been made yet.
  bool _isConfirming = false;

  /// Opens Razorpay's hosted AutoPay page (unchanged `short_url`) inside BIKIE and waits until the
  /// member closes it. Never infers a payment outcome from the WebView — the caller re-reads the
  /// backend-verified membership afterwards.
  Future<bool> _openHostedPaymentPage(String shortUrl) async {
    if (!mounted) return false;
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => InAppPaymentWebViewScreen(url: shortUrl, title: 'Set up AutoPay')),
    );
    return true;
  }

  /// Explains the AutoPay step first (mirrors the Rider screen). The button is disabled before the
  /// dialog opens so a double-tap can't start two subscription requests.
  Future<void> _confirmAndSubscribe() async {
    if (_isSubscribing || _isConfirming) return;
    setState(() => _isConfirming = true);
    final price = widget.plan.price.toStringAsFixed(0);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Set up AutoPay'),
        content: Text(
          "You'll approve AutoPay for your ₹$price/month membership right here in BIKIE — choose "
          'UPI AutoPay or a card. This screen updates automatically once Razorpay confirms.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Continue')),
        ],
      ),
    );
    if (!mounted) return;
    setState(() => _isConfirming = false);
    if (confirmed != true) return;
    await _subscribe();
  }

  /// Starts (or reuses) the Service Provider's ₹99/month Razorpay Subscription and collects AutoPay
  /// authorization via [authorizeSubscription]: Razorpay's in-app Checkout when the server enables
  /// it, otherwise the hosted page inside BIKIE (`InAppPaymentWebViewScreen`, unchanged
  /// `short_url`, no external browser). Membership activation only ever comes from the backend's
  /// webhook-/Razorpay-confirmed state; nothing here infers success/failure from Checkout or the
  /// WebView.
  Future<void> _subscribe() async {
    setState(() => _isSubscribing = true);
    try {
      final repo = ref.read(partnerMembershipRepositoryProvider);
      final result = await repo.startSubscription(planId: widget.plan.id);
      final user = ref.read(authControllerProvider).user;
      final outcome = await authorizeSubscription(
        checkout: result.checkout,
        launcher: ref.read(subscriptionCheckoutLauncherProvider),
        planName: widget.plan.name,
        prefill: RazorpayPrefill(name: user?.name, email: user?.email, contact: user?.phoneNumber),
        confirm: (success) => repo.confirmCheckout(
          razorpayPaymentId: success.paymentId,
          razorpaySubscriptionId: success.subscriptionId,
          razorpaySignature: success.signature,
        ),
        openHostedPage: _openHostedPaymentPage,
      );
      // Membership status is always re-read from the server, never inferred from Checkout.
      ref.invalidate(activePartnerMembershipProvider);
      if (outcome.awaitingConfirmation) widget.onAuthorizationStarted();
      if (mounted) {
        showAppToast(
          context,
          outcome.userMessage,
          variant: switch (outcome.outcome) {
            SubscriptionAuthorizationOutcome.activated ||
            SubscriptionAuthorizationOutcome.confirming ||
            SubscriptionAuthorizationOutcome.hostedOpened =>
              AppToastVariant.success,
            SubscriptionAuthorizationOutcome.cancelled => AppToastVariant.info,
            _ => AppToastVariant.error,
          },
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
    final price = widget.plan.price.toStringAsFixed(0);
    // ADR-089 store-review/QA account only — the sole remaining path that can still use the
    // one-time Purchase flow, since it can't complete a real Razorpay mandate authorization.
    // Every other Service Provider sees exactly one paid action: the real monthly subscription.
    // The backend enforces this independently of what this screen shows
    // (`ONE_TIME_CHECKOUT_DISABLED`/`ONE_TIME_PURCHASE_DISABLED`), so this is a UX choice, not the
    // only thing standing between a real SP and a one-time payment.
    final phoneNumber = ref.watch(authControllerProvider.select((s) => s.user?.phoneNumber));
    final showLegacyPurchase = !isFree && isTestPhoneNumber(phoneNumber ?? '');

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
              isFree
                  ? 'Free ${_billingPeriodLabel(widget.plan.durationDays)}'
                  : '₹$price${_billingPeriodLabel(widget.plan.durationDays)}',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            if (!isFree && !showLegacyPurchase) ...[
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
            if (isFree || showLegacyPurchase)
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
                      : Text(isFree ? 'Activate' : 'Purchase'),
                ),
              )
            else ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubscribing || _isConfirming ? null : _confirmAndSubscribe,
                  child: _isSubscribing
                      ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text('Start Membership — ₹$price/month', textAlign: TextAlign.center),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Renews every month with AutoPay through Razorpay. You can cancel auto-renewal anytime.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
