/// Maps the API's `{ error: string }` / `{ error: ZodFlattenedError }`
/// envelope (see `.docs/API.md` Conventions) into a typed exception every
/// repository can catch uniformly.
class ApiException implements Exception {
  ApiException({required this.statusCode, required this.message, this.fieldErrors, this.errorCode});

  factory ApiException.fromResponseData(int statusCode, dynamic data) {
    if (data is Map<String, dynamic>) {
      final error = data['error'];
      if (error is String) {
        // Some 403s (e.g. requireMembership()) send both a machine-readable
        // `error` code and a human-readable `message` — prefer the message
        // for display but keep the code so callers can branch on it.
        final apiMessage = data['message'];
        return ApiException(
          statusCode: statusCode,
          message: apiMessage is String ? apiMessage : error,
          errorCode: error,
        );
      }
      if (error is Map<String, dynamic>) {
        final fieldErrors = <String, List<String>>{};
        final rawFieldErrors = error['fieldErrors'];
        if (rawFieldErrors is Map<String, dynamic>) {
          for (final entry in rawFieldErrors.entries) {
            fieldErrors[entry.key] = (entry.value as List).map((e) => e.toString()).toList();
          }
        }
        final formErrors = (error['formErrors'] as List?)?.map((e) => e.toString()).toList() ?? [];
        final message = fieldErrors.values.expand((v) => v).followedBy(formErrors).join(', ');
        return ApiException(
          statusCode: statusCode,
          message: message.isEmpty ? 'Validation failed' : message,
          fieldErrors: fieldErrors,
        );
      }
      final apiMessage = data['message'];
      if (apiMessage is String) {
        return ApiException(statusCode: statusCode, message: apiMessage);
      }
    }
    return ApiException(statusCode: statusCode, message: 'Something went wrong');
  }

  final int statusCode;
  final String message;
  final Map<String, List<String>>? fieldErrors;
  final String? errorCode;

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isValidation => statusCode == 400;
  bool get isMembershipRequired => errorCode == 'MEMBERSHIP_REQUIRED';

  @override
  String toString() => 'ApiException($statusCode, $message)';
}
