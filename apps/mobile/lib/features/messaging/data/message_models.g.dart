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
  role: json['role'] as String,
);

Map<String, dynamic> _$$ConversationParticipantImplToJson(
  _$ConversationParticipantImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'role': instance.role,
};

_$LastMessagePreviewImpl _$$LastMessagePreviewImplFromJson(
  Map<String, dynamic> json,
) => _$LastMessagePreviewImpl(
  content: json['content'] as String?,
  createdAt: json['createdAt'] as String,
  senderId: json['senderId'] as String?,
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
  isLocked: json['isLocked'] as bool? ?? false,
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
  'isLocked': instance.isLocked,
  'participants': instance.participants,
  'lastMessage': instance.lastMessage,
  'unreadCount': instance.unreadCount,
  'createdAt': instance.createdAt,
  'updatedAt': instance.updatedAt,
};

_$MessageAttachmentImpl _$$MessageAttachmentImplFromJson(
  Map<String, dynamic> json,
) => _$MessageAttachmentImpl(
  id: json['id'] as String,
  type: json['type'] as String,
  fileName: json['fileName'] as String,
  mimeType: json['mimeType'] as String,
  sizeBytes: (json['sizeBytes'] as num).toInt(),
  width: (json['width'] as num?)?.toInt(),
  height: (json['height'] as num?)?.toInt(),
);

Map<String, dynamic> _$$MessageAttachmentImplToJson(
  _$MessageAttachmentImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'type': instance.type,
  'fileName': instance.fileName,
  'mimeType': instance.mimeType,
  'sizeBytes': instance.sizeBytes,
  'width': instance.width,
  'height': instance.height,
};

_$MessageReceiptImpl _$$MessageReceiptImplFromJson(Map<String, dynamic> json) =>
    _$MessageReceiptImpl(
      userId: json['userId'] as String,
      deliveredAt: json['deliveredAt'] as String?,
      readAt: json['readAt'] as String?,
    );

Map<String, dynamic> _$$MessageReceiptImplToJson(
  _$MessageReceiptImpl instance,
) => <String, dynamic>{
  'userId': instance.userId,
  'deliveredAt': instance.deliveredAt,
  'readAt': instance.readAt,
};

_$MessageReactionImpl _$$MessageReactionImplFromJson(
  Map<String, dynamic> json,
) => _$MessageReactionImpl(
  emoji: json['emoji'] as String,
  userId: json['userId'] as String,
  createdAt: json['createdAt'] as String,
);

Map<String, dynamic> _$$MessageReactionImplToJson(
  _$MessageReactionImpl instance,
) => <String, dynamic>{
  'emoji': instance.emoji,
  'userId': instance.userId,
  'createdAt': instance.createdAt,
};

_$MessageModelImpl _$$MessageModelImplFromJson(Map<String, dynamic> json) =>
    _$MessageModelImpl(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      senderId: json['senderId'] as String?,
      senderName: json['senderName'] as String?,
      senderImage: json['senderImage'] as String?,
      type: json['type'] as String? ?? 'TEXT',
      content: json['content'] as String?,
      replyToId: json['replyToId'] as String?,
      editedAt: json['editedAt'] as String?,
      deletedAt: json['deletedAt'] as String?,
      attachments:
          (json['attachments'] as List<dynamic>?)
              ?.map(
                (e) => MessageAttachment.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          const [],
      receipts:
          (json['receipts'] as List<dynamic>?)
              ?.map((e) => MessageReceipt.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      reactions:
          (json['reactions'] as List<dynamic>?)
              ?.map((e) => MessageReaction.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$$MessageModelImplToJson(_$MessageModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'conversationId': instance.conversationId,
      'senderId': instance.senderId,
      'senderName': instance.senderName,
      'senderImage': instance.senderImage,
      'type': instance.type,
      'content': instance.content,
      'replyToId': instance.replyToId,
      'editedAt': instance.editedAt,
      'deletedAt': instance.deletedAt,
      'attachments': instance.attachments,
      'receipts': instance.receipts,
      'reactions': instance.reactions,
      'createdAt': instance.createdAt,
    };
