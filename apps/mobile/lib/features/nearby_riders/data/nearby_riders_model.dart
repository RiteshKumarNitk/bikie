import 'package:freezed_annotation/freezed_annotation.dart';

part 'nearby_riders_model.freezed.dart';
part 'nearby_riders_model.g.dart';

/// Mirrors `NearbyRiderRow` — no phone/email exposed here (unlike SOS dispatch's
/// contact-rich variant), matching `GET /api/riders/nearby`.
@freezed
class NearbyRider with _$NearbyRider {
  const factory NearbyRider({
    required String id,
    required String name,
    required num distanceMeters,
  }) = _NearbyRider;

  factory NearbyRider.fromJson(Map<String, dynamic> json) => _$NearbyRiderFromJson(json);
}
