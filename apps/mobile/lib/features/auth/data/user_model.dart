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
    // ADR-046b — denormalized Partner.verificationStatus. ADR-053: verification/trust status
    // only now, never a capability/routing signal — see accountType below for that. `null`
    // means no Service Provider profile has ever been created ("NOT_APPLIED").
    String? partnerStatus,
    // ADR-053 — server-authoritative, mutually-exclusive Rider/Service-Provider selector. Set
    // only at registration or by an admin-approved Account Type Change Request, never
    // self-service. Defaults to RIDER to match the server's schema default.
    @Default('RIDER') String accountType,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) => _$UserModelFromJson(json);
}
