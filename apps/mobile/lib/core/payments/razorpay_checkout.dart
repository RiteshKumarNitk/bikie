import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// A server-created Razorpay order, from `POST /api/{membership,partner-membership}/checkout`
/// (`{ razorpayConfigured: true, order: { orderId, amount, currency, keyId } }`). `keyId` comes
/// from the server so the app never embeds a Razorpay key of its own.
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

/// Opens Razorpay Standard Checkout (`checkout.razorpay.com/v1/checkout.js`) inside a WebView —
/// the same browser flow `apps/web/components/membership/PaymentModal.tsx` runs, wrapped the same
/// way `Msg91WidgetHost` wraps MSG91's browser widget (ADR-057). Mobile has no native Razorpay
/// SDK; this hosts the web checkout and relays Razorpay's callback back to Dart over a JS channel.
Future<RazorpayResult> showRazorpayCheckout(
  BuildContext context, {
  required RazorpayOrder order,
  required String planName,
  RazorpayPrefill? prefill,
}) async {
  final result = await Navigator.of(context).push<RazorpayResult>(
    MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => _RazorpayCheckoutPage(order: order, planName: planName, prefill: prefill),
    ),
  );
  return result ?? const RazorpayCancelled();
}

class _RazorpayCheckoutPage extends StatefulWidget {
  const _RazorpayCheckoutPage({required this.order, required this.planName, this.prefill});

  final RazorpayOrder order;
  final String planName;
  final RazorpayPrefill? prefill;

  @override
  State<_RazorpayCheckoutPage> createState() => _RazorpayCheckoutPageState();
}

class _RazorpayCheckoutPageState extends State<_RazorpayCheckoutPage> {
  late final WebViewController _controller;
  bool _loading = true;
  bool _done = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel('RazorpayBridge', onMessageReceived: (m) => _handleBridge(m.message))
      ..setOnConsoleMessage((m) => debugPrint('[RZP-CHECKOUT][JS] ${m.message}'))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
          },
          onWebResourceError: (e) => debugPrint('[RZP-CHECKOUT] web error: ${e.description}'),
          onNavigationRequest: (request) {
            final url = request.url;
            // UPI-app / bank-app intents and non-http schemes can't render in the WebView —
            // hand them to the OS so PhonePe / GPay / a bank app can complete the leg.
            if (!url.startsWith('http')) {
              _openExternal(url);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      // baseUrl mirrors `Msg91WidgetHost` — a real https origin so checkout.js's storage/postMessage
      // work; Razorpay isn't domain-locked the way the MSG91 widget is.
      ..loadHtmlString(_html(), baseUrl: 'https://bikie.app');
  }

  Future<void> _openExternal(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      debugPrint('[RZP-CHECKOUT] could not open $url: $e');
    }
  }

  void _finish(RazorpayResult result) {
    if (_done || !mounted) return;
    _done = true;
    Navigator.of(context).pop(result);
  }

  void _handleBridge(String raw) {
    Map<String, dynamic> msg;
    try {
      msg = jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      _finish(const RazorpayFailed('Unexpected checkout response.'));
      return;
    }
    switch (msg['status']) {
      case 'success':
        _finish(RazorpaySuccess(
          orderId: msg['order_id'] as String,
          paymentId: msg['payment_id'] as String,
          signature: msg['signature'] as String,
        ));
      case 'cancelled':
        _finish(const RazorpayCancelled());
      case 'failed':
      default:
        _finish(RazorpayFailed((msg['message'] as String?) ?? 'The payment could not be completed.'));
    }
  }

  String _html() {
    final o = widget.order;
    final p = widget.prefill;
    final options = <String, dynamic>{
      'key': o.keyId,
      'order_id': o.orderId,
      'amount': o.amountPaise,
      'currency': o.currency,
      'name': 'BIKIE',
      'description': '${widget.planName} membership',
      'theme': {'color': '#3B3A91'},
      if (p != null && (p.name != null || p.email != null || p.contact != null))
        'prefill': {
          if (p.name != null && p.name!.isNotEmpty) 'name': p.name,
          if (p.email != null && p.email!.isNotEmpty) 'email': p.email,
          if (p.contact != null && p.contact!.isNotEmpty) 'contact': p.contact,
        },
    };
    final optionsJson = jsonEncode(options);
    return '''
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:transparent">
<script>
  function _post(o) { try { RazorpayBridge.postMessage(JSON.stringify(o)); } catch (e) {} }
  function _start() {
    if (typeof Razorpay !== 'function') { _post({ status: 'failed', message: 'Could not load the payment form.' }); return; }
    try {
      var opts = $optionsJson;
      opts.modal = {
        escape: true,
        backdropclose: false,
        ondismiss: function () { _post({ status: 'cancelled' }); }
      };
      opts.handler = function (r) {
        _post({
          status: 'success',
          order_id: r.razorpay_order_id,
          payment_id: r.razorpay_payment_id,
          signature: r.razorpay_signature
        });
      };
      var rzp = new Razorpay(opts);
      rzp.on('payment.failed', function (r) {
        _post({ status: 'failed', message: (r && r.error && r.error.description) || 'The payment could not be completed.' });
      });
      rzp.open();
    } catch (e) {
      _post({ status: 'failed', message: (e && e.message) || 'Could not start checkout.' });
    }
  }
  window.addEventListener('error', function (e) { console.log('window error: ' + e.message); });
</script>
<script
  src="https://checkout.razorpay.com/v1/checkout.js"
  onload="_start()"
  onerror="_post({ status: 'failed', message: 'Could not load the payment form. Check your connection.' })"
></script>
</body>
</html>
''';
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _finish(const RazorpayCancelled());
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Secure checkout'),
          leading: IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => _finish(const RazorpayCancelled()),
          ),
        ),
        body: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_loading) const Center(child: CircularProgressIndicator()),
          ],
        ),
      ),
    );
  }
}
