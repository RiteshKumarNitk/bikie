import 'package:freezed_annotation/freezed_annotation.dart';

part 'referral_model.freezed.dart';
part 'referral_model.g.dart';

@freezed
class ReferredUser with _$ReferredUser {
  const factory ReferredUser({
    required String id,
    required String name,
    required String email,
    required String createdAt,
  }) = _ReferredUser;

  factory ReferredUser.fromJson(Map<String, dynamic> json) => _$ReferredUserFromJson(json);
}

/// Mirrors `packages/types/src/referral.ts` `ReferralInfoDTO`.
@freezed
class ReferralInfo with _$ReferralInfo {
  const factory ReferralInfo({
    required String code,
    required List<ReferredUser> referrals,
  }) = _ReferralInfo;

  factory ReferralInfo.fromJson(Map<String, dynamic> json) => _$ReferralInfoFromJson(json);
}
