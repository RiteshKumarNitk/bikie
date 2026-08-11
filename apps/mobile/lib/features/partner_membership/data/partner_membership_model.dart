import 'package:freezed_annotation/freezed_annotation.dart';

part 'partner_membership_model.freezed.dart';
part 'partner_membership_model.g.dart';

/// ADR-051 — mirrors `packages/types/src/partner-membership.ts` `PartnerMembershipPlanDTO`.
/// A Service Provider's own membership, entirely separate from `MembershipPlan` (Rider).
@freezed
class PartnerMembershipPlan with _$PartnerMembershipPlan {
  const factory PartnerMembershipPlan({
    required String id,
    required String name,
    required String description,
    required num price,
    required int durationDays,
    required List<String> benefits,
    required bool isActive,
  }) = _PartnerMembershipPlan;

  factory PartnerMembershipPlan.fromJson(Map<String, dynamic> json) => _$PartnerMembershipPlanFromJson(json);
}

/// Mirrors `packages/types/src/partner-membership.ts` `PartnerMembershipDTO`.
@freezed
class PartnerMembership with _$PartnerMembership {
  const factory PartnerMembership({
    required String id,
    required String userId,
    required String planId,
    required PartnerMembershipPlan plan,
    required String startDate,
    required String endDate,
    required String status,
    required int daysLeft,
  }) = _PartnerMembership;

  factory PartnerMembership.fromJson(Map<String, dynamic> json) => _$PartnerMembershipFromJson(json);
}
