import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/message_models.dart';
import '../data/message_repository.dart';

final conversationsProvider = FutureProvider.autoDispose<List<ConversationModel>>((ref) {
  return ref.watch(messageRepositoryProvider).getConversations();
});

/// Polls every 6s while a thread screen is open. Deliberate scope trim vs.
/// the web's SSE-based live chat — see ROADMAP.md "Milestone 6b" and
/// DECISIONS.md for why: Dart has no mature first-party SSE client, and
/// `/api/sse` isn't bearer-auth verified.
final conversationThreadProvider =
    AsyncNotifierProvider.autoDispose.family<ConversationThreadNotifier, List<MessageModel>, String>(
  ConversationThreadNotifier.new,
);

class ConversationThreadNotifier extends AutoDisposeFamilyAsyncNotifier<List<MessageModel>, String> {
  Timer? _timer;

  @override
  Future<List<MessageModel>> build(String conversationId) async {
    ref.onDispose(() => _timer?.cancel());
    _timer = Timer.periodic(const Duration(seconds: 6), (_) => _poll(conversationId));
    return ref.watch(messageRepositoryProvider).getMessages(conversationId);
  }

  Future<void> _poll(String conversationId) async {
    try {
      final messages = await ref.read(messageRepositoryProvider).getMessages(conversationId);
      state = AsyncData(messages);
    } catch (_) {
      // Silently ignore transient polling failures; next tick retries.
    }
  }

  Future<void> send(String conversationId, String content) async {
    await ref.read(messageRepositoryProvider).sendMessage(conversationId, content);
    await _poll(conversationId);
  }
}
