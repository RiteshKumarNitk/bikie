import 'package:freezed_annotation/freezed_annotation.dart';

part 'partner_model.freezed.dart';
part 'partner_model.g.dart';

/// Mirrors `NearbyPartnerRow` (`packages/services/src/modules/partners/ports/index.ts`) — the
/// response shape of `GET /api/partners/nearby` (ADR-036).
@freezed
class NearbyPartner with _$NearbyPartner {
  const factory NearbyPartner({
    required String id,
    required String businessName,
    required String type,
    required String city,
    required double latitude,
    required double longitude,
    required double distanceMeters,
  }) = _NearbyPartner;

  factory NearbyPartner.fromJson(Map<String, dynamic> json) => _$NearbyPartnerFromJson(json);
}

const partnerTypeLabels = {
  'RENTAL': 'Bike Rental',
  'MECHANIC': 'Mechanic',
  'FUEL_DELIVERY': 'Fuel Delivery',
  'TOUR_GUIDE': 'Tour Guide',
  'HOTEL': 'Hotel',
  'CAMPING': 'Camping',
  'ACCESSORIES': 'Accessories',
  'PHOTOGRAPHY': 'Photography',
};
