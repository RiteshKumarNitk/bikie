import 'package:flutter/foundation.dart' show kReleaseMode;

/// API base URL, supplied at build/run time:
///
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000        # Android emulator against local dev server
///   flutter run --dart-define=API_BASE_URL=http://localhost:4000       # iOS simulator against local dev server
///   flutter run --dart-define=API_BASE_URL=http://192.168.x.x:4000     # physical device (LAN IP), local dev server
///
/// There is deliberately NO fallback to the deployed production API. As of
/// this writing, the production Vercel deployment has NOT picked up the
/// Phase 0 backend work (bearer plugin, booking/review/wishlist mutation
/// routes) even though it's committed on `origin/master` — it 404s/405s on
/// several documented routes. This file used to silently default `--release`
/// builds to that URL when no `--dart-define` was passed, which meant a
/// release build could look like it succeeded and then fail (or worse,
/// half-work) against a backend nobody had verified. That silent fallback
/// is intentionally gone.
///
/// Behavior now:
///   - Debug/profile builds (`flutter run`, local iteration) fall back to the
///     Android-emulator loopback address for the local dev server, matching
///     the documented dev workflow (`pnpm dev`, fixed to port 4000 per
///     ADR-003 in `.docs/DECISIONS.md`). This keeps `flutter run` usable with
///     zero flags on the emulator. Override with `--dart-define=API_BASE_URL=...`
///     for the iOS simulator or a physical device as shown above.
///   - Release builds MUST pass `--dart-define=API_BASE_URL=...` explicitly.
///     If they don't, [kApiBaseUrl] throws a [StateError] at first access
///     instead of silently shipping a build wired to an unverified backend.
///     Before pointing a release build at the production Vercel deployment,
///     confirm it's actually caught up with
///     `curl -i <url>/api/auth/sign-in/email` (look for a `set-auth-token`
///     response header) — the backend lagging behind is exactly the incident
///     this guard exists to prevent.
const String _apiBaseUrlDefine = String.fromEnvironment('API_BASE_URL');

const String _localDevFallback = 'http://10.0.2.2:4000';

/// Resolved API base URL. See the doc comment above for the debug-vs-release
/// fallback rules — release builds throw rather than silently degrading.
String get kApiBaseUrl {
  if (_apiBaseUrlDefine.isNotEmpty) return _apiBaseUrlDefine;
  if (kReleaseMode) {
    throw StateError(
      'API_BASE_URL dart-define was not provided for a release build. '
      'Refusing to silently fall back to a default backend (see the doc '
      'comment in app_config.dart for why). Build with '
      '`flutter build <target> --dart-define=API_BASE_URL=https://<verified-host>` '
      'after confirming that host is actually up to date.',
    );
  }
  return _localDevFallback;
}
