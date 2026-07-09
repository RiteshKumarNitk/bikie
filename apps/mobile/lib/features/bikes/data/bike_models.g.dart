// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bike_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$BikeCategoryRefImpl _$$BikeCategoryRefImplFromJson(
  Map<String, dynamic> json,
) => _$BikeCategoryRefImpl(
  name: json['name'] as String,
  slug: json['slug'] as String,
);

Map<String, dynamic> _$$BikeCategoryRefImplToJson(
  _$BikeCategoryRefImpl instance,
) => <String, dynamic>{'name': instance.name, 'slug': instance.slug};

_$BikeDestinationRefImpl _$$BikeDestinationRefImplFromJson(
  Map<String, dynamic> json,
) => _$BikeDestinationRefImpl(
  name: json['name'] as String,
  slug: json['slug'] as String,
);

Map<String, dynamic> _$$BikeDestinationRefImplToJson(
  _$BikeDestinationRefImpl instance,
) => <String, dynamic>{'name': instance.name, 'slug': instance.slug};

_$BikeSummaryImpl _$$BikeSummaryImplFromJson(Map<String, dynamic> json) =>
    _$BikeSummaryImpl(
      id: json['id'] as String,
      slug: json['slug'] as String,
      name: json['name'] as String,
      brand: json['brand'] as String,
      category: BikeCategoryRef.fromJson(
        json['category'] as Map<String, dynamic>,
      ),
      pricePerDay: json['pricePerDay'] as num,
      city: json['city'] as String,
      imageUrl: json['imageUrl'] as String,
      ratingAvg: json['ratingAvg'] as num,
      ratingCount: (json['ratingCount'] as num).toInt(),
      instantBooking: json['instantBooking'] as bool,
    );

Map<String, dynamic> _$$BikeSummaryImplToJson(_$BikeSummaryImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'slug': instance.slug,
      'name': instance.name,
      'brand': instance.brand,
      'category': instance.category,
      'pricePerDay': instance.pricePerDay,
      'city': instance.city,
      'imageUrl': instance.imageUrl,
      'ratingAvg': instance.ratingAvg,
      'ratingCount': instance.ratingCount,
      'instantBooking': instance.instantBooking,
    };

_$BikeDetailImpl _$$BikeDetailImplFromJson(
  Map<String, dynamic> json,
) => _$BikeDetailImpl(
  id: json['id'] as String,
  slug: json['slug'] as String,
  name: json['name'] as String,
  brand: json['brand'] as String,
  category: BikeCategoryRef.fromJson(json['category'] as Map<String, dynamic>),
  pricePerDay: json['pricePerDay'] as num,
  city: json['city'] as String,
  imageUrl: json['imageUrl'] as String,
  ratingAvg: json['ratingAvg'] as num,
  ratingCount: (json['ratingCount'] as num).toInt(),
  instantBooking: json['instantBooking'] as bool,
  gallery: (json['gallery'] as List<dynamic>).map((e) => e as String).toList(),
  description: json['description'] as String?,
  securityDeposit: json['securityDeposit'] as num,
  engineCc: (json['engineCc'] as num?)?.toInt(),
  mileageKmpl: json['mileageKmpl'] as num?,
  fuelTankLitres: json['fuelTankLitres'] as num?,
  hasAbs: json['hasAbs'] as bool,
  seatHeightMm: (json['seatHeightMm'] as num?)?.toInt(),
  luggageCapacityL: (json['luggageCapacityL'] as num?)?.toInt(),
  helmetIncluded: json['helmetIncluded'] as bool,
  deliveryAvailable: json['deliveryAvailable'] as bool,
  destination: json['destination'] == null
      ? null
      : BikeDestinationRef.fromJson(
          json['destination'] as Map<String, dynamic>,
        ),
);

Map<String, dynamic> _$$BikeDetailImplToJson(_$BikeDetailImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'slug': instance.slug,
      'name': instance.name,
      'brand': instance.brand,
      'category': instance.category,
      'pricePerDay': instance.pricePerDay,
      'city': instance.city,
      'imageUrl': instance.imageUrl,
      'ratingAvg': instance.ratingAvg,
      'ratingCount': instance.ratingCount,
      'instantBooking': instance.instantBooking,
      'gallery': instance.gallery,
      'description': instance.description,
      'securityDeposit': instance.securityDeposit,
      'engineCc': instance.engineCc,
      'mileageKmpl': instance.mileageKmpl,
      'fuelTankLitres': instance.fuelTankLitres,
      'hasAbs': instance.hasAbs,
      'seatHeightMm': instance.seatHeightMm,
      'luggageCapacityL': instance.luggageCapacityL,
      'helmetIncluded': instance.helmetIncluded,
      'deliveryAvailable': instance.deliveryAvailable,
      'destination': instance.destination,
    };

_$BikeSearchResultImpl _$$BikeSearchResultImplFromJson(
  Map<String, dynamic> json,
) => _$BikeSearchResultImpl(
  bikes: (json['bikes'] as List<dynamic>)
      .map((e) => BikeSummary.fromJson(e as Map<String, dynamic>))
      .toList(),
  total: (json['total'] as num).toInt(),
  page: (json['page'] as num).toInt(),
  pageSize: (json['pageSize'] as num).toInt(),
);

Map<String, dynamic> _$$BikeSearchResultImplToJson(
  _$BikeSearchResultImpl instance,
) => <String, dynamic>{
  'bikes': instance.bikes,
  'total': instance.total,
  'page': instance.page,
  'pageSize': instance.pageSize,
};
