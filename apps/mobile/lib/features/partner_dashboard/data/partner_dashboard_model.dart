import 'package:freezed_annotation/freezed_annotation.dart';

part 'partner_dashboard_model.freezed.dart';
part 'partner_dashboard_model.g.dart';

/// Mirrors `packages/types/src/partner.ts` `PartnerSosDashboardDTO` (ADR-044).
@freezed
class PartnerSosStats with _$PartnerSosStats {
  const factory PartnerSosStats({
    required int activeRequests,
    required int todayAssistanceCount,
    required int completedCount,
    required num ratingAvg,
    required int ratingCount,
  }) = _PartnerSosStats;

  factory PartnerSosStats.fromJson(Map<String, dynamic> json) => _$PartnerSosStatsFromJson(json);
}

/// Mirrors `PartnerNearbyRequestDTO`.
@freezed
class PartnerNearbyRequest with _$PartnerNearbyRequest {
  const factory PartnerNearbyRequest({
    required String id,
    required String type,
    required String severity,
    required String city,
    required num distanceMeters,
    required String createdAt,
  }) = _PartnerNearbyRequest;

  factory PartnerNearbyRequest.fromJson(Map<String, dynamic> json) => _$PartnerNearbyRequestFromJson(json);
}

/// Mirrors `PartnerPendingOfferDTO` — an offer this partner made that the rider hasn't yet
/// accepted/rejected (or that hasn't expired/been withdrawn). Distinct from
/// `PartnerNearbyRequest` (excludes anything already responded to) and `PartnerActiveSession`
/// (only exists once a rider has accepted).
@freezed
class PartnerPendingOffer with _$PartnerPendingOffer {
  const factory PartnerPendingOffer({
    required String offerId,
    required String alertId,
    required String alertType,
    required String severity,
    required String city,
    num? distanceMeters,
    int? etaMinutes,
    required String createdAt,
  }) = _PartnerPendingOffer;

  factory PartnerPendingOffer.fromJson(Map<String, dynamic> json) => _$PartnerPendingOfferFromJson(json);
}

/// Mirrors `PartnerActiveSessionDTO`.
@freezed
class PartnerActiveSession with _$PartnerActiveSession {
  const factory PartnerActiveSession({
    required String id,
    required String alertId,
    required String status,
    required String riderName,
    required String alertType,
    num? distanceMeters,
    int? etaMinutes,
  }) = _PartnerActiveSession;

  factory PartnerActiveSession.fromJson(Map<String, dynamic> json) => _$PartnerActiveSessionFromJson(json);
}

/// Mirrors `PartnerHistorySessionDTO` (ADR-046b) — "Completed Assistance"/"Assistance History".
@freezed
class PartnerHistorySession with _$PartnerHistorySession {
  const factory PartnerHistorySession({
    required String id,
    required String alertId,
    required String status,
    required String riderName,
    required String alertType,
    String? completedAt,
    String? cancelledAt,
    int? rating,
  }) = _PartnerHistorySession;

  factory PartnerHistorySession.fromJson(Map<String, dynamic> json) => _$PartnerHistorySessionFromJson(json);
}
