import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_guard.dart';
import '../network/dio_client.dart';
import 'push_bootstrap.dart';

final notificationDeepLinkResolverProvider = Provider<NotificationDeepLinkResolver>((ref) {
  return NotificationDeepLinkResolver(ref.watch(dioProvider));
});

/// The route a tapped notification resolved to — a top-level widget (`BikieApp`) watches this
/// and navigates once the router/auth state is ready, then clears it back to null.
final pendingDeepLinkRouteProvider = StateProvider<String?>((ref) => null);

/// Side-effect-only provider: watching it (once, from `BikieApp.build()`) subscribes to
/// `notificationTapController` for the lifetime of the app and resolves every tap into
/// `pendingDeepLinkRouteProvider`. Riverpod dedups by provider identity, so watching it on
/// every rebuild does not create duplicate subscriptions.
final pushTapListenerProvider = Provider<void>((ref) {
  final resolver = ref.watch(notificationDeepLinkResolverProvider);
  final subscription = notificationTapController.stream.listen((data) async {
    final path = await resolver.resolve(entity: data['entity'], entityId: data['entityId']);
    ref.read(pendingDeepLinkRouteProvider.notifier).state = path;
  });
  ref.onDispose(subscription.cancel);
});

/// Resolves a notification's `{entity, entityId}` into an in-app route. Mirrors the `entity`
/// string conventions every `NotificationService.notify()` call site in `packages/services`
/// already uses (see `.docs/API.md`'s Notifications section) — the same map the web's
/// `NotificationsTab.tsx` and this app's own `notifications_screen.dart` tap handlers use, so
/// a push tap and an in-app notification tap always land on the same screen. Falls back to the
/// Notifications feed (never Home) for anything not explicitly mapped.
class NotificationDeepLinkResolver {
  NotificationDeepLinkResolver(this._dio);

  final Dio _dio;

  Future<String> resolve({String? entity, String? entityId}) async {
    if (entity == null || entityId == null || entityId.isEmpty) return '/notifications';
    switch (entity) {
      case 'sos_alert':
        return '/sos/$entityId';
      case 'sos_session':
        final alertId = await _resolveSessionAlertId(entityId);
        return alertId != null ? '/sos/$alertId' : '/sos';
      case 'Trip':
        return '/trips/$entityId';
      case 'conversation':
        return '/messages/$entityId';
      default:
        return '/notifications';
    }
  }

  /// `sos_session` notifications (helper arrived/assistance started/etc.) carry the session id,
  /// but the only mobile route is keyed by alert id (`/sos/:id`) — resolve it via the session
  /// detail route rather than guessing.
  Future<String?> _resolveSessionAlertId(String sessionId) async {
    try {
      final res = await apiGuard(() => _dio.get('/api/sos/sessions/$sessionId'));
      final session = res.data['session'] as Map<String, dynamic>;
      return session['alertId'] as String?;
    } catch (_) {
      return null;
    }
  }
}
