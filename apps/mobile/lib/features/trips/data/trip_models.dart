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
  const factory TripOrganizer({required String name, String? image}) = _TripOrganizer;

  factory TripOrganizer.fromJson(Map<String, dynamic> json) => _$TripOrganizerFromJson(json);
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
    required String description,
    required List<String> gallery,
    required TripOrganizer organizer,
  }) = _TripDetail;

  factory TripDetail.fromJson(Map<String, dynamic> json) => _$TripDetailFromJson(json);
}
