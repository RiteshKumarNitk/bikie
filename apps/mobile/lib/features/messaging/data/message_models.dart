import 'package:freezed_annotation/freezed_annotation.dart';

part 'message_models.freezed.dart';
part 'message_models.g.dart';

@freezed
class ConversationParticipant with _$ConversationParticipant {
  const factory ConversationParticipant({
    required String id,
    required String name,
    required String email,
    required String role,
  }) = _ConversationParticipant;

  factory ConversationParticipant.fromJson(Map<String, dynamic> json) =>
      _$ConversationParticipantFromJson(json);
}

@freezed
class LastMessagePreview with _$LastMessagePreview {
  const factory LastMessagePreview({
    required String content,
    required String createdAt,
    required String senderId,
  }) = _LastMessagePreview;

  factory LastMessagePreview.fromJson(Map<String, dynamic> json) => _$LastMessagePreviewFromJson(json);
}

/// Mirrors `packages/types/src/message.ts` `ConversationDTO`.
@freezed
class ConversationModel with _$ConversationModel {
  const factory ConversationModel({
    required String id,
    String? subject,
    required List<ConversationParticipant> participants,
    LastMessagePreview? lastMessage,
    required int unreadCount,
    required String createdAt,
    required String updatedAt,
  }) = _ConversationModel;

  factory ConversationModel.fromJson(Map<String, dynamic> json) => _$ConversationModelFromJson(json);
}

/// Mirrors `packages/types/src/message.ts` `MessageDTO`.
@freezed
class MessageModel with _$MessageModel {
  const factory MessageModel({
    required String id,
    required String conversationId,
    required String senderId,
    required String senderName,
    required String content,
    String? readAt,
    required String createdAt,
  }) = _MessageModel;

  factory MessageModel.fromJson(Map<String, dynamic> json) => _$MessageModelFromJson(json);
}
