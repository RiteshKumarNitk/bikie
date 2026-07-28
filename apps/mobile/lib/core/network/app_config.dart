/// API base URL, supplied at build/run time:
///
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000        # Android emulator against local dev server
///   flutter run --dart-define=API_BASE_URL=http://localhost:4000       # iOS simulator against local dev server
///   flutter run --dart-define=API_BASE_URL=http://192.168.x.x:4000     # physical device (LAN IP), local dev server
///
/// Defaults to the live production site (`https://bikie.app`) when no
/// `--dart-define` is passed, for both debug and release builds — confirmed
/// live and serving the real API during this pass (`GET /api/bikes/featured`
/// → 200 with real bike data). This replaces an earlier, stricter posture
/// (release builds threw rather than falling back) from when the production
/// deploy genuinely lagged behind `origin/master` on several routes — see
/// `.docs/TASKS.md` Milestone 6. Override with `--dart-define=API_BASE_URL=...`
/// for local iteration against `pnpm dev` (fixed to port 4000, ADR-003).
const String _apiBaseUrlDefine = String.fromEnvironment('API_BASE_URL');

const String _productionFallback = 'https://bikie.app';

/// Resolved API base URL.
String get kApiBaseUrl {
  if (_apiBaseUrlDefine.isNotEmpty) return _apiBaseUrlDefine;
  return _productionFallback;
}
