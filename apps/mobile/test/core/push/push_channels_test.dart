import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/push/push_bootstrap.dart';
import 'package:mobile/core/push/push_channels.dart';

void main() {
  group('PushChannels', () {
    test('sos_channel is max importance with sound and vibration enabled', () {
      expect(PushChannels.sos.id, 'sos_channel');
      expect(PushChannels.sos.importance, Importance.max);
      expect(PushChannels.sos.playSound, isTrue);
      expect(PushChannels.sos.enableVibration, isTrue);
    });

    test('channelIdForType routes SOS_ALERT to the sos channel', () {
      expect(PushChannels.channelIdForType('SOS_ALERT'), PushChannels.sos.id);
    });

    test('channelIdForType falls back to general for unknown/system types', () {
      expect(PushChannels.channelIdForType('SYSTEM'), PushChannels.general.id);
      expect(PushChannels.channelIdForType(null), PushChannels.general.id);
    });

    test('forType resolves the sos channel for SOS_ALERT', () {
      expect(PushChannels.forType('SOS_ALERT').id, 'sos_channel');
    });
  });

  group('buildAndroidNotificationDetails', () {
    test('SOS gets emergency-grade presentation: max importance, red tint, public visibility, alarm category', () {
      final details = buildAndroidNotificationDetails(PushChannels.sos);

      expect(details.channelId, 'sos_channel');
      expect(details.importance, Importance.max);
      expect(details.priority, Priority.high);
      expect(details.color, isNotNull);
      expect(details.visibility, NotificationVisibility.public);
      expect(details.category, AndroidNotificationCategory.alarm);
    });

    test('non-SOS channels are not given the emergency visual treatment', () {
      for (final channel in [PushChannels.ride, PushChannels.chat, PushChannels.general]) {
        final details = buildAndroidNotificationDetails(channel);
        expect(details.channelId, channel.id);
        expect(details.color, isNull);
        expect(details.visibility, isNull);
        expect(details.category, isNull);
      }
    });
  });
}
