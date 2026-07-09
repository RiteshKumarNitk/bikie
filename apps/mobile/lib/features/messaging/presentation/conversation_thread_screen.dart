import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/async_value_view.dart';
import '../../auth/domain/auth_controller.dart';
import '../domain/message_providers.dart';

class ConversationThreadScreen extends ConsumerStatefulWidget {
  const ConversationThreadScreen({super.key, required this.conversationId});

  final String conversationId;

  @override
  ConsumerState<ConversationThreadScreen> createState() => _ConversationThreadScreenState();
}

class _ConversationThreadScreenState extends ConsumerState<ConversationThreadScreen> {
  final _controller = TextEditingController();
  bool _isSending = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final content = _controller.text.trim();
    if (content.isEmpty) return;
    setState(() => _isSending = true);
    _controller.clear();
    try {
      await ref.read(conversationThreadProvider(widget.conversationId).notifier).send(
            widget.conversationId,
            content,
          );
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(conversationThreadProvider(widget.conversationId));
    final myId = ref.watch(authControllerProvider).user?.id;

    return Scaffold(
      appBar: AppBar(title: const Text('Conversation')),
      body: Column(
        children: [
          Expanded(
            child: AsyncValueView(
              value: messages,
              data: (list) => ListView.builder(
                reverse: true,
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                itemBuilder: (context, index) {
                  final message = list[list.length - 1 - index];
                  final isMine = message.senderId == myId;
                  return Align(
                    alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                      decoration: BoxDecoration(
                        color: isMine
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        message.content,
                        style: TextStyle(color: isMine ? Colors.white : null),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      decoration: const InputDecoration(hintText: 'Message'),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  IconButton(
                    icon: _isSending
                        ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.send),
                    onPressed: _isSending ? null : _send,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
