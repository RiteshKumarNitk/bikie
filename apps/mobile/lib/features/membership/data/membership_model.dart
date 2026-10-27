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

/// Mirrors `packages/types/src/membership.ts` `UserMembershipDTO`. The subscription fields are
/// nullable/optional — absent for the existing one-time/free/legacy rows, populated only once a
/// ₹149/year recurring subscription has been started. Mirrors `PartnerMembership`'s identical
/// fields (Service Provider ₹99/month) exactly.
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
    String? razorpaySubscriptionId,
    String? razorpayPlanId,
    String? subscriptionStatus,
    String? currentPeriodStart,
    String? currentPeriodEnd,
    String? cancelledAt,
    String? lastPaymentId,
  }) = _UserMembership;

  factory UserMembership.fromJson(Map<String, dynamic> json) => _$UserMembershipFromJson(json);
}
