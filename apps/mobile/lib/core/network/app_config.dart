/// API base URL, supplied at build/run time:
///
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000        # Android emulator
///   flutter run --dart-define=API_BASE_URL=http://localhost:4000       # iOS simulator
///   flutter run --dart-define=API_BASE_URL=http://192.168.x.x:4000     # physical device (LAN IP)
///
/// Defaults to the Android emulator's loopback alias since that's the most
/// common first target; override for other platforms as shown above.
const String kApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:4000',
);
