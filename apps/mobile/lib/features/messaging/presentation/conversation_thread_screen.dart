import 'package:flutter/material.dart';

import 'conversation_thread_body.dart';

class ConversationThreadScreen extends StatelessWidget {
  const ConversationThreadScreen({super.key, required this.conversationId, this.fast = false});

  final String conversationId;

  /// `true` when entered from a Ride Room — polls faster (3s vs 6s, ADR-011).
  final bool fast;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Conversation')),
      body: ConversationThreadBody(conversationId: conversationId, fast: fast),
    );
  }
}
