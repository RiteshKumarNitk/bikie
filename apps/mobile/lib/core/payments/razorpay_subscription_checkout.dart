import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import 'razorpay_checkout.dart' show RazorpayPrefill, sanitizeRazorpayEmail;

/// How the server wants this AutoPay authorization collected — `subscription.checkoutMode` from
/// `POST /api/{membership,partner-membership}/subscription`. The server decides (operator switch
/// `RAZORPAY_SUBSCRIPTION_CHECKOUT_MODE`), so the in-app flow can be enabled or rolled back without
/// an app release. Anything unknown is treated as [hosted].
enum SubscriptionCheckoutMode { native, hosted }

/// The subscription fields the server returns for starting AutoPay. `keyId` is Razorpay's PUBLIC
/// key id only — the key secret never reaches the app.
class SubscriptionCheckoutInfo {
  const SubscriptionCheckoutInfo({
    required this.subscriptionId,
    required this.shortUrl,
    required this.mode,
    this.keyId,
    this.reused = false,
  });

  final String subscriptionId;
  final String shortUrl;
  final String? keyId;
  final SubscriptionCheckoutMode mode;

  /// The server returned an existing, not-yet-approved subscription instead of creating one.
  final bool reused;

  /// In-app Checkout is used only when the server asked for it AND sent a key to open it with.
  bool get useNativeCheckout => mode == SubscriptionCheckoutMode.native && (keyId?.isNotEmpty ?? false);

  factory SubscriptionCheckoutInfo.fromJson(Map<String, dynamic> json) => SubscriptionCheckoutInfo(
        subscriptionId: json['id'] as String,
        shortUrl: json['shortUrl'] as String,
        keyId: json['keyId'] as String?,
        mode: json['checkoutMode'] == 'native' ? SubscriptionCheckoutMode.native : SubscriptionCheckoutMode.hosted,
        reused: json['reused'] == true,
      );
}

/// Razorpay's documented `prefill.contact` format is `+{country code}{number}`. Accepts the forms
/// BIKIE stores or users type (`9876543210`, `09876543210`, `919876543210`, `+91 98765 43210`) and
/// returns `+919876543210`. Returns `null` — leaving the field for Razorpay to ask — for anything
/// that isn't a valid Indian mobile number; a number is never guessed or invented.
String? normalizeIndianMobileForRazorpay(String? raw) {
  if (raw == null) return null;
  var digits = raw.replaceAll(RegExp(r'[^0-9]'), '');
  if (digits.length == 12 && digits.startsWith('91')) {
    digits = digits.substring(2);
  } else if (digits.length == 11 && digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  if (!RegExp(r'^[6-9][0-9]{9}$').hasMatch(digits)) return null;
  return '+91$digits';
}

/// A real-looking email for `prefill.email`, or `null`. Drops BIKIE's phone-signup placeholder
/// addresses (via [sanitizeRazorpayEmail]) and anything malformed — a fake email is never sent.
String? razorpayPrefillEmail(String? raw) {
  final email = sanitizeRazorpayEmail(raw?.trim());
  if (email == null) return null;
  return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email) ? email : null;
}

/// Outcome of the in-app subscription Checkout. Success only carries Razorpay's callback fields —
/// the caller sends them to the server for signature verification; it never activates anything.
sealed class SubscriptionCheckoutResult {
  const SubscriptionCheckoutResult();
}

class SubscriptionCheckoutSuccess extends SubscriptionCheckoutResult {
  const SubscriptionCheckoutSuccess({required this.paymentId, required this.subscriptionId, required this.signature});
  final String paymentId;
  final String subscriptionId;
  final String signature;
}

class SubscriptionCheckoutCancelled extends SubscriptionCheckoutResult {
  const SubscriptionCheckoutCancelled();
}

class SubscriptionCheckoutFailed extends SubscriptionCheckoutResult {
  const SubscriptionCheckoutFailed(this.message);
  final String message;
}

/// Checkout could not be opened at all (plugin/platform error). The caller falls back to the
/// hosted page for the SAME subscription — never a new one.
class SubscriptionCheckoutUnavailable extends SubscriptionCheckoutResult {
  const SubscriptionCheckoutUnavailable();
}

