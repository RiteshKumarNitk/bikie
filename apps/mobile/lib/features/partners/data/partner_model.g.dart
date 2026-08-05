// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'partner_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$NearbyPartnerImpl _$$NearbyPartnerImplFromJson(Map<String, dynamic> json) =>
    _$NearbyPartnerImpl(
      id: json['id'] as String,
      businessName: json['businessName'] as String,
      type: json['type'] as String,
      city: json['city'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      distanceMeters: (json['distanceMeters'] as num).toDouble(),
    );

Map<String, dynamic> _$$NearbyPartnerImplToJson(_$NearbyPartnerImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'businessName': instance.businessName,
      'type': instance.type,
      'city': instance.city,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'distanceMeters': instance.distanceMeters,
    };
