import 'package:flutter/foundation.dart';

import '../../../core/network/api_exception.dart';
import 'msg91_webview_bridge.dart';

/// ADR-057 — mirrors `apps/web/lib/use-msg91-widget.ts`'s `OtpChannel`. Voice/Email exist on
/// MSG91's side too but aren't offered in this app's UI.
enum OtpChannel { sms, whatsapp }

/// MSG91 JS widget's `retryOtp` channel codes — identical to
/// `apps/web/lib/use-msg91-widget.ts`'s `RETRY_CHANNEL_CODE`, since mobile now runs the exact
/// same JS widget (see `Msg91WidgetHost`), not `sendotp_flutter_sdk`'s numeric convention this
/// used before.
const Map<OtpChannel, String> _retryChannelCode = {
  OtpChannel.sms: 'SMS-11',
  OtpChannel.whatsapp: 'WHATSAPP-12',
};

class Msg91SendResult {
  const Msg91SendResult({required this.reqId});

  /// MSG91's request ID for this OTP session — pass to [Msg91OtpRepository.retryOtp] (resend)
  /// and [Msg91OtpRepository.verifyOtp].
  final String reqId;
}

/// ADR-057 (revised 2026-08-20) — MSG91's OTP Widget, same product web already uses successfully
/// in production. Originally implemented via the native `sendotp_flutter_sdk` package, calling
/// MSG91's REST API directly from the device — but this account's widget rejects that path
/// outright ("mobile requests are not allowed for this widget", confirmed live: MSG91's own
/// dashboard shows no distinct native-SDK integration for this widget, even under its "Mobile SDK
/// for custom UI" tab, only the same browser JS widget web uses). Rewritten to run that exact JS
/// widget headlessly inside a WebView (`Msg91WidgetHost`/`Msg91WebviewBridge`) instead — reusing
/// what's proven to work rather than a code path this widget was never provisioned for.
///
/// Our backend never sees the send/verify legs here, only the final access token — [verifyOtp]
/// returns that token unchanged; the caller must still send it to `POST /api/auth/phone-number/verify`
/// (via `AuthRepository.verifyOtp`) for server-side re-verification against MSG91
/// (`packages/services/.../msg91-widget-verify.adapter.ts`) before Better Auth issues a session.
/// This class never creates a user or a session by itself — it only decides "is this OTP
/// correct," identically to how the web widget's role is scoped.
///
/// This is the release-build OTP path only. Debug builds keep using the older backend-proxied
/// native-API flow (`AuthRepository.sendOtp`'s `kDebugMode` branch) so the dev-bypass and
/// `TEST_RIDER_PHONE`/`TEST_SERVICE_PROVIDER_PHONE` fixed-code mechanisms
/// (`packages/services/.../domain/test-otp-bypass.ts`) keep working for local/automated testing —
/// MSG91's real widget would reject a fake test code before our backend ever saw it, so those two
/// flows can't share one code path. See ADR-057.
class Msg91OtpRepository {
  /// [phoneNumber] must be E.164 (`+91XXXXXXXXXX`); MSG91 wants the identifier as digits only,
  /// country code without the `+` — converted here, never left to the caller.
  ///
  /// Throws [ApiException] (never a raw exception) on any failure — `AuthRepository`'s callers
  /// only ever catch `ApiException` (matching every other repository in this app), and this class
  /// sits *outside* `apiGuard`'s `DioException`-only catch (nothing here goes through `Dio` — the
  /// widget talks to MSG91 directly from its own WebView), so it has to do its own conversion.
  Future<Msg91SendResult> sendOtp(String phoneNumber, {OtpChannel channel = OtpChannel.sms}) async {
    final identifier = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
    final response = await _guarded(() => Msg91WebviewBridge.instance.sendOtp(identifier));
    final reqId = _extractMessage(response, requireOk: true);
    if (reqId == null) {
      _logReason('sendOtp rejected', response);
      throw ApiException(statusCode: 0, message: 'Could not send the verification code. Please try again.');
    }

    // ADR-057 — MSG91's widget has no channel parameter on the *initial* send (confirmed against
    // MSG91's public docs; only `retryOtp` takes one), so `channel: whatsapp` here means: let the
    // default-channel send above go out, then immediately retry on WhatsApp. This is a real,
    // documented MSG91 limitation, not a workaround invented here (see ADR-057) — concretely, if
    // the widget's configured default channel is SMS, the phone may receive both an SMS and a
    // WhatsApp message with the same code, and MSG91 bills for both deliveries.
    if (channel == OtpChannel.whatsapp) {
      await retryOtp(reqId, channel: OtpChannel.whatsapp);
    }
    return Msg91SendResult(reqId: reqId);
  }

