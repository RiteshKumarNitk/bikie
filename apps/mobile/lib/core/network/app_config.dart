/// API base URL, supplied at build/run time:
///
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000        # Android emulator against local dev server
///   flutter run --dart-define=API_BASE_URL=http://localhost:3000       # iOS simulator against local dev server
///   flutter run --dart-define=API_BASE_URL=http://192.168.x.x:3000     # physical device (LAN IP), local dev server
///
/// Defaults to the live production site (`https://bikie.app`) when no
/// `--dart-define` is passed, for both debug and release builds — confirmed
/// live and serving the real API during this pass (`GET /api/bikes/featured`
/// → 200 with real bike data). This replaces an earlier, stricter posture
/// (release builds threw rather than falling back) from when the production
/// deploy genuinely lagged behind `origin/master` on several routes — see
/// `.docs/TASKS.md` Milestone 6. Override with `--dart-define=API_BASE_URL=...`
/// for local iteration against `pnpm dev` (fixed to port 3000, ADR-003 — the
/// web app's `BETTER_AUTH_URL`/`NEXT_PUBLIC_APP_URL` both point at
/// `http://localhost:3000`).
const String _apiBaseUrlDefine = String.fromEnvironment('API_BASE_URL');

const String _productionFallback = 'https://bikie.app';

/// Resolved API base URL.
String get kApiBaseUrl {
  if (_apiBaseUrlDefine.isNotEmpty) return _apiBaseUrlDefine;
  return _productionFallback;
}

/// MSG91 OTP Widget credentials (ADR-057) — the same `widgetId`/`tokenAuth` pair web ships as
/// `NEXT_PUBLIC_MSG91_WIDGET_ID`/`NEXT_PUBLIC_MSG91_WIDGET_TOKEN_AUTH`. Safe to embed in the app
/// binary by the same reasoning as those `NEXT_PUBLIC_` vars: MSG91 scopes/restricts a widget by
/// domain/app in its own dashboard, not by keeping this pair secret — the real trust boundary is
/// server-side `verifyAccessToken` (see `Msg91OtpRepository`), which never trusts a client's mere
/// claim of a verified token. The `MSG91_AUTH_KEY` used for that server-side call is a *different*,
/// genuinely secret credential that must never appear here or anywhere else in this app.
///
/// Override for a non-production MSG91 widget (a staging/test widget configured in MSG91's
/// dashboard for this app's package name) via:
///   flutter run --dart-define=MSG91_WIDGET_ID=... --dart-define=MSG91_WIDGET_TOKEN_AUTH=...
const String _msg91WidgetIdDefine = String.fromEnvironment('MSG91_WIDGET_ID');
const String _msg91WidgetTokenAuthDefine = String.fromEnvironment('MSG91_WIDGET_TOKEN_AUTH');

const String _productionMsg91WidgetId = '366865617643373439363036';
const String _productionMsg91WidgetTokenAuth = '553102TZsB14dlJ806a72924fP1';

String get kMsg91WidgetId => _msg91WidgetIdDefine.isNotEmpty ? _msg91WidgetIdDefine : _productionMsg91WidgetId;

String get kMsg91WidgetTokenAuth =>
    _msg91WidgetTokenAuthDefine.isNotEmpty ? _msg91WidgetTokenAuthDefine : _productionMsg91WidgetTokenAuth;

/// ADR-072 — a small allowlist of dedicated test phone numbers (Rider / Service Provider) that
/// skip the MSG91 OTP round-trip: no code is sent, and `verifyOtp` posts the typed code straight
/// to the backend, which accepts it only if it equals the server-side `TEST_OTP`
/// (`packages/services/.../test-otp-bypass.ts`, ADR-072 also gates that on the backend env being
/// configured). This exists so Google Play / App Store review can sign in without a real SMS.
///
/// Supply at build time, comma-separated E.164:
///   flutter build appbundle --dart-define=TEST_RIDER_PHONE=+9198... --dart-define=TEST_SERVICE_PROVIDER_PHONE=+9198...
///
/// The numbers are not secret — they unlock only non-privileged demo accounts, and the fixed
/// code stays server-side. To ship a review build with zero extra flags, replace the empty
/// fallbacks below with the real test numbers (same pattern as the MSG91 widget id above).
const String _testRiderPhoneDefine = String.fromEnvironment('TEST_RIDER_PHONE');
const String _testServiceProviderPhoneDefine = String.fromEnvironment('TEST_SERVICE_PROVIDER_PHONE');

const String _testRiderPhoneFallback = '';
const String _testServiceProviderPhoneFallback = '';

/// Canonicalise to `+91` + 10 digits so the configured value matches regardless of how it was
/// written (`9876543210`, `+919876543210`, `91 98765 43210`, …).
String? _canonicalPhone(String raw) {
  final digits = raw.replaceAll(RegExp(r'\D'), '');
  final local = digits.length > 10 ? digits.substring(digits.length - 10) : digits;
  return local.length == 10 ? '+91$local' : null;
}

Iterable<String> _parsePhones(String raw) =>
    raw.split(',').map((n) => _canonicalPhone(n.trim())).whereType<String>();

final Set<String> kTestPhoneNumbers = {
  ..._parsePhones(_testRiderPhoneDefine.isNotEmpty ? _testRiderPhoneDefine : _testRiderPhoneFallback),
  ..._parsePhones(
    _testServiceProviderPhoneDefine.isNotEmpty
        ? _testServiceProviderPhoneDefine
        : _testServiceProviderPhoneFallback,
  ),
};

/// [phoneNumber] is normally E.164 (`+9198…`) but any format is tolerated.
bool isTestPhoneNumber(String phoneNumber) {
  final c = _canonicalPhone(phoneNumber);
  return c != null && kTestPhoneNumbers.contains(c);
}