/// Builds the Razorpay Checkout options for a subscription authorization. Separate from the
/// launcher so the exact payload is unit-tested.
///
/// Only documented Standard Checkout options are used (`key`, `subscription_id`, `name`,
/// `description`, `prefill`, `theme`). Razorpay's `readonly`/`hidden` contact options are
/// deliberately NOT set: Razorpay doesn't document them for subscription checkouts, and hiding a
/// field Razorpay needs for an AutoPay mandate could block payment.
Map<String, dynamic> buildSubscriptionCheckoutOptions({
  required String keyId,
  required String subscriptionId,
  required String planName,
  RazorpayPrefill? prefill,
}) {
  final name = prefill?.name?.trim();
  final email = razorpayPrefillEmail(prefill?.email);
  final contact = normalizeIndianMobileForRazorpay(prefill?.contact);
  return {
    'key': keyId,
    'subscription_id': subscriptionId,
    'name': 'BIKIE',
    'description': '$planName — AutoPay',
    'theme': {'color': '#3B3A91'},
    if ((name?.isNotEmpty ?? false) || email != null || contact != null)
      'prefill': {
        if (name?.isNotEmpty ?? false) 'name': name,
        if (email != null) 'email': email,
        if (contact != null) 'contact': contact,
      },
  };
}

/// Opens Razorpay's in-app Checkout for an existing subscription id.
typedef SubscriptionCheckoutLauncher = Future<SubscriptionCheckoutResult> Function({
  required String keyId,
  required String subscriptionId,
  required String planName,
  RazorpayPrefill? prefill,
});

/// Overridable in tests; production uses the native `razorpay_flutter` SDK.
final subscriptionCheckoutLauncherProvider = Provider<SubscriptionCheckoutLauncher>(
  (ref) => showRazorpaySubscriptionCheckout,
);

/// The native SDK implementation of [SubscriptionCheckoutLauncher]. Same event handling as the
/// one-time `showRazorpayCheckout`, but for `subscription_id` and returning the subscription
/// callback fields (`razorpay_subscription_id` is forwarded by the plugin's Android delegate).
Future<SubscriptionCheckoutResult> showRazorpaySubscriptionCheckout({
  required String keyId,
  required String subscriptionId,
  required String planName,
  RazorpayPrefill? prefill,
}) {
  final completer = Completer<SubscriptionCheckoutResult>();
  final Razorpay razorpay;
  try {
    razorpay = Razorpay();
  } catch (e) {
    debugPrint('[RZP-SUBSCRIPTION] could not create checkout: $e');
    return Future.value(const SubscriptionCheckoutUnavailable());
  }

  void finish(SubscriptionCheckoutResult result) {
    if (!completer.isCompleted) completer.complete(result);
    scheduleMicrotask(razorpay.clear);
  }

  razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (PaymentSuccessResponse r) {
    final data = r.data ?? const {};
    finish(SubscriptionCheckoutSuccess(
      paymentId: r.paymentId ?? '',
      subscriptionId: (data['razorpay_subscription_id'] as String?) ?? subscriptionId,
      signature: r.signature ?? '',
    ));
  });
  razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse r) {
    if (r.code == Razorpay.PAYMENT_CANCELLED) {
      finish(const SubscriptionCheckoutCancelled());
    } else {
      finish(SubscriptionCheckoutFailed(_failureMessage(r)));
    }
  });
  razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, (ExternalWalletResponse r) {
    finish(SubscriptionCheckoutFailed(
      'AutoPay can\'t be set up through ${r.walletName ?? 'that wallet'}. Please choose UPI or a card.',
    ));
  });

  try {
    razorpay.open(buildSubscriptionCheckoutOptions(
      keyId: keyId,
      subscriptionId: subscriptionId,
      planName: planName,
      prefill: prefill,
    ));
  } catch (e) {
    debugPrint('[RZP-SUBSCRIPTION] could not open checkout: $e');
    finish(const SubscriptionCheckoutUnavailable());
  }
  return completer.future;
}

String _failureMessage(PaymentFailureResponse r) {
  final raw = r.message;
  if (raw == null || raw.isEmpty) return 'The AutoPay setup could not be completed. Please try again.';
  final description = RegExp(r'"description"\s*:\s*"([^"]+)"').firstMatch(raw)?.group(1);
  if (description != null && description.isNotEmpty) return description;
  return 'The AutoPay setup could not be completed. Please try again.';
}
