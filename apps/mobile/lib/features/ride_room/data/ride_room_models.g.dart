// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ride_room_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$EmergencyContactImpl _$$EmergencyContactImplFromJson(
  Map<String, dynamic> json,
) => _$EmergencyContactImpl(
  name: json['name'] as String,
  phone: json['phone'] as String,
  relation: json['relation'] as String,
);

Map<String, dynamic> _$$EmergencyContactImplToJson(
  _$EmergencyContactImpl instance,
) => <String, dynamic>{
  'name': instance.name,
  'phone': instance.phone,
  'relation': instance.relation,
};

_$RideRoomImpl _$$RideRoomImplFromJson(Map<String, dynamic> json) =>
    _$RideRoomImpl(
      tripId: json['tripId'] as String,
      conversationId: json['conversationId'] as String,
      role: json['role'] as String,
      isLocked: json['isLocked'] as bool,
      meetingPoint: json['meetingPoint'] as String?,
      meetingLat: (json['meetingLat'] as num?)?.toDouble(),
      meetingLng: (json['meetingLng'] as num?)?.toDouble(),
      emergencyContacts:
          (json['emergencyContacts'] as List<dynamic>?)
              ?.map((e) => EmergencyContact.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$$RideRoomImplToJson(_$RideRoomImpl instance) =>
    <String, dynamic>{
      'tripId': instance.tripId,
      'conversationId': instance.conversationId,
      'role': instance.role,
      'isLocked': instance.isLocked,
      'meetingPoint': instance.meetingPoint,
      'meetingLat': instance.meetingLat,
      'meetingLng': instance.meetingLng,
      'emergencyContacts': instance.emergencyContacts,
    };

_$AnnouncementImpl _$$AnnouncementImplFromJson(Map<String, dynamic> json) =>
    _$AnnouncementImpl(
      id: json['id'] as String,
      tripId: json['tripId'] as String,
      authorId: json['authorId'] as String,
      authorName: json['authorName'] as String,
      content: json['content'] as String,
      pinnedAt: json['pinnedAt'] as String?,
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$$AnnouncementImplToJson(_$AnnouncementImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'tripId': instance.tripId,
      'authorId': instance.authorId,
      'authorName': instance.authorName,
      'content': instance.content,
      'pinnedAt': instance.pinnedAt,
      'createdAt': instance.createdAt,
    };

_$MediaItemImpl _$$MediaItemImplFromJson(Map<String, dynamic> json) =>
    _$MediaItemImpl(
      id: json['id'] as String,
      type: json['type'] as String,
      fileName: json['fileName'] as String,
      mimeType: json['mimeType'] as String,
      sizeBytes: (json['sizeBytes'] as num).toInt(),
      width: (json['width'] as num?)?.toInt(),
      height: (json['height'] as num?)?.toInt(),
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$$MediaItemImplToJson(_$MediaItemImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': instance.type,
      'fileName': instance.fileName,
      'mimeType': instance.mimeType,
      'sizeBytes': instance.sizeBytes,
      'width': instance.width,
      'height': instance.height,
      'createdAt': instance.createdAt,
    };
