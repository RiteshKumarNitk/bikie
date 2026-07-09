// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sos_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$SOSAlertImpl _$$SOSAlertImplFromJson(Map<String, dynamic> json) =>
    _$SOSAlertImpl(
      id: json['id'] as String,
      userId: json['userId'] as String,
      userName: json['userName'] as String,
      userPhone: json['userPhone'] as String?,
      userEmail: json['userEmail'] as String,
      type: json['type'] as String,
      description: json['description'] as String?,
      latitude: json['latitude'] as num,
      longitude: json['longitude'] as num,
      city: json['city'] as String,
      status: json['status'] as String,
      resolvedAt: json['resolvedAt'] as String?,
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$$SOSAlertImplToJson(_$SOSAlertImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'userName': instance.userName,
      'userPhone': instance.userPhone,
      'userEmail': instance.userEmail,
      'type': instance.type,
      'description': instance.description,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'city': instance.city,
      'status': instance.status,
      'resolvedAt': instance.resolvedAt,
      'createdAt': instance.createdAt,
    };
