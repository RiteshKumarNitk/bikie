import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/domain/auth_controller.dart';
import '../data/message_models.dart';
import '../domain/message_providers.dart';

const _reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/// The actual chat surface — message list + composer, no `Scaffold`/`AppBar`
/// of its own — so it can be reused both by the standalone `/messages/:id`
/// screen and embedded as the Ride Room's "Chat" tab, without a second
/// messaging implementation (mirrors `ChatArea.tsx`/`MessageItem.tsx`).
class ConversationThreadBody extends ConsumerStatefulWidget {
  const ConversationThreadBody({super.key, required this.conversationId, this.fast = false});

  final String conversationId;

  /// `true` for a Ride Room thread — polls every 3s instead of 6s (ADR-011).
  final bool fast;

  @override
  ConsumerState<ConversationThreadBody> createState() => _ConversationThreadBodyState();
}

class _ConversationThreadBodyState extends ConsumerState<ConversationThreadBody> {
  final _composerController = TextEditingController();
  final _searchController = TextEditingController();
  bool _isSending = false;
  bool _isSearching = false;
  MessageModel? _replyTo;

  ThreadKey get _key => (conversationId: widget.conversationId, fast: widget.fast);

  @override
  void dispose() {
    _composerController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onComposerChanged(String value) {
    ref.read(conversationThreadProvider(_key).notifier).setTyping(widget.conversationId, value.trim().isNotEmpty);
  }

  Future<void> _send() async {
    final content = _composerController.text.trim();
    if (content.isEmpty) return;
    setState(() => _isSending = true);
    _composerController.clear();
    final replyToId = _replyTo?.id;
    setState(() => _replyTo = null);
    ref.read(conversationThreadProvider(_key).notifier).setTyping(widget.conversationId, false);
    try {
      await ref.read(conversationThreadProvider(_key).notifier).send(
            widget.conversationId,
            content: content,
            replyToId: replyToId,
          );
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.errorCode == 'MUTED' ? "You've been muted and can't send messages." : e.message)),
        );
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  Future<void> _delete(MessageModel message) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete this message?'),
        content: const Text('This deletes it for everyone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirmed != true) return;
    await ref.read(conversationThreadProvider(_key).notifier).delete(widget.conversationId, message.id);
  }

