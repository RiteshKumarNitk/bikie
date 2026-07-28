import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/message_models.dart';
import '../data/message_repository.dart';

final conversationsProvider = FutureProvider.autoDispose<List<ConversationModel>>((ref) {
  return ref.watch(messageRepositoryProvider).getConversations();
});

typedef ThreadKey = ({String conversationId, bool fast});

/// Polls every 6s (3s for `fast: true` — an open Ride Room thread, see
/// ADR-011) while a thread screen is open. Deliberate scope trim vs. the
/// web's SSE-based live chat — see ROADMAP.md "Milestone 6b" and
/// DECISIONS.md for why: Dart has no mature first-party SSE client, and
/// `/api/sse` isn't bearer-auth verified.
final conversationThreadProvider =
    AsyncNotifierProvider.autoDispose.family<ConversationThreadNotifier, List<MessageModel>, ThreadKey>(
  ConversationThreadNotifier.new,
);

class ConversationThreadNotifier extends AutoDisposeFamilyAsyncNotifier<List<MessageModel>, ThreadKey> {
  Timer? _timer;
  String? _lastMarkedReadId;

  @override
  Future<List<MessageModel>> build(ThreadKey arg) async {
    ref.onDispose(() => _timer?.cancel());
    _timer = Timer.periodic(Duration(seconds: arg.fast ? 3 : 6), (_) => _poll(arg.conversationId));
    return ref.watch(messageRepositoryProvider).getMessages(arg.conversationId);
  }

  Future<void> _poll(String conversationId) async {
    try {
      final messages = await ref.read(messageRepositoryProvider).getMessages(conversationId);
      state = AsyncData(messages);
    } catch (_) {
      // Silently ignore transient polling failures; next tick retries.
    }
  }

  Future<void> send(String conversationId, {String? content, String? replyToId}) async {
    await ref.read(messageRepositoryProvider).sendMessage(conversationId, content: content, replyToId: replyToId);
    await _poll(conversationId);
  }

  Future<bool> edit(String conversationId, String messageId, String content) async {
    try {
      await ref.read(messageRepositoryProvider).editMessage(messageId, content);
      await _poll(conversationId);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> delete(String conversationId, String messageId) async {
    await ref.read(messageRepositoryProvider).deleteMessage(messageId);
    await _poll(conversationId);
  }

  Future<void> toggleReaction(String conversationId, String messageId, String emoji, {required bool alreadyReacted}) async {
    if (alreadyReacted) {
      await ref.read(messageRepositoryProvider).removeReaction(messageId, emoji);
    } else {
      await ref.read(messageRepositoryProvider).reactToMessage(messageId, emoji);
    }
    await _poll(conversationId);
  }

  void setTyping(String conversationId, bool isTyping) {
    ref.read(messageRepositoryProvider).setTyping(conversationId, isTyping).catchError((_) {});
  }

  void markReadUpTo(String conversationId, String messageId) {
    if (_lastMarkedReadId == messageId) return;
    _lastMarkedReadId = messageId;
    ref.read(messageRepositoryProvider).markRead(conversationId, messageId).catchError((_) {});
  }
}
