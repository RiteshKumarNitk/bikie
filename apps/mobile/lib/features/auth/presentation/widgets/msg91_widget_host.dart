import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../../core/network/app_config.dart';
import '../../data/msg91_webview_bridge.dart';

/// Mounted once near the app root (`main.dart`'s `MaterialApp.router` `builder`), so it's ready
/// before any OTP screen needs it and survives navigation between them.
///
/// Runs MSG91's own browser JS widget (`verify.msg91.com/otp-provider.js`) headlessly inside a
/// WebView — the *exact* script and credentials `apps/web/lib/use-msg91-widget.ts` already uses
/// successfully in production. This replaces the native `sendotp_flutter_sdk` package
/// (ADR-057's original choice): that package's direct REST calls were rejected outright by this
/// MSG91 account's widget ("mobile requests are not allowed for this widget", confirmed live
/// 2026-08-20) — MSG91's own dashboard, even under its "Mobile SDK for custom UI" tab, shows this
/// widget's only real integration is the browser JS one. Wrapping that same JS in a WebView reuses
/// exactly what's proven to work rather than depending on a code path this widget doesn't support.
///
/// Positioned off-screen via `Positioned`, not hidden via `Offstage` — a WebView is a platform
/// view, and platform views need real layout/compositing to actually render and run their JS;
/// `Offstage` (or zero size) can leave the underlying native view never attached on some
/// platforms. 1x1px far outside the viewport is invisible without starving the widget of layout.
class Msg91WidgetHost extends StatefulWidget {
  const Msg91WidgetHost({super.key});

  @override
  State<Msg91WidgetHost> createState() => _Msg91WidgetHostState();
}

class _Msg91WidgetHostState extends State<Msg91WidgetHost> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel(
        'Msg91Bridge',
        onMessageReceived: (message) => Msg91WebviewBridge.instance.handleMessage(message.message),
      )
      // Piped to `adb logcat` (every build mode, not just debug) — the only window into what's
      // actually happening inside this WebView, since nothing in here is otherwise observable
      // from Dart. Added after a live device hung for 20s on a send with no visible cause; the
      // JS below logs at every step specifically so that failure mode is diagnosable next time.
      ..setOnConsoleMessage((message) => debugPrint('[MSG91-WIDGET][JS] ${message.message}'))
      ..setNavigationDelegate(
        NavigationDelegate(onPageFinished: (_) => Msg91WebviewBridge.instance.markReady()),
      )
      // baseUrl matters: without a real https origin, the page has none at all, and the widget
      // script's use of localStorage/cookies to track its session throws a DOMException before
      // `window.sendOtp` is ever assigned — confirmed live via adb logcat 2026-08-20
      // ("initSendOTP called, window.sendOtp is undefined" followed by two DOMException console
      // errors). `bikie.app` is the same origin the browser widget already runs from on web.
      ..loadHtmlString(_widgetHtml, baseUrl: 'https://bikie.app');
    Msg91WebviewBridge.instance.attach(_controller);
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: -1000,
      top: -1000,
      width: 1,
      height: 1,
      child: WebViewWidget(controller: _controller),
    );
  }
}

/// Mirrors `apps/web/lib/use-msg91-widget.ts` exactly: `exposeMethods: true` suppresses the
/// widget's own popup UI and exposes `window.sendOtp`/`retryOtp`/`verifyOtp`, which the
/// `*Bridge` wrappers below call and relay back to Dart via the `Msg91Bridge` JavaScript channel,
/// normalized to `{ok, message}` regardless of which of the three calls it was — the Dart side
/// (`Msg91WebviewBridge`) already knows which call is pending.
///
/// `_guardedCall` exists because a live device hung for 20s on a send that never resolved or
/// rejected: if `window.sendOtp` isn't actually defined yet (or the widget script never finished
/// initializing) when a `*Bridge` function runs, calling it throws a plain JS `TypeError` —
/// which happens *before* MSG91's own success/failure callbacks are even reachable, so nothing
/// ever calls `_ok`/`_fail`, and the only sign of trouble was Dart's own timeout, ~20s later,
/// telling us nothing about why. `_guardedCall` catches both "the function doesn't exist yet" and
/// "it exists but threw" and reports them through the bridge immediately instead of hanging.
final String _widgetHtml = '''
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
  function _log(msg) { try { console.log(msg); } catch (e) {} }
  function _post(result) { Msg91Bridge.postMessage(JSON.stringify(result)); }
  function _ok(data) { _post({ ok: true, message: (data && data.message) || '' }); }
  function _fail(err) { _post({ ok: false, message: (err && err.message) || 'MSG91 request failed' }); }

  function _guardedCall(fnName, args) {
    if (typeof window[fnName] !== 'function') {
      _log('[MSG91] ' + fnName + ' is not defined yet — widget not ready');
      _post({ ok: false, message: 'Verification widget is not ready yet' });
      return;
    }
    try {
      window[fnName].apply(null, args);
    } catch (e) {
      _log('[MSG91] ' + fnName + ' threw: ' + (e && e.message));
      _post({ ok: false, message: (e && e.message) || 'MSG91 widget error' });
    }
  }

  window.sendOtpBridge = function(identifier) { _guardedCall('sendOtp', [identifier, _ok, _fail]); };
  window.retryOtpBridge = function(channel) { _guardedCall('retryOtp', [channel, _ok, _fail]); };
  window.verifyOtpBridge = function(code) { _guardedCall('verifyOtp', [code, _ok, _fail]); };

  window.addEventListener('error', function(e) { _log('[MSG91] window error: ' + e.message); });
  window.addEventListener('unhandledrejection', function(e) {
    _log('[MSG91] unhandled promise rejection: ' + (e.reason && e.reason.message || e.reason));
  });

  var configuration = {
    widgetId: "$kMsg91WidgetId",
    tokenAuth: "$kMsg91WidgetTokenAuth",
    exposeMethods: true,
    // Only reached if a call site invokes the widget's own popup UI, which this app never does
    // (exposeMethods: true routes success/failure into the per-call callbacks above instead) —
    // required fields of the config, kept as no-ops, same as web's identical config object.
    // Logged anyway (not truly no-op here) since they're a real signal of whether MSG91's script
    // itself considers initialization to have succeeded — and, critically, whether
    // window.sendOtp actually exists *by that point*, since it's still undefined immediately
    // after the synchronous initSendOTP() call returns (its real setup is async).
    success: function() {
      _log('[MSG91] config success callback fired, window.sendOtp is ' + typeof window.sendOtp);
    },
    failure: function() {
      _log('[MSG91] config failure callback fired, window.sendOtp is ' + typeof window.sendOtp);
    }
  };
</script>
<script
  src="https://verify.msg91.com/otp-provider.js"
  onload="_log('[MSG91] otp-provider.js loaded'); initSendOTP(configuration); _log('[MSG91] initSendOTP called, window.sendOtp is ' + typeof window.sendOtp); setTimeout(function() { _log('[MSG91] 3s after init, window.sendOtp is ' + typeof window.sendOtp); }, 3000);"
  onerror="_log('[MSG91] otp-provider.js FAILED TO LOAD')"
></script>
</body>
</html>
''';
