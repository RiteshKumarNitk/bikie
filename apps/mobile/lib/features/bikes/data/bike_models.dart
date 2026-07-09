import 'package:freezed_annotation/freezed_annotation.dart';

part 'bike_models.freezed.dart';
part 'bike_models.g.dart';

@freezed
class BikeCategoryRef with _$BikeCategoryRef {
  const factory BikeCategoryRef({required String name, required String slug}) = _BikeCategoryRef;

  factory BikeCategoryRef.fromJson(Map<String, dynamic> json) => _$BikeCategoryRefFromJson(json);
}

@freezed
class BikeDestinationRef with _$BikeDestinationRef {
  const factory BikeDestinationRef({required String name, required String slug}) = _BikeDestinationRef;

  factory BikeDestinationRef.fromJson(Map<String, dynamic> json) => _$BikeDestinationRefFromJson(json);
}

/// Mirrors `packages/types/src/bike.ts` `BikeSummaryDTO`.
@freezed
class BikeSummary with _$BikeSummary {
  const factory BikeSummary({
    required String id,
    required String slug,
    required String name,
    required String brand,
    required BikeCategoryRef category,
    required num pricePerDay,
    required String city,
    required String imageUrl,
    required num ratingAvg,
    required int ratingCount,
    required bool instantBooking,
  }) = _BikeSummary;

  factory BikeSummary.fromJson(Map<String, dynamic> json) => _$BikeSummaryFromJson(json);
}

/// Mirrors `packages/types/src/bike.ts` `BikeDetailDTO`.
@freezed
class BikeDetail with _$BikeDetail {
  const factory BikeDetail({
    required String id,
    required String slug,
    required String name,
    required String brand,
    required BikeCategoryRef category,
    required num pricePerDay,
    required String city,
    required String imageUrl,
    required num ratingAvg,
    required int ratingCount,
    required bool instantBooking,
    required List<String> gallery,
    String? description,
    required num securityDeposit,
    int? engineCc,
    num? mileageKmpl,
    num? fuelTankLitres,
    required bool hasAbs,
    int? seatHeightMm,
    int? luggageCapacityL,
    required bool helmetIncluded,
    required bool deliveryAvailable,
    BikeDestinationRef? destination,
  }) = _BikeDetail;

  factory BikeDetail.fromJson(Map<String, dynamic> json) => _$BikeDetailFromJson(json);
}

/// Mirrors `packages/types/src/bike.ts` `BikeSearchResultDTO`.
@freezed
class BikeSearchResult with _$BikeSearchResult {
  const factory BikeSearchResult({
    required List<BikeSummary> bikes,
    required int total,
    required int page,
    required int pageSize,
  }) = _BikeSearchResult;

  factory BikeSearchResult.fromJson(Map<String, dynamic> json) => _$BikeSearchResultFromJson(json);
}

/// Mirrors `packages/validation/src/query.schema.ts` `bikeSearchQuerySchema`.
class BikeSearchParams {
  const BikeSearchParams({
    this.location,
    this.category,
    this.priceMin,
    this.priceMax,
    this.brand,
    this.instantBooking,
    this.sort,
    this.page = 1,
    this.pageSize = 12,
  });

  final String? location;
  final String? category;
  final num? priceMin;
  final num? priceMax;
  final String? brand;
  final bool? instantBooking;
  final String? sort; // price_asc | price_desc | rating
  final int page;
  final int pageSize;

  Map<String, dynamic> toQuery() => {
        if (location != null && location!.isNotEmpty) 'location': location,
        if (category != null && category!.isNotEmpty) 'category': category,
        if (priceMin != null) 'priceMin': priceMin,
        if (priceMax != null) 'priceMax': priceMax,
        if (brand != null && brand!.isNotEmpty) 'brand': brand,
        if (instantBooking != null) 'instantBooking': instantBooking.toString(),
        if (sort != null) 'sort': sort,
        'page': page,
        'pageSize': pageSize,
      };

  BikeSearchParams copyWith({
    String? location,
    String? category,
    num? priceMin,
    num? priceMax,
    String? brand,
    bool? instantBooking,
    String? sort,
    int? page,
  }) {
    return BikeSearchParams(
      location: location ?? this.location,
      category: category ?? this.category,
      priceMin: priceMin ?? this.priceMin,
      priceMax: priceMax ?? this.priceMax,
      brand: brand ?? this.brand,
      instantBooking: instantBooking ?? this.instantBooking,
      sort: sort ?? this.sort,
      page: page ?? this.page,
      pageSize: pageSize,
    );
  }
}
