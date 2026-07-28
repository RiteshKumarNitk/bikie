import 'package:freezed_annotation/freezed_annotation.dart';

part 'message_models.freezed.dart';
part 'message_models.g.dart';

/// Mirrors `packages/types/src/message.ts` `ConversationDTO.participants`.
/// Deliberately **no** `email` field — the API never sends one (an
/// anti-leak fix predating this model; the old version here required it as
/// non-nullable, which would have failed to parse every real response).
@freezed
class ConversationParticipant with _$ConversationParticipant {
  const factory ConversationParticipant({
    required String id,
    required String name,
    required String role,
  }) = _ConversationParticipant;

  factory ConversationParticipant.fromJson(Map<String, dynamic> json) =>
      _$ConversationParticipantFromJson(json);
}

@freezed
class LastMessagePreview with _$LastMessagePreview {
  const factory LastMessagePreview({
    String? content,
    required String createdAt,
    String? senderId,
  }) = _LastMessagePreview;

  factory LastMessagePreview.fromJson(Map<String, dynamic> json) => _$LastMessagePreviewFromJson(json);
}

/// Mirrors `packages/types/src/message.ts` `ConversationDTO`.
@freezed
class ConversationModel with _$ConversationModel {
  const factory ConversationModel({
    required String id,
    String? subject,
    @Default(false) bool isLocked,
    required List<ConversationParticipant> participants,
    LastMessagePreview? lastMessage,
    required int unreadCount,
    required String createdAt,
    required String updatedAt,
  }) = _ConversationModel;

  factory ConversationModel.fromJson(Map<String, dynamic> json) => _$ConversationModelFromJson(json);
}

/// Mirrors `packages/types/src/message.ts` `MessageAttachmentDTO`.
@freezed
class MessageAttachment with _$MessageAttachment {
  const factory MessageAttachment({
    required String id,
    required String type,
    required String fileName,
    required String mimeType,
    required int sizeBytes,
    int? width,
    int? height,
  }) = _MessageAttachment;

  factory MessageAttachment.fromJson(Map<String, dynamic> json) => _$MessageAttachmentFromJson(json);
}

/// Mirrors `packages/types/src/message.ts` `MessageReceiptDTO`.
@freezed
class MessageReceipt with _$MessageReceipt {
  const factory MessageReceipt({
    required String userId,
    String? deliveredAt,
    String? readAt,
  }) = _MessageReceipt;

  factory MessageReceipt.fromJson(Map<String, dynamic> json) => _$MessageReceiptFromJson(json);
}

/// Mirrors `packages/types/src/message.ts` `MessageReactionDTO`.
@freezed
class MessageReaction with _$MessageReaction {
  const factory MessageReaction({
    required String emoji,
    required String userId,
    required String createdAt,
  }) = _MessageReaction;

  factory MessageReaction.fromJson(Map<String, dynamic> json) => _$MessageReactionFromJson(json);
}

/// Mirrors `packages/types/src/message.ts` `MessageDTO`. `senderId`/`content`
/// are nullable: `SYSTEM` messages have no sender, and a moderator-deleted
/// message has its `content` nulled outright (true erasure, not soft-delete).
@freezed
class MessageModel with _$MessageModel {
  const factory MessageModel({
    required String id,
    required String conversationId,
    String? senderId,
    String? senderName,
    String? senderImage,
    @Default('TEXT') String type,
    String? content,
    String? replyToId,
    String? editedAt,
    String? deletedAt,
    @Default([]) List<MessageAttachment> attachments,
    @Default([]) List<MessageReceipt> receipts,
    @Default([]) List<MessageReaction> reactions,
    required String createdAt,
  }) = _MessageModel;

  factory MessageModel.fromJson(Map<String, dynamic> json) => _$MessageModelFromJson(json);
}
