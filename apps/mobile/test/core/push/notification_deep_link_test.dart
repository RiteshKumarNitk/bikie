import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/push/notification_deep_link.dart';
import 'package:mocktail/mocktail.dart';

class _MockDio extends Mock implements Dio {}

void main() {
  setUpAll(() {
    registerFallbackValue(RequestOptions(path: '/api/sos/sessions/s1'));
  });

  late _MockDio dio;
  late NotificationDeepLinkResolver resolver;

  setUp(() {
    dio = _MockDio();
    resolver = NotificationDeepLinkResolver(dio);
  });

  group('NotificationDeepLinkResolver.resolve', () {
    test('an SOS alert notification resolves straight to the SOS detail screen', () async {
      final path = await resolver.resolve(entity: 'sos_alert', entityId: 'alert-1');
      expect(path, '/sos/alert-1');
    });

    test('an SOS session notification resolves via the session\'s alert id', () async {
      when(() => dio.get('/api/sos/sessions/session-1')).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/sos/sessions/session-1'),
          statusCode: 200,
          data: {
            'session': {'alertId': 'alert-9'},
          },
        ),
      );

      final path = await resolver.resolve(entity: 'sos_session', entityId: 'session-1');
      expect(path, '/sos/alert-9');
    });

    test('an SOS session notification falls back to the SOS list if the lookup fails', () async {
      when(() => dio.get(any())).thenThrow(DioException(requestOptions: RequestOptions(path: '/x')));

      final path = await resolver.resolve(entity: 'sos_session', entityId: 'session-1');
      expect(path, '/sos');
    });

    test('a trip notification resolves to the trip detail screen', () async {
      final path = await resolver.resolve(entity: 'Trip', entityId: 'trip-1');
      expect(path, '/trips/trip-1');
    });

    test('a conversation notification resolves to the message thread', () async {
      final path = await resolver.resolve(entity: 'conversation', entityId: 'convo-1');
      expect(path, '/messages/convo-1');
    });

    test('an unrecognized or missing entity falls back to the notifications feed', () async {
      expect(await resolver.resolve(entity: null, entityId: null), '/notifications');
      expect(await resolver.resolve(entity: 'something_else', entityId: 'x'), '/notifications');
    });
  });
}
