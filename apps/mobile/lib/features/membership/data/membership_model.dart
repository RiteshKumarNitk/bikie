import 'package:freezed_annotation/freezed_annotation.dart';

part 'membership_model.freezed.dart';
part 'membership_model.g.dart';

/// Mirrors `packages/types/src/membership.ts` `MembershipPlanDTO`.
@freezed
class MembershipPlan with _$MembershipPlan {
  const factory MembershipPlan({
    required String id,
    required String name,
    required String description,
    required num price,
    required int durationDays,
    required List<String> benefits,
    required bool isActive,
  }) = _MembershipPlan;

  factory MembershipPlan.fromJson(Map<String, dynamic> json) => _$MembershipPlanFromJson(json);
}

/// Mirrors `packages/types/src/membership.ts` `UserMembershipDTO`.
@freezed
class UserMembership with _$UserMembership {
  const factory UserMembership({
    required String id,
    required String userId,
    required String planId,
    required MembershipPlan plan,
    required String startDate,
    required String endDate,
    required String status,
    required int daysLeft,
  }) = _UserMembership;

  factory UserMembership.fromJson(Map<String, dynamic> json) => _$UserMembershipFromJson(json);
}
