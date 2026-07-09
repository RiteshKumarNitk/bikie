// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'booking_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$BookingBikeRefImpl _$$BookingBikeRefImplFromJson(Map<String, dynamic> json) =>
    _$BookingBikeRefImpl(
      slug: json['slug'] as String,
      name: json['name'] as String,
      imageUrl: json['imageUrl'] as String,
      brand: json['brand'] as String,
    );

Map<String, dynamic> _$$BookingBikeRefImplToJson(
  _$BookingBikeRefImpl instance,
) => <String, dynamic>{
  'slug': instance.slug,
  'name': instance.name,
  'imageUrl': instance.imageUrl,
  'brand': instance.brand,
};

_$BookingModelImpl _$$BookingModelImplFromJson(Map<String, dynamic> json) =>
    _$BookingModelImpl(
      id: json['id'] as String,
      status: json['status'] as String,
      startDate: json['startDate'] as String,
      endDate: json['endDate'] as String,
      totalPrice: json['totalPrice'] as num,
      pickupCity: json['pickupCity'] as String,
      createdAt: json['createdAt'] as String,
      bike: BookingBikeRef.fromJson(json['bike'] as Map<String, dynamic>),
      hasReview: json['hasReview'] as bool,
    );

Map<String, dynamic> _$$BookingModelImplToJson(_$BookingModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'status': instance.status,
      'startDate': instance.startDate,
      'endDate': instance.endDate,
      'totalPrice': instance.totalPrice,
      'pickupCity': instance.pickupCity,
      'createdAt': instance.createdAt,
      'bike': instance.bike,
      'hasReview': instance.hasReview,
    };