  /// [reqId] is accepted for signature/call-site compatibility (mirrors the resend flows'
  /// existing shape) but not forwarded to the widget — unlike the native API this replaced, the
  /// JS widget tracks its own session state inside the WebView page itself, exactly as it does
  /// for web; only the retry channel is a real parameter (`window.retryOtp(channel, ...)`).
  Future<void> retryOtp(String reqId, {OtpChannel channel = OtpChannel.sms}) async {
    final response = await _guarded(() => Msg91WebviewBridge.instance.retryOtp(_retryChannelCode[channel]!));
    if (_extractMessage(response, requireOk: true) == null) {
      _logReason('retryOtp rejected', response);
      throw ApiException(statusCode: 0, message: 'Could not send the verification code. Please try again.');
    }
  }

  /// Returns MSG91's access token (an opaque, JWT-like string) on success — pass this straight
  /// through as `AuthRepository.verifyOtp`'s `code` argument, unchanged. Throws [ApiException]
  /// with a plain, user-friendly message on rejection (wrong/expired code) — see [_logReason]'s
  /// doc comment for where the real reason still goes.
  Future<String> verifyOtp(String reqId, String otp) async {
    final response = await _guarded(() => Msg91WebviewBridge.instance.verifyOtp(otp));
    final token = _extractMessage(response, requireOk: true);
    if (token == null) {
      _logReason('verifyOtp rejected', response);
      throw ApiException(
        statusCode: 400,
        message: 'Invalid or expired code. Please try again.',
        errorCode: 'INVALID_OTP',
      );
    }
    return token;
  }

  /// Converts anything the bridge might throw (a WebView JS error, a malformed message, the
  /// 15s/20s timeouts in `Msg91WebviewBridge`) into an [ApiException] with a plain, generic
  /// message, so every caller of this class can rely on catching exactly one exception type
  /// (matching the rest of this app's repositories) and every user sees the same simple text
  /// regardless of cause. The real reason still goes to [_logReason] instead of being discarded.
  Future<T> _guarded<T>(Future<T> Function() call) async {
    try {
      return await call();
    } on ApiException {
      rethrow;
    } catch (e) {
      debugPrint('[MSG91-OTP] request failed: $e');
      throw ApiException(statusCode: 0, message: 'Could not reach the verification service. Please try again.');
    }
  }

  /// [Msg91WebviewBridge]'s calls all resolve to `{ok: bool, message: String}` — `message` is
  /// the reqId/token on success, MSG91's own rejection text on failure. Returns `message` only
  /// when [requireOk] is satisfied (`ok == true`), so a rejection's text can never be
  /// misread as a successful reqId/token — this was a real bug in the previous
  /// `sendotp_flutter_sdk`-based implementation.
  String? _extractMessage(Map<String, dynamic> response, {required bool requireOk}) {
    if (response['ok'] != requireOk) return null;
    final message = response['message'];
    return (message is String && message.isNotEmpty) ? message : null;
  }

  /// The real MSG91 rejection reason (e.g. `"IPBlocked"`, `"mobile requests are not allowed for
  /// this widget"`) — logged via `debugPrint` (visible over `adb logcat`, in every build mode,
  /// not just debug) rather than shown on screen. Every user seeing raw technical text for a
  /// production auth flow is worse than a plain "please try again," even while this integration
  /// is still being stabilized — the reason is one `adb logcat` away when needed, not gone.
  void _logReason(String context, Map<String, dynamic> response) {
    debugPrint('[MSG91-OTP] $context: ${response['message']}');
  }
}
