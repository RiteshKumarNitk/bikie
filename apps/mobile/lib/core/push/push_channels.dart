import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Android notification channels (ADR-035). Mirrors
/// `packages/services/src/modules/communications/domain/push-channel.ts`'s
/// `channelIdForNotificationType` — keep both in sync if either changes; they can't share code
/// across TS/Dart.
class PushChannels {
  PushChannels._();

  static const sos = AndroidNotificationChannel(
    'sos_channel',
    'Emergency SOS',
    description: 'Time-critical SOS alerts and session updates',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
  );

  static const ride = AndroidNotificationChannel(
    'ride_channel',
    'Ride Community',
    description: 'Ride requests, approvals, and announcements',
    importance: Importance.high,
  );

  static const chat = AndroidNotificationChannel(
    'chat_channel',
    'Messages',
    description: 'New chat messages',
    importance: Importance.high,
  );

  static const general = AndroidNotificationChannel(
    'general_channel',
    'General',
    description: 'Account and system notifications',
    importance: Importance.defaultImportance,
  );

  static const all = [sos, ride, chat, general];

  static String channelIdForType(String? type) {
    switch (type) {
      case 'SOS_ALERT':
        return sos.id;
      case 'NEW_MESSAGE':
        return chat.id;
      case 'RIDE_REQUEST_RECEIVED':
      case 'RIDE_REQUEST_APPROVED':
      case 'RIDE_REQUEST_REJECTED':
      case 'RIDE_ANNOUNCEMENT':
      case 'GROUP_JOIN_APPROVED':
      case 'TRIP_CANCELLED':
      case 'TRIP_RESCHEDULED':
        return ride.id;
      default:
        return general.id;
    }
  }

  static AndroidNotificationChannel forType(String? type) {
    final id = channelIdForType(type);
    return all.firstWhere((c) => c.id == id, orElse: () => general);
  }
}
