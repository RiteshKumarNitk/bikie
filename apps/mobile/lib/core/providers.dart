import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'storage/secure_storage.dart';

final flutterSecureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final secureStorageProvider = Provider<SecureStorage>((ref) {
  return SecureStorage(ref.watch(flutterSecureStorageProvider));
});
