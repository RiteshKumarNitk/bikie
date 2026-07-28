import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'message_models.dart';

final messageRepositoryProvider = Provider<MessageRepository>((ref) {
  return MessageRepository(ref.watch(dioProvider));
});

class MessageRepository {
  MessageRepository(this._dio);

  final Dio _dio;

  Future<List<ConversationModel>> getConversations() {
    return apiGuard(() async {
      final res = await _dio.get('/api/conversations');
      return (res.data['conversations'] as List)
          .map((e) => ConversationModel.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  Future<List<MessageModel>> getMessages(String conversationId) {
    return apiGuard(() async {
      final res = await _dio.get('/api/conversations/$conversationId/messages');
      return (res.data['messages'] as List).map((e) => MessageModel.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  Future<MessageModel> sendMessage(String conversationId, {String? content, String? replyToId}) {
    return apiGuard(() async {
      final res = await _dio.post(
        '/api/conversations/$conversationId/messages',
        data: {
          if (content != null && content.isNotEmpty) 'content': content,
          if (replyToId != null) 'replyToId': replyToId,
        },
      );
      return MessageModel.fromJson(res.data['message'] as Map<String, dynamic>);
    });
  }

  Future<MessageModel> editMessage(String messageId, String content) {
    return apiGuard(() async {
      final res = await _dio.patch('/api/messages/$messageId', data: {'content': content});
      return MessageModel.fromJson(res.data['message'] as Map<String, dynamic>);
    });
  }

  Future<void> deleteMessage(String messageId) {
    return apiGuard(() async {
      await _dio.delete('/api/messages/$messageId');
    });
  }

  Future<void> reactToMessage(String messageId, String emoji) {
    return apiGuard(() async {
      await _dio.post('/api/messages/$messageId/react', data: {'emoji': emoji});
    });
  }

  Future<void> removeReaction(String messageId, String emoji) {
    return apiGuard(() async {
      await _dio.delete('/api/messages/$messageId/react', queryParameters: {'emoji': emoji});
    });
  }

  /// Fire-and-forget from the caller's perspective — see
  /// `ConversationThreadNotifier.setTyping`. Mobile has no way to *receive*
  /// other users' typing state without SSE (there is no polling-friendly GET
  /// for it), only to broadcast its own, same as `ChatArea.tsx`'s `postTyping`.
  Future<void> setTyping(String conversationId, bool isTyping) {
    return apiGuard(() async {
      await _dio.post('/api/conversations/$conversationId/typing', data: {'isTyping': isTyping});
    });
  }

  Future<void> markRead(String conversationId, String upToMessageId) {
    return apiGuard(() async {
      await _dio.post('/api/conversations/$conversationId/read', data: {'upToMessageId': upToMessageId});
    });
  }
}
