import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'notification_models.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(ref.watch(dioProvider));
});

/// `GET/POST /api/notifications` — found undocumented in `.docs/API.md`
/// during this milestone (the route exists and works; the doc simply never
/// listed it after Milestone 8.1 added the `Notification` model). Backs the
/// in-app feed the web renders via `components/chat/NotificationsTab.tsx`.
class NotificationRepository {
  NotificationRepository(this._dio);

  final Dio _dio;

  Future<List<NotificationModel>> getAll() {
    return apiGuard(() async {
      final res = await _dio.get('/api/notifications');
      return (res.data['notifications'] as List)
          .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  Future<void> markRead(String id) {
    return apiGuard(() async {
      await _dio.post('/api/notifications', data: {'id': id});
    });
  }

  Future<void> markAllRead() {
    return apiGuard(() async {
      await _dio.post('/api/notifications', data: {'action': 'MARK_ALL_READ'});
    });
  }
}
