import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/notification_models.dart';
import '../data/notification_repository.dart';

/// Polls every 45s, matching the web's `NotificationsTab.tsx` `POLL_INTERVAL_MS`.
final notificationsProvider =
    AsyncNotifierProvider.autoDispose<NotificationsNotifier, List<NotificationModel>>(NotificationsNotifier.new);

class NotificationsNotifier extends AutoDisposeAsyncNotifier<List<NotificationModel>> {
  Timer? _timer;

  @override
  Future<List<NotificationModel>> build() async {
    ref.onDispose(() => _timer?.cancel());
    _timer = Timer.periodic(const Duration(seconds: 45), (_) => _poll());
    return ref.watch(notificationRepositoryProvider).getAll();
  }

  Future<void> _poll() async {
    try {
      state = AsyncData(await ref.read(notificationRepositoryProvider).getAll());
    } catch (_) {
      // Silently ignore transient polling failures; next tick retries.
    }
  }

  Future<void> markRead(String id) async {
    final current = state.valueOrNull;
    if (current != null) {
      state = AsyncData([
        for (final n in current)
          if (n.id == id && n.readAt == null) n.copyWith(readAt: DateTime.now().toUtc().toIso8601String()) else n,
      ]);
    }
    await ref.read(notificationRepositoryProvider).markRead(id);
  }

  Future<void> markAllRead() async {
    final current = state.valueOrNull;
    if (current != null) {
      final now = DateTime.now().toUtc().toIso8601String();
      state = AsyncData([for (final n in current) n.readAt == null ? n.copyWith(readAt: now) : n]);
    }
    await ref.read(notificationRepositoryProvider).markAllRead();
  }
}

/// Unread count for a small badge (e.g. on the Profile "Notifications" tile).
final unreadNotificationCountProvider = Provider.autoDispose<int>((ref) {
  final notifications = ref.watch(notificationsProvider).valueOrNull ?? const [];
  return notifications.where((n) => n.readAt == null).length;
});
