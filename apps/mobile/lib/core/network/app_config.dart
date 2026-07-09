/// API base URL, supplied at build/run time:
///
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000        # Android emulator against local dev server
///   flutter run --dart-define=API_BASE_URL=http://localhost:4000       # iOS simulator against local dev server
///   flutter run --dart-define=API_BASE_URL=http://192.168.x.x:4000     # physical device (LAN IP), local dev server
///
/// Defaults to the deployed production API. Override with a local dev server
/// URL as shown above when iterating on backend changes that haven't been
/// deployed yet — as of this writing, production has NOT picked up the
/// Phase 0 backend work (bearer plugin, booking/review/wishlist mutation
/// routes) even though it's committed on `origin/master`; verify with
/// `curl -i .../api/auth/sign-in/email` (look for a `set-auth-token` header)
/// before relying on it for anything beyond browsing.
const String kApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://bikie-web-rs8i.vercel.app',
);
