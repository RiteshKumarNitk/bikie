// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'nearby_riders_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$NearbyRiderImpl _$$NearbyRiderImplFromJson(Map<String, dynamic> json) =>
    _$NearbyRiderImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      distanceMeters: json['distanceMeters'] as num,
    );

Map<String, dynamic> _$$NearbyRiderImplToJson(_$NearbyRiderImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'distanceMeters': instance.distanceMeters,
    };
