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

  Future<MessageModel> sendMessage(String conversationId, String content) {
    return apiGuard(() async {
      final res = await _dio.post('/api/conversations/$conversationId/messages', data: {'content': content});
      return MessageModel.fromJson(res.data['message'] as Map<String, dynamic>);
    });
  }
}
