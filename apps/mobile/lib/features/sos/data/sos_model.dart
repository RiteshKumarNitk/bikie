import 'package:freezed_annotation/freezed_annotation.dart';

part 'sos_model.freezed.dart';
part 'sos_model.g.dart';

/// Mirrors `packages/types/src/sos.ts` `SOSAlertDTO`.
@freezed
class SOSAlert with _$SOSAlert {
  const factory SOSAlert({
    required String id,
    required String userId,
    required String userName,
    String? userPhone,
    required String userEmail,
    required String type,
    String? description,
    required num latitude,
    required num longitude,
    required String city,
    required String status,
    String? resolvedAt,
    required String createdAt,
  }) = _SOSAlert;

  factory SOSAlert.fromJson(Map<String, dynamic> json) => _$SOSAlertFromJson(json);
}
