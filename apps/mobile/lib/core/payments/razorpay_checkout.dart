import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

/// A server-created Razorpay order, from `POST /api/{membership,partner-membership}/checkout`
/// (`{ razorpayConfigured: true, order: { orderId, amount, currency, keyId } }`). `keyId` comes
/// from the server so the app embeds no Razorpay key of its own.
class RazorpayOrder {
  const RazorpayOrder({
    required this.orderId,
    required this.amountPaise,
    required this.currency,
    required this.keyId,
  });

  final String orderId;
  final int amountPaise;
  final String currency;
  final String keyId;

  factory RazorpayOrder.fromJson(Map<String, dynamic> json) => RazorpayOrder(
        orderId: json['orderId'] as String,
        amountPaise: (json['amount'] as num).toInt(),
        currency: (json['currency'] as String?) ?? 'INR',
        keyId: json['keyId'] as String,
      );
}

/// Optional Razorpay `prefill` (name / email / contact) — improves conversion, purely cosmetic.
class RazorpayPrefill {
  const RazorpayPrefill({this.name, this.email, this.contact});
  final String? name;
  final String? email;
  final String? contact;
}

/// Drop the placeholder email Better Auth generates for phone-only signups (`…@bikie.local` /
/// `…@bikie.app`) so Razorpay's form isn't prefilled with a non-address. Mirrors web's
/// `prefillFromSessionUser`.
String? sanitizeRazorpayEmail(String? email) {
  if (email == null || !email.contains('@')) return null;
  final lower = email.toLowerCase();
  if (lower.endsWith('@bikie.local') || lower.endsWith('@bikie.app')) return null;
  return email;
}

/// Outcome of [showRazorpayCheckout]. Success carries Razorpay's own callback fields verbatim —
/// the caller posts them to `/api/…/purchase`, which verifies the signature server-side. The app
/// never decides whether a payment "worked".
sealed class RazorpayResult {
  const RazorpayResult();
}

class RazorpaySuccess extends RazorpayResult {
  const RazorpaySuccess({required this.orderId, required this.paymentId, required this.signature});
  final String orderId;
  final String paymentId;
  final String signature;
}

class RazorpayCancelled extends RazorpayResult {
  const RazorpayCancelled();
}

class RazorpayFailed extends RazorpayResult {
  const RazorpayFailed(this.message);
  final String message;
}

/// Opens Razorpay Standard Checkout via the **native `razorpay_flutter` SDK**.
///
/// This replaced an earlier WebView that hosted `checkout.razorpay.com/v1/checkout.js`: Razorpay
/// Checkout suppresses the UPI-intent option (tap-to-open GPay / PhonePe / Paytm) when it runs
/// inside an embedded WebView, so that flow could only ever show cards / netbanking / wallets.
/// The native sheet lists UPI apps + UPI ID + QR alongside every other method.
///
/// The server flow is unchanged — the caller passes a [RazorpayOrder] from `/api/…/checkout`, and
/// on [RazorpaySuccess] posts `orderId`/`paymentId`/`signature` to `/api/…/purchase` for
/// server-side signature verification.
Future<RazorpayResult> showRazorpayCheckout({
  required RazorpayOrder order,
  required String planName,
  RazorpayPrefill? prefill,
}) {
  final completer = Completer<RazorpayResult>();
  final razorpay = Razorpay();

  void finish(RazorpayResult result) {
    if (!completer.isCompleted) completer.complete(result);
    // Defer clear() past the current callback so the plugin isn't torn down mid-dispatch.
    scheduleMicrotask(razorpay.clear);
  }

  razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (PaymentSuccessResponse r) {
    finish(RazorpaySuccess(
      orderId: r.orderId ?? order.orderId,
      paymentId: r.paymentId ?? '',
      signature: r.signature ?? '',
    ));
  });
  razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse r) {
    if (r.code == Razorpay.PAYMENT_CANCELLED) {
      finish(const RazorpayCancelled());
    } else {
      finish(RazorpayFailed(_failureMessage(r)));
    }
  });
  razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, (ExternalWalletResponse r) {
    // The user chose an external wallet app — no verifiable payment came back to us here, so
    // don't try to activate a membership off a missing signature.
    finish(RazorpayFailed('Finish the payment in ${r.walletName ?? 'the wallet app'} and try again.'));
  });

  final options = <String, dynamic>{
    'key': order.keyId,
    'order_id': order.orderId,
    'amount': order.amountPaise,
    'currency': order.currency,
    'name': 'BIKIE',
    'description': '$planName membership',
    'theme': {'color': '#3B3A91'},
    // Keep the customer inside checkout on failure so they can pick another method.
    'retry': {'enabled': true, 'max_count': 3},
    if (prefill != null && (prefill.name != null || prefill.email != null || prefill.contact != null))
      'prefill': {
        if (prefill.name != null && prefill.name!.isNotEmpty) 'name': prefill.name,
        if (prefill.email != null && prefill.email!.isNotEmpty) 'email': prefill.email,
        if (prefill.contact != null && prefill.contact!.isNotEmpty) 'contact': prefill.contact,
      },
  };

  try {
    razorpay.open(options);
  } catch (e) {
    finish(RazorpayFailed('Could not start checkout: $e'));
  }
  return completer.future;
}

String _failureMessage(PaymentFailureResponse r) {
  // `r.message` is usually a JSON string like {"error":{"description":"..."}}; fall back to it raw.
  final raw = r.message;
  if (raw == null || raw.isEmpty) return 'The payment could not be completed.';
  final match = RegExp(r'"description"\s*:\s*"([^"]+)"').firstMatch(raw);
  final description = match?.group(1);
  if (description != null && description.isNotEmpty) return description;
  debugPrint('[RZP-CHECKOUT] payment error ${r.code}: $raw');
  return 'The payment could not be completed. Please try again.';
}
