import 'package:freezed_annotation/freezed_annotation.dart';

part 'trip_models.freezed.dart';
part 'trip_models.g.dart';

@freezed
class TripDestinationRef with _$TripDestinationRef {
  const factory TripDestinationRef({required String name, required String slug}) = _TripDestinationRef;

  factory TripDestinationRef.fromJson(Map<String, dynamic> json) => _$TripDestinationRefFromJson(json);
}

@freezed
class TripOrganizer with _$TripOrganizer {
  const factory TripOrganizer({required String id, required String name, String? image}) = _TripOrganizer;

  factory TripOrganizer.fromJson(Map<String, dynamic> json) => _$TripOrganizerFromJson(json);
}

@freezed
class TripMember with _$TripMember {
  const factory TripMember({required String id, required String name, String? image}) = _TripMember;

  factory TripMember.fromJson(Map<String, dynamic> json) => _$TripMemberFromJson(json);
}

/// Mirrors `packages/types/src/trip.ts` `TripSummaryDTO`.
@freezed
class TripSummary with _$TripSummary {
  const factory TripSummary({
    required String id,
    required String slug,
    required String title,
    required String imageUrl,
    required String type,
    required String difficulty,
    required num price,
    required int seatsTotal,
    required int seatsLeft,
    required String startDate,
    required String endDate,
    required String status,
    TripDestinationRef? destination,
    String? destinationName,
    int? unreadMessages,
    int? pendingRequests,
    int? membersCount,
  }) = _TripSummary;

  factory TripSummary.fromJson(Map<String, dynamic> json) => _$TripSummaryFromJson(json);
}

/// Mirrors `packages/types/src/trip.ts` `TripDetailDTO`.
@freezed
class TripDetail with _$TripDetail {
  const factory TripDetail({
    required String id,
    required String slug,
    required String title,
    required String imageUrl,
    required String type,
    required String difficulty,
    required num price,
    required int seatsTotal,
    required int seatsLeft,
    required String startDate,
    required String endDate,
    required String status,
    TripDestinationRef? destination,
    String? destinationName,
    required String description,
    required List<String> gallery,
    String? meetingPoint,
    double? meetingLat,
    double? meetingLng,
    required TripOrganizer organizer,
    List<TripMember>? members,
  }) = _TripDetail;

  factory TripDetail.fromJson(Map<String, dynamic> json) => _$TripDetailFromJson(json);
}

@freezed
class RideRequestRider with _$RideRequestRider {
  const factory RideRequestRider({
    required String id,
    required String name,
    String? image,
    int? completedRides,
    num? rating,
    String? bike,
  }) = _RideRequestRider;

  factory RideRequestRider.fromJson(Map<String, dynamic> json) => _$RideRequestRiderFromJson(json);
}

/// Mirrors `packages/types/src/trip.ts` `RideJoinRequestDTO`.
@freezed
class RideJoinRequest with _$RideJoinRequest {
  const factory RideJoinRequest({
    required String id,
    required String tripId,
    required String tripSlug,
    required String tripTitle,
    String? message,
    required String createdAt,
    required RideRequestRider rider,
  }) = _RideJoinRequest;

  factory RideJoinRequest.fromJson(Map<String, dynamic> json) => _$RideJoinRequestFromJson(json);
}

/// Mirrors `packages/types/src/trip.ts` `MyRideRequestStatusDTO`.
@freezed
class MyRideRequestStatus with _$MyRideRequestStatus {
  const factory MyRideRequestStatus({required String status, String? message}) = _MyRideRequestStatus;

  factory MyRideRequestStatus.fromJson(Map<String, dynamic> json) => _$MyRideRequestStatusFromJson(json);
}

/// Mirrors `packages/types/src/trip.ts` `RideStatsDTO`.
@freezed
class RideStats with _$RideStats {
  const factory RideStats({
    required int ridesOrganized,
    required int requestsSent,
    required int requestsApproved,
    required int ridesCancelled,
    int? approvalRate,
  }) = _RideStats;

  factory RideStats.fromJson(Map<String, dynamic> json) => _$RideStatsFromJson(json);
}

/// Mirrors the `GET /api/trips/mine` response envelope (see `.docs/API.md`).
@freezed
class MyRides with _$MyRides {
  const factory MyRides({
    required List<TripSummary> organized,
    required List<TripSummary> joined,
    required List<TripSummary> requested,
    required RideStats stats,
  }) = _MyRides;

  factory MyRides.fromJson(Map<String, dynamic> json) => _$MyRidesFromJson(json);
}
