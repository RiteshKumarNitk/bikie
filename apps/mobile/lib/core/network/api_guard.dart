import 'package:dio/dio.dart';

import 'api_exception.dart';

/// Wraps a Dio call, converting any [DioException] into a typed
/// [ApiException] using the `{ error }` envelope described in
/// `.docs/API.md`, so every repository can `try`/`catch (ApiException)`.
Future<T> apiGuard<T>(Future<T> Function() call) async {
  try {
    return await call();
  } on DioException catch (e) {
    if (e.response != null) {
      throw ApiException.fromResponseData(e.response!.statusCode ?? 500, e.response!.data);
    }
    throw ApiException(statusCode: 0, message: e.message ?? 'Network error. Check your connection.');
  }
}
