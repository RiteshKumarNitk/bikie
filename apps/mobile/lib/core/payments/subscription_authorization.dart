import 'package:url_launcher/url_launcher.dart';

import '../network/api_exception.dart';
import 'razorpay_checkout.dart' show RazorpayPrefill;
import 'razorpay_subscription_checkout.dart';

/// Opens Razorpay's hosted Subscription (AutoPay) authorization page — the `short_url` returned by
/// `POST /api/{membership,partner-membership}/subscription`.
///
/// Prefers an in-app browser tab (Android Custom Tab / iOS SFSafariViewController) so the user
/// stays visually inside BIKIE instead of being sent to a separate Chrome window. A Custom Tab is
/// a real browser, not an embedded WebView: UPI app handoffs (GPay / PhonePe / Paytm / BHIM) and
/// bank/OTP pages work exactly as they do in Chrome. Falls back to the external browser if the
/// device can't show an in-app tab.
///
/// The page itself is untouched — no injected JavaScript and no undocumented URL parameters.
/// Returns `false` only if neither mode could open the page, so the caller can tell the user.
Future<bool> openSubscriptionAuthorizationPage(String shortUrl) async {
  final uri = Uri.tryParse(shortUrl);
  if (uri == null || !uri.hasScheme) return false;
  try {
    if (await launchUrl(uri, mode: LaunchMode.inAppBrowserView)) return true;
  } catch (_) {
    // Fall through to the external browser below.
  }
  try {
    return await launchUrl(uri, mode: LaunchMode.externalApplication);
  } catch (_) {
    return false;
  }
}

/// Shown when [openSubscriptionAuthorizationPage] returns `false`.
const kSubscriptionPageOpenFailedMessage =
    "Couldn't open the Razorpay payment page. Please check your internet connection and try again.";

/// What happened when the member tried to set up AutoPay.
enum SubscriptionAuthorizationOutcome {
  /// In-app Checkout succeeded and Razorpay has already recorded the payment (server-verified).
  activated,

  /// In-app Checkout succeeded; the server is waiting for Razorpay to record the charge.
  confirming,

  /// The hosted Razorpay page was opened; the member approves AutoPay there.
  hostedOpened,

  /// The member closed Razorpay Checkout without paying.
  cancelled,

  /// Razorpay reported a payment failure ([SubscriptionAuthorizationResult.message]).
  failed,

  /// Neither in-app Checkout nor the hosted page could be opened.
  openFailed,
}

class SubscriptionAuthorizationResult {
  const SubscriptionAuthorizationResult(this.outcome, [this.message]);
  final SubscriptionAuthorizationOutcome outcome;
  final String? message;

  /// The toast shown to the member for this outcome.
  String get userMessage {
    switch (outcome) {
      case SubscriptionAuthorizationOutcome.activated:
        return 'AutoPay is set up and your membership is now active.';
      case SubscriptionAuthorizationOutcome.confirming:
        return 'Payment received. Your membership will activate as soon as Razorpay confirms it.';
      case SubscriptionAuthorizationOutcome.hostedOpened:
        return 'Approve AutoPay on Razorpay. This screen updates automatically once it is confirmed.';
      case SubscriptionAuthorizationOutcome.cancelled:
        return 'Payment cancelled. You can try again anytime.';
      case SubscriptionAuthorizationOutcome.failed:
        return message ?? 'The AutoPay setup could not be completed. Please try again.';
      case SubscriptionAuthorizationOutcome.openFailed:
        return kSubscriptionPageOpenFailedMessage;
    }
  }

  /// Whether the screen should keep watching for activation (refresh/poll).
  bool get awaitingConfirmation =>
      outcome == SubscriptionAuthorizationOutcome.confirming || outcome == SubscriptionAuthorizationOutcome.hostedOpened;
}

/// Collects AutoPay authorization for a subscription the server has already created (or reused).
///
/// - Server asked for in-app Checkout → Razorpay's native SDK opens with the subscription id and
///   the member's prefilled details. On success the callback fields go to [confirm] (server-side
///   signature verification + confirmation with Razorpay); the app itself never activates anything.
/// - Server asked for the hosted page, or the SDK couldn't open → the hosted page for the SAME
///   subscription (`shortUrl`). Switching checkout methods never creates a new subscription.
Future<SubscriptionAuthorizationResult> authorizeSubscription({
  required SubscriptionCheckoutInfo checkout,
  required SubscriptionCheckoutLauncher launcher,
  required String planName,
  required RazorpayPrefill prefill,
  required Future<bool> Function(SubscriptionCheckoutSuccess success) confirm,
  Future<bool> Function(String shortUrl) openHostedPage = openSubscriptionAuthorizationPage,
}) async {
  if (checkout.useNativeCheckout) {
    final result = await launcher(
      keyId: checkout.keyId!,
      subscriptionId: checkout.subscriptionId,
      planName: planName,
      prefill: prefill,
    );
    switch (result) {
      case SubscriptionCheckoutSuccess():
        bool active;
        try {
          active = await confirm(result);
        } on ApiException {
          // Verification couldn't complete right now — the webhook still activates the membership.
          active = false;
        }
        return SubscriptionAuthorizationResult(
          active ? SubscriptionAuthorizationOutcome.activated : SubscriptionAuthorizationOutcome.confirming,
        );
      case SubscriptionCheckoutCancelled():
        return const SubscriptionAuthorizationResult(SubscriptionAuthorizationOutcome.cancelled);
      case SubscriptionCheckoutFailed(:final message):
        return SubscriptionAuthorizationResult(SubscriptionAuthorizationOutcome.failed, message);
      case SubscriptionCheckoutUnavailable():
        break; // fall back to the hosted page below, same subscription
    }
  }

  final opened = await openHostedPage(checkout.shortUrl);
  return SubscriptionAuthorizationResult(
    opened ? SubscriptionAuthorizationOutcome.hostedOpened : SubscriptionAuthorizationOutcome.openFailed,
  );
}
