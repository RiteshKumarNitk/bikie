import 'dart:async';
import 'dart:convert';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'push_channels.dart';

/// Fires whenever a notification is tapped — whether the OS auto-displayed it
/// (background/terminated, FCM's own tap intent) or we drew it ourselves (foreground, a local
/// notification). Payload is always the notify() call's `{type, entity, entityId}`. A plain
/// broadcast stream rather than a Riverpod provider, because the isolate that handles a
/// terminated-app launch has no `ProviderContainer` at all — `NotificationDeepLinkResolver`
/// (which does need Riverpod, for Dio) subscribes to this from the main isolate instead.
final StreamController<Map<String, String>> notificationTapController =
    StreamController<Map<String, String>>.broadcast();

final FlutterLocalNotificationsPlugin localNotificationsPlugin = FlutterLocalNotificationsPlugin();

Map<String, String> _stringData(Map<String, dynamic> data) =>
    data.map((key, value) => MapEntry(key, value?.toString() ?? ''));

/// Must be a top-level (or static) function — firebase_messaging spawns a fresh background
/// isolate to run this for a backgrounded/terminated app, which shares no state with the main
/// isolate. Android already auto-displays `message.notification` from the system tray in this
/// case, so there is nothing to draw here; this only exists so plugin calls in this isolate
/// (e.g. a token read) have an initialized Firebase app to call into.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

/// Call once, before `runApp` — sets up everything that doesn't need a BuildContext or a
/// Riverpod `Ref`: Firebase itself, the background handler, the local-notification channels,
/// and the three listeners that turn an incoming/tapped push into a `notificationTapController`
/// event (foreground display, background-tap, and terminated-launch respectively).
Future<void> bootstrapPushNotifications() async {
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  await localNotificationsPlugin.initialize(
    const InitializationSettings(android: AndroidInitializationSettings('@mipmap/launcher_icon')),
    onDidReceiveNotificationResponse: (response) {
      final payload = response.payload;
      if (payload == null || payload.isEmpty) return;
      final decoded = jsonDecode(payload) as Map;
      notificationTapController.add(decoded.map((k, v) => MapEntry(k.toString(), v?.toString() ?? '')));
    },
  );

  final androidPlugin = localNotificationsPlugin
      .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
  if (androidPlugin != null) {
    for (final channel in PushChannels.all) {
      await androidPlugin.createNotificationChannel(channel);
    }
  }

  // Foreground: FCM does NOT auto-display a system-tray notification while the app is open —
  // draw it ourselves via flutter_local_notifications, in the channel matching its type.
  FirebaseMessaging.onMessage.listen((message) async {
    final notification = message.notification;
    if (notification == null) return;
    final channel = PushChannels.forType(message.data['type'] as String?);
    await localNotificationsPlugin.show(
      message.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          channel.id,
          channel.name,
          channelDescription: channel.description,
          importance: Importance.max,
          priority: Priority.high,
        ),
      ),
      payload: jsonEncode(_stringData(message.data)),
    );
  });

  // Backgrounded app, tapped: the OS already drew the notification; this only fires on tap.
  FirebaseMessaging.onMessageOpenedApp.listen((message) {
    notificationTapController.add(_stringData(message.data));
  });

  // Terminated app, launched by tapping a notification: check once at startup.
  final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
  if (initialMessage != null) {
    notificationTapController.add(_stringData(initialMessage.data));
  }
}
