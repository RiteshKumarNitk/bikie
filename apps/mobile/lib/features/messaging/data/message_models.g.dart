// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'message_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ConversationParticipantImpl _$$ConversationParticipantImplFromJson(
  Map<String, dynamic> json,
) => _$ConversationParticipantImpl(
  id: json['id'] as String,
  name: json['name'] as String,
  email: json['email'] as String,
  role: json['role'] as String,
);

Map<String, dynamic> _$$ConversationParticipantImplToJson(
  _$ConversationParticipantImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'email': instance.email,
  'role': instance.role,
};

_$LastMessagePreviewImpl _$$LastMessagePreviewImplFromJson(
  Map<String, dynamic> json,
) => _$LastMessagePreviewImpl(
  content: json['content'] as String,
  createdAt: json['createdAt'] as String,
  senderId: json['senderId'] as String,
);

Map<String, dynamic> _$$LastMessagePreviewImplToJson(
  _$LastMessagePreviewImpl instance,
) => <String, dynamic>{
  'content': instance.content,
  'createdAt': instance.createdAt,
  'senderId': instance.senderId,
};

_$ConversationModelImpl _$$ConversationModelImplFromJson(
  Map<String, dynamic> json,
) => _$ConversationModelImpl(
  id: json['id'] as String,
  subject: json['subject'] as String?,
  participants: (json['participants'] as List<dynamic>)
      .map((e) => ConversationParticipant.fromJson(e as Map<String, dynamic>))
      .toList(),
  lastMessage: json['lastMessage'] == null
      ? null
      : LastMessagePreview.fromJson(
          json['lastMessage'] as Map<String, dynamic>,
        ),
  unreadCount: (json['unreadCount'] as num).toInt(),
  createdAt: json['createdAt'] as String,
  updatedAt: json['updatedAt'] as String,
);

Map<String, dynamic> _$$ConversationModelImplToJson(
  _$ConversationModelImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'subject': instance.subject,
  'participants': instance.participants,
  'lastMessage': instance.lastMessage,
  'unreadCount': instance.unreadCount,
  'createdAt': instance.createdAt,
  'updatedAt': instance.updatedAt,
};

_$MessageModelImpl _$$MessageModelImplFromJson(Map<String, dynamic> json) =>
    _$MessageModelImpl(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      senderId: json['senderId'] as String,
      senderName: json['senderName'] as String,
      content: json['content'] as String,
      readAt: json['readAt'] as String?,
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$$MessageModelImplToJson(_$MessageModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'conversationId': instance.conversationId,
      'senderId': instance.senderId,
      'senderName': instance.senderName,
      'content': instance.content,
      'readAt': instance.readAt,
      'createdAt': instance.createdAt,
    };
