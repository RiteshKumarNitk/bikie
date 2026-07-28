import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/notifications/data/notification_models.dart';
import 'package:mobile/features/notifications/data/notification_repository.dart';
import 'package:mocktail/mocktail.dart';

class _MockDio extends Mock implements Dio {}

void main() {
  setUpAll(() {
    registerFallbackValue(RequestOptions(path: '/api/notifications'));
  });

  late _MockDio dio;
  late NotificationRepository repository;

  setUp(() {
    dio = _MockDio();
    repository = NotificationRepository(dio);
  });

  Response<T> okResponse<T>(String path, T data) =>
      Response<T>(requestOptions: RequestOptions(path: path), statusCode: 200, data: data);

  group('NotificationRepository.getAll', () {
    test('parses the notifications envelope', () async {
      when(() => dio.get(any())).thenAnswer(
        (_) async => okResponse('/api/notifications', {
          'notifications': [
            {
              'id': 'n1',
              'type': 'RIDE_REQUEST_APPROVED',
              'title': "You're in!",
              'body': 'Your request to join Himalayan Run was approved.',
              'entity': 'Trip',
              'entityId': 'trip-1',
              'readAt': null,
              'createdAt': '2026-07-20T00:00:00.000Z',
            },
          ],
        }),
      );

      final notifications = await repository.getAll();

      expect(notifications, hasLength(1));
      expect(notifications.single, isA<NotificationModel>());
      expect(notifications.single.type, 'RIDE_REQUEST_APPROVED');
      expect(notifications.single.readAt, isNull);
    });
  });

  group('NotificationRepository mark-read', () {
    test('markRead posts the notification id', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => okResponse('/api/notifications', {'ok': true}),
      );

      await repository.markRead('n1');

      verify(() => dio.post('/api/notifications', data: {'id': 'n1'})).called(1);
    });

    test('markAllRead posts the MARK_ALL_READ action', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => okResponse('/api/notifications', {'ok': true}),
      );

      await repository.markAllRead();

      verify(() => dio.post('/api/notifications', data: {'action': 'MARK_ALL_READ'})).called(1);
    });
  });
}
