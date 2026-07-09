import 'package:freezed_annotation/freezed_annotation.dart';

import '../../bikes/data/bike_models.dart';

part 'destination_models.freezed.dart';
part 'destination_models.g.dart';

/// Mirrors `packages/types/src/destination.ts` `DestinationSummaryDTO`.
@freezed
class DestinationSummary with _$DestinationSummary {
  const factory DestinationSummary({
    required String id,
    required String slug,
    required String name,
    required String state,
    required String imageUrl,
    required int bikeCount,
  }) = _DestinationSummary;

  factory DestinationSummary.fromJson(Map<String, dynamic> json) => _$DestinationSummaryFromJson(json);
}

/// Mirrors `packages/types/src/destination.ts` `DestinationDetailDTO`.
@freezed
class DestinationDetail with _$DestinationDetail {
  const factory DestinationDetail({
    required String id,
    required String slug,
    required String name,
    required String state,
    required String imageUrl,
    required int bikeCount,
    String? description,
    required List<BikeSummary> bikes,
  }) = _DestinationDetail;

  factory DestinationDetail.fromJson(Map<String, dynamic> json) => _$DestinationDetailFromJson(json);
}
