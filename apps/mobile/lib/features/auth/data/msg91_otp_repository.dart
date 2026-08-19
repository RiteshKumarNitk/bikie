import 'package:sendotp_flutter_sdk/sendotp_flutter_sdk.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/app_config.dart';

/// ADR-057 — mirrors `apps/web/lib/use-msg91-widget.ts`'s `OtpChannel`. Voice/Email exist on
/// MSG91's side too but aren't offered in this app's UI.
enum OtpChannel { sms, whatsapp }

/// MSG91 retryOTP channel codes, per `sendotp_flutter_sdk`'s own numeric convention (the JS
/// widget web uses instead takes string codes like `'WHATSAPP-12'` — same underlying MSG91
/// backend, different SDK wrapper). Source: pub.dev's `sendotp_flutter_sdk` reference.
int _retryChannelCode(OtpChannel channel) => switch (channel) {
      OtpChannel.sms => 11,
      OtpChannel.whatsapp => 12,
    };

class Msg91SendResult {
  const Msg91SendResult({required this.reqId});

  /// MSG91's request ID for this OTP session — pass to [Msg91OtpRepository.retryOtp] (resend)
  /// and [Msg91OtpRepository.verifyOtp].
  final String reqId;
}

bool _widgetInitialized = false;

void _ensureWidgetInitialized() {
  if (_widgetInitialized) return;
  OTPWidget.initializeWidget(kMsg91WidgetId, kMsg91WidgetTokenAuth);
  _widgetInitialized = true;
}

/// ADR-057 — MSG91's OTP Widget SDK, called directly from the app to MSG91 (mirrors
/// `apps/web/lib/use-msg91-widget.ts`'s browser-side widget exactly, same underlying MSG91
/// product). Our backend never sees the send/verify legs here, only the final access token —
/// [verifyOtp] returns that token unchanged; the caller must still send it to
/// `POST /api/auth/phone-number/verify` (via `AuthRepository.verifyOtp`) for server-side
/// re-verification against MSG91 (`packages/services/.../msg91-widget-verify.adapter.ts`) before
/// Better Auth issues a session. This class never creates a user or a session by itself — it
/// only decides "is this OTP correct," identically to how the web widget's role is scoped.
///
/// This is the release-build OTP path only. Debug builds keep using the older backend-proxied
/// native-API flow (`AuthRepository.sendOtp`'s `kDebugMode` branch) so the dev-bypass and
/// `TEST_RIDER_PHONE`/`TEST_SERVICE_PROVIDER_PHONE` fixed-code mechanisms
/// (`packages/services/.../domain/test-otp-bypass.ts`) keep working for local/automated testing —
/// MSG91's widget always talks to real MSG91 and would reject a fake test code before our
/// backend ever saw it, so those two flows can't share one code path. See ADR-057.
class Msg91OtpRepository {
  /// [phoneNumber] must be E.164 (`+91XXXXXXXXXX`); MSG91 wants the identifier as digits only,
  /// country code without the `+` — converted here, never left to the caller.
  ///
  /// Throws [ApiException] (never a raw exception) on any failure — `AuthRepository`'s callers
  /// only ever catch `ApiException` (matching every other repository in this app), and this class
  /// sits *outside* `apiGuard`'s `DioException`-only catch (nothing here goes through `Dio` — the
  /// widget SDK talks to MSG91 directly), so it has to do its own conversion.
  Future<Msg91SendResult> sendOtp(String phoneNumber, {OtpChannel channel = OtpChannel.sms}) async {
    _ensureWidgetInitialized();
    final identifier = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
    final response = await _guarded(() => OTPWidget.sendOTP({'identifier': identifier}));
    final reqId = _extractReqId(response);
    if (reqId == null) {
      throw ApiException(statusCode: 0, message: 'Could not send the verification code. Please try again.');
    }

    // ADR-057 — MSG91's widget has no channel parameter on the *initial* send (confirmed against
    // MSG91's public docs; only `retryOTP` takes one), so `channel: whatsapp` here means: let the
    // default-channel send above go out, then immediately retry on WhatsApp. This is a real,
    // documented MSG91 limitation, not a workaround invented here (see ADR-057) — concretely, if
    // the widget's configured default channel is SMS, the phone may receive both an SMS and a
    // WhatsApp message with the same code, and MSG91 bills for both deliveries.
    if (channel == OtpChannel.whatsapp) {
      await retryOtp(reqId, channel: OtpChannel.whatsapp);
    }
    return Msg91SendResult(reqId: reqId);
  }

  Future<void> retryOtp(String reqId, {OtpChannel channel = OtpChannel.sms}) async {
    _ensureWidgetInitialized();
    await _guarded(() => OTPWidget.retryOTP({'reqId': reqId, 'retryChannel': _retryChannelCode(channel)}));
  }

  /// Returns MSG91's access token (an opaque, JWT-like string) on success — pass this straight
  /// through as `AuthRepository.verifyOtp`'s `code` argument, unchanged. Throws [ApiException] on
  /// rejection (wrong/expired code) with a generic message, same reasoning as [sendOtp]'s doc
  /// comment — never surfaces the SDK's raw error text, which isn't confirmed safe to show a user.
  Future<String> verifyOtp(String reqId, String otp) async {
    _ensureWidgetInitialized();
    final response = await _guarded(() => OTPWidget.verifyOTP({'reqId': reqId, 'otp': otp}));
    final token = _extractToken(response);
    if (token == null) {
      throw ApiException(statusCode: 400, message: 'Invalid or expired code. Please try again.', errorCode: 'INVALID_OTP');
    }
    return token;
  }

  /// Converts anything `sendotp_flutter_sdk` might throw (its own exception type isn't confirmed
  /// from public docs — could be a plain `String`, a `PlatformException`, or something else
  /// entirely) into an [ApiException], so every caller of this class can rely on catching exactly
  /// one exception type, matching the rest of this app's repositories.
  Future<T> _guarded<T>(Future<T> Function() call) async {
    try {
      return await call();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(statusCode: 0, message: 'Could not reach the verification service. Please try again.');
    }
  }

  /// `sendotp_flutter_sdk`'s exact response shape for a successful send is not confirmed from
  /// public docs alone (its README shows the call, not the response body) — this reads every
  /// plausible key defensively rather than assuming one. **Needs live-device confirmation**
  /// before this is trusted without a manual test pass — flagged explicitly in ADR-057 and the
  /// implementation report rather than silently assumed correct.
  String? _extractReqId(dynamic response) {
    if (response is Map) {
      final candidate = response['message'] ?? response['reqId'] ?? response['req_id'] ?? response['reqID'];
      if (candidate is String && candidate.isNotEmpty) return candidate;
    }
    if (response is String && response.isNotEmpty) return response;
    return null;
  }

  /// Same caveat as [_extractReqId] — the failure shape in particular (does a rejected OTP throw,
  /// or resolve with `type: 'error'`?) needs a live-device test.
  String? _extractToken(dynamic response) {
    if (response is Map) {
      if (response['type'] == 'error') return null;
      final candidate =
          response['message'] ?? response['token'] ?? response['access-token'] ?? response['accessToken'];
      if (candidate is String && candidate.isNotEmpty) return candidate;
    }
    if (response is String && response.isNotEmpty) return response;
    return null;
  }
}
