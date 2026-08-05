import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/push/notification_deep_link.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../core/widgets/empty_state.dart';
import '../data/notification_models.dart';
import '../domain/notification_providers.dart';

/// `/notifications` — the in-app feed behind `components/chat/NotificationsTab.tsx`
/// on web (`GET/POST /api/notifications`), surfaced as its own screen on mobile
/// rather than a tab inside the messages panel.
class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsProvider);
    final unreadCount = ref.watch(unreadNotificationCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: () => ref.read(notificationsProvider.notifier).markAllRead(),
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: AsyncValueView(
        value: notifications,
        onRetry: () => ref.invalidate(notificationsProvider),
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(icon: Icons.notifications_none, title: 'No notifications yet');
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(notificationsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) => _NotificationCard(notification: list[index]),
            ),
          );
        },
      ),
    );
  }
}

class _NotificationCard extends ConsumerWidget {
  const _NotificationCard({required this.notification});

  final NotificationModel notification;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isUnread = notification.readAt == null;

    return Card(
      color: isUnread ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.08) : null,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(kCardRadius),
        side: BorderSide(color: isUnread ? Theme.of(context).colorScheme.primary : Theme.of(context).dividerColor),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(kCardRadius),
        onTap: () async {
          if (isUnread) ref.read(notificationsProvider.notifier).markRead(notification.id);
          final path = await ref.read(notificationDeepLinkResolverProvider).resolve(
                entity: notification.entity,
                entityId: notification.entityId,
              );
          if (path != '/notifications' && context.mounted) context.push(path);
        },
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(child: Text(notification.title, style: Theme.of(context).textTheme.titleSmall)),
                  Text(_formatDate(notification.createdAt), style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
              const SizedBox(height: 4),
              Text(notification.body, style: Theme.of(context).textTheme.bodyMedium),
              if (notification.entity == 'Trip' && notification.entityId != null) ...[
                const SizedBox(height: 8),
                Text('View Ride ↗', style: TextStyle(color: AppTheme.accentTextOf(context), fontWeight: FontWeight.w600)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  static String _formatDate(String iso) {
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return '';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}
