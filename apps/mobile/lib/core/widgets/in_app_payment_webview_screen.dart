import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// Hosts a Razorpay hosted subscription authorization page (`short_url`) inside BIKIE instead of
/// handing the Rider/Service Provider off to Chrome. The URL is loaded completely unchanged — this
/// screen never constructs, rewrites, or inspects query parameters on it, and never infers a
/// payment outcome from its navigation. It only ever reports two things back to the caller: "the
/// page loaded" and "the page failed to load" — whether the subscription actually got authorized
/// is, as before, something only the backend's webhook-verified state can say (the caller refreshes
/// that itself once this screen is popped — see `MembershipScreen`/`PartnerMembershipScreen`).
///
/// Razorpay's checkout hands off to the Rider's UPI app via a non-http(s) deep link
/// (`upi://pay?...`) — a WebView can't render that at all, so `onNavigationRequest` detects it and
/// opens it externally via `url_launcher` instead of letting the WebView try (and fail) to load it
/// as a page. Without this, UPI AutoPay would be completely broken inside the WebView.
class InAppPaymentWebViewScreen extends StatefulWidget {
  const InAppPaymentWebViewScreen({super.key, required this.url, this.title = 'Complete Payment'});

  final String url;
  final String title;

  @override
  State<InAppPaymentWebViewScreen> createState() => _InAppPaymentWebViewScreenState();
}

class _InAppPaymentWebViewScreenState extends State<InAppPaymentWebViewScreen> {
  late final WebViewController _controller;
  bool _loading = true;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _loading = true);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
          },
          onWebResourceError: (error) {
            // Only the main frame failing means the payment page itself didn't load — Razorpay's
            // page pulls in several sub-resources (analytics, etc.) that can legitimately fail
            // without the page itself being broken.
            if (!mounted || error.isForMainFrame == false) return;
            setState(() {
              _loading = false;
              _failed = true;
            });
          },
          onNavigationRequest: (request) {
            final uri = Uri.tryParse(request.url);
            if (uri != null && uri.scheme != 'http' && uri.scheme != 'https') {
              launchUrl(uri, mode: LaunchMode.externalApplication);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  void _retry() {
    setState(() {
      _failed = false;
      _loading = true;
    });
    _controller.reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        leading: IconButton(
          icon: const Icon(Icons.close),
          tooltip: 'Close',
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
      body: Stack(
        children: [
          if (!_failed) WebViewWidget(controller: _controller),
          if (_loading && !_failed) const Center(child: CircularProgressIndicator()),
          if (_failed)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.error_outline, size: 48, color: Theme.of(context).colorScheme.error),
                    const SizedBox(height: 12),
                    const Text("Couldn't load the payment page.", textAlign: TextAlign.center),
                    const SizedBox(height: 4),
                    Text(
                      'Check your connection and try again.',
                      style: Theme.of(context).textTheme.bodySmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(onPressed: _retry, child: const Text('Retry')),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
