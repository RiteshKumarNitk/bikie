import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/async_value_view.dart';
import '../../../core/widgets/empty_state.dart';
import '../domain/message_providers.dart';

class ConversationsListScreen extends ConsumerWidget {
  const ConversationsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conversations = ref.watch(conversationsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: AsyncValueView(
        value: conversations,
        onRetry: () => ref.invalidate(conversationsProvider),
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(icon: Icons.chat_bubble_outline, title: 'No conversations yet');
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(conversationsProvider),
            child: ListView.separated(
              itemCount: list.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final c = list[index];
                return ListTile(
                  onTap: () => context.push('/messages/${c.id}'),
                  leading: CircleAvatar(child: Text((c.subject ?? 'C').substring(0, 1).toUpperCase())),
                  title: Text(c.subject ?? c.participants.map((p) => p.name).join(', ')),
                  subtitle: c.lastMessage != null
                      ? Text(c.lastMessage!.content, maxLines: 1, overflow: TextOverflow.ellipsis)
                      : null,
                  trailing: c.unreadCount > 0
                      ? CircleAvatar(
                          radius: 10,
                          backgroundColor: Theme.of(context).colorScheme.primary,
                          child: Text(
                            '${c.unreadCount}',
                            style: const TextStyle(fontSize: 11, color: Colors.white),
                          ),
                        )
                      : null,
                );
              },
            ),
          );
        },
      ),
    );
  }
}