  Future<void> _edit(MessageModel message) async {
    final controller = TextEditingController(text: message.content ?? '');
    final newContent = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit message'),
        content: TextField(controller: controller, autofocus: true, maxLines: 4),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, controller.text.trim()), child: const Text('Save')),
        ],
      ),
    );
    if (newContent == null || newContent.isEmpty || newContent == message.content) return;
    final ok = await ref.read(conversationThreadProvider(_key).notifier).edit(widget.conversationId, message.id, newContent);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Couldn't edit this message.")));
    }
  }

  void _react(MessageModel message, String emoji, String myId) {
    final alreadyReacted = message.reactions.any((r) => r.emoji == emoji && r.userId == myId);
    ref.read(conversationThreadProvider(_key).notifier).toggleReaction(
          widget.conversationId,
          message.id,
          emoji,
          alreadyReacted: alreadyReacted,
        );
  }

  void _showActions(MessageModel message, bool isMine, String myId) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: _reactionEmojis
                    .map(
                      (emoji) => IconButton(
                        onPressed: () {
                          Navigator.pop(context);
                          _react(message, emoji, myId);
                        },
                        icon: Text(emoji, style: const TextStyle(fontSize: 22)),
                      ),
                    )
                    .toList(),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.reply_outlined),
              title: const Text('Reply'),
              onTap: () {
                Navigator.pop(context);
                setState(() => _replyTo = message);
              },
            ),
            if (isMine) ...[
              ListTile(
                leading: const Icon(Icons.edit_outlined),
                title: const Text('Edit'),
                onTap: () {
                  Navigator.pop(context);
                  _edit(message);
                },
              ),
              ListTile(
                leading: Icon(Icons.delete_outline, color: Theme.of(context).colorScheme.error),
                title: Text('Delete', style: TextStyle(color: Theme.of(context).colorScheme.error)),
                onTap: () {
                  Navigator.pop(context);
                  _delete(message);
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(conversationThreadProvider(_key));
    final myId = ref.watch(authControllerProvider).user?.id;

    ref.listen(conversationThreadProvider(_key), (previous, next) {
      final list = next.valueOrNull;
      if (list == null || list.isEmpty) return;
      ref.read(conversationThreadProvider(_key).notifier).markReadUpTo(widget.conversationId, list.last.id);
    });

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            children: [
              Expanded(
                child: _isSearching
                    ? TextField(
                        controller: _searchController,
                        autofocus: true,
                        decoration: const InputDecoration(hintText: 'Search this conversation…', isDense: true),
                        onChanged: (_) => setState(() {}),
                      )
                    : const SizedBox.shrink(),
              ),
              IconButton(
                icon: Icon(_isSearching ? Icons.close : Icons.search),
                onPressed: () => setState(() {
                  _isSearching = !_isSearching;
                  if (!_isSearching) _searchController.clear();
                }),
              ),
            ],
          ),
        ),
        Expanded(
          child: messagesAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Center(
              child: Text(error is ApiException ? error.message : "Couldn't load messages."),
            ),
            data: (allMessages) {
              final query = _searchController.text.trim().toLowerCase();
              final messages = query.isEmpty
                  ? allMessages
                  : allMessages.where((m) => (m.content ?? '').toLowerCase().contains(query)).toList();
              final byId = {for (final m in allMessages) m.id: m};

              if (messages.isEmpty) {
                return Center(
                  child: Text(query.isEmpty ? 'No messages yet — say hi 👋' : 'No messages match "$query"'),
                );
              }

              return ListView.builder(
                reverse: true,
                padding: const EdgeInsets.all(16),
                itemCount: messages.length,
                itemBuilder: (context, index) {
                  final message = messages[messages.length - 1 - index];
                  final isMine = message.senderId != null && message.senderId == myId;
                  final replyToMessage = message.replyToId != null ? byId[message.replyToId] : null;
                  return _MessageBubble(
                    message: message,
                    isMine: isMine,
                    replyToMessage: replyToMessage,
                    onLongPress: message.deletedAt == null && myId != null
                        ? () => _showActions(message, isMine, myId)
                        : null,
                    onReactionTap: myId != null ? (emoji) => _react(message, emoji, myId) : null,
                  );
                },
              );
            },
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_replyTo != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Replying to ${_replyTo!.senderName ?? "message"}',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.accentTextOf(context)),
                              ),
                              Text(
                                _replyTo!.deletedAt != null ? 'This message was deleted.' : (_replyTo!.content ?? ''),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, size: 18),
                          onPressed: () => setState(() => _replyTo = null),
                        ),
                      ],
                    ),
                  ),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _composerController,
                        onChanged: _onComposerChanged,
                        decoration: const InputDecoration(hintText: 'Type a message…'),
                        onSubmitted: (_) => _send(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: _isSending
                          ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.send),
                      onPressed: _isSending ? null : _send,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({
    required this.message,
    required this.isMine,
    required this.replyToMessage,
    required this.onLongPress,
    required this.onReactionTap,
  });

  final MessageModel message;
  final bool isMine;
  final MessageModel? replyToMessage;
  final VoidCallback? onLongPress;
  final void Function(String emoji)? onReactionTap;

  @override
  Widget build(BuildContext context) {
    if (message.type == 'SYSTEM') {
      return Center(
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 8),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(message.content ?? '', style: Theme.of(context).textTheme.bodySmall),
        ),
      );
    }

    final isDeleted = message.deletedAt != null;
    final reactionCounts = <String, int>{};
    for (final r in message.reactions) {
      reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Column(
        crossAxisAlignment: isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onLongPress: onLongPress,
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: isMine ? Theme.of(context).colorScheme.primary : Theme.of(context).cardColor,
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(16),
                    topRight: const Radius.circular(16),
                    bottomLeft: Radius.circular(isMine ? 16 : 2),
                    bottomRight: Radius.circular(isMine ? 2 : 16),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!isMine)
                      Text(
                        message.senderName ?? 'Rider',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.accentTextOf(context)),
                      ),
                    if (replyToMessage != null && !isDeleted)
                      Container(
                        margin: const EdgeInsets.only(top: 2, bottom: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          border: Border(
                            left: BorderSide(color: isMine ? Colors.white70 : AppTheme.accentTextOf(context), width: 2),
                          ),
                          color: (isMine ? Colors.white : Colors.black).withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              replyToMessage!.senderName ?? 'Message',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: isMine ? Colors.white70 : null,
                              ),
                            ),
                            Text(
                              replyToMessage!.deletedAt != null ? 'This message was deleted.' : (replyToMessage!.content ?? ''),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 11, color: isMine ? Colors.white70 : null),
                            ),
                          ],
                        ),
                      ),
                    Text(
                      isDeleted ? 'This message was deleted.' : (message.content ?? ''),
                      style: TextStyle(
                        color: isMine ? Colors.white : null,
                        fontStyle: isDeleted ? FontStyle.italic : FontStyle.normal,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _formatTime(message.createdAt),
                          style: TextStyle(fontSize: 10, color: (isMine ? Colors.white : null)?.withValues(alpha: 0.7)),
                        ),
                        if (message.editedAt != null && !isDeleted) ...[
                          const SizedBox(width: 4),
                          Text('(edited)', style: TextStyle(fontSize: 9, color: (isMine ? Colors.white : null)?.withValues(alpha: 0.7))),
                        ],
                        if (isMine && !isDeleted) ...[
                          const SizedBox(width: 4),
                          _ReadReceiptTicks(receipts: message.receipts),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (reactionCounts.isNotEmpty && !isDeleted)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Wrap(
                spacing: 4,
                children: reactionCounts.entries
                    .map(
                      (e) => GestureDetector(
                        onTap: onReactionTap != null ? () => onReactionTap!(e.key) : null,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Theme.of(context).cardColor,
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: Theme.of(context).dividerColor),
                          ),
                          child: Text('${e.key} ${e.value}', style: const TextStyle(fontSize: 11)),
                        ),
                      ),
                    )
                    .toList(),
              ),
            ),
        ],
      ),
    );
  }

  static String _formatTime(String iso) {
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return '';
    final hour = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final minute = dt.minute.toString().padLeft(2, '0');
    return '$hour:$minute ${dt.hour >= 12 ? 'PM' : 'AM'}';
  }
}

/// Mirrors `MessageItem.tsx`'s `ReadReceiptTicks`: single grey tick = sent
/// (no receipts tracked yet), double grey = delivered, double accent = read.
class _ReadReceiptTicks extends StatelessWidget {
  const _ReadReceiptTicks({required this.receipts});

  final List<MessageReceipt> receipts;

  @override
  Widget build(BuildContext context) {
    if (receipts.isEmpty) {
      return const Icon(Icons.done, size: 14, color: Colors.white70);
    }
    final allRead = receipts.every((r) => r.readAt != null);
    final allDelivered = receipts.every((r) => r.deliveredAt != null);
    if (allRead) {
      return Icon(Icons.done_all, size: 14, color: AppTheme.accentTextOf(context));
    }
    if (allDelivered) {
      return const Icon(Icons.done_all, size: 14, color: Colors.white70);
    }
    return const Icon(Icons.done, size: 14, color: Colors.white70);
  }
}
