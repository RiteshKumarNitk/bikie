import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

/// Mirrors Better Auth's user shape (+ the `role`/`partnerStatus` additionalFields),
/// see `packages/auth/src/server.ts`.
@freezed
class UserModel with _$UserModel {
  const factory UserModel({
    required String id,
    required String name,
    required String email,
    required String role,
    String? phone,
    String? image,
    // ADR-046b — denormalized Partner.verificationStatus, decoupled from `role`. `null` means
    // no Service Provider application has ever been started ("NOT_APPLIED").
    String? partnerStatus,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) => _$UserModelFromJson(json);
}
