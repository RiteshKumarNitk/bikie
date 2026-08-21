import 'dart:async';
import 'dart:convert';

import 'package:webview_flutter/webview_flutter.dart';

/// Bridges Dart calls into the headless MSG91 widget WebView (`Msg91WidgetHost`) and its JS
/// `success`/`failure` results back out. One global instance, since there's only ever one
/// widget-host WebView mounted for the app's lifetime (see `Msg91WidgetHost`'s doc comment for
/// why a WebView at all, instead of the native `sendotp_flutter_sdk` package this replaced).
///
/// Every JS-side response is normalized to `{ok: bool, message: String}` — `message` is the
/// reqId/token on success, MSG91's own rejection text on failure. Calls are strictly sequential
/// (the app only ever has one send/retry/verify in flight at a time, matching the JS widget's own
/// single-session model), so a single pending-completer slot is enough; a second call arriving
/// while one is outstanding is a caller bug, not a race to paper over.
class Msg91WebviewBridge {
  Msg91WebviewBridge._();

  static final Msg91WebviewBridge instance = Msg91WebviewBridge._();

  WebViewController? _controller;
  final Completer<void> _ready = Completer<void>();
  Completer<Map<String, dynamic>>? _pending;

  /// Called once by `Msg91WidgetHost` after it creates its controller.
  void attach(WebViewController controller) {
    _controller = controller;
  }

  /// Called once the widget script has finished loading and `window.sendOtp`/etc. exist.
  void markReady() {
    if (!_ready.isCompleted) _ready.complete();
  }

  /// Called by `Msg91WidgetHost`'s JavaScript channel for every bridge message the page posts.
  void handleMessage(String raw) {
    final completer = _pending;
    _pending = null;
    if (completer == null || completer.isCompleted) return;
    try {
      completer.complete(jsonDecode(raw) as Map<String, dynamic>);
    } catch (e) {
      completer.completeError(e);
    }
  }

  Future<Map<String, dynamic>> sendOtp(String identifier) =>
      _call('window.sendOtpBridge(${jsonEncode(identifier)});');

  /// [channelCode] is the JS widget's string retry code (`'SMS-11'`/`'WHATSAPP-12'`), matching
  /// `apps/web/lib/use-msg91-widget.ts`'s `RETRY_CHANNEL_CODE` exactly — this is the same widget
  /// script, so the same codes apply.
  Future<Map<String, dynamic>> retryOtp(String channelCode) =>
      _call('window.retryOtpBridge(${jsonEncode(channelCode)});');

  Future<Map<String, dynamic>> verifyOtp(String code) =>
      _call('window.verifyOtpBridge(${jsonEncode(code)});');

  Future<Map<String, dynamic>> _call(String script) async {
    if (!_ready.isCompleted) {
      await _ready.future.timeout(const Duration(seconds: 20));
    }
    final controller = _controller;
    if (controller == null) {
      throw StateError('MSG91 widget WebView is not attached yet.');
    }
    if (_pending != null) {
      throw StateError('A verification request is already in progress.');
    }

    final completer = Completer<Map<String, dynamic>>();
    _pending = completer;
    try {
      await controller.runJavaScript(script);
      return await completer.future.timeout(const Duration(seconds: 30));
    } finally {
      _pending = null;
    }
  }
}
