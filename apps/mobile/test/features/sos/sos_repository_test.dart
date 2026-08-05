import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/features/sos/data/sos_model.dart';
import 'package:mobile/features/sos/data/sos_repository.dart';
import 'package:mocktail/mocktail.dart';

class _MockDio extends Mock implements Dio {}

void main() {
  setUpAll(() {
    registerFallbackValue(RequestOptions(path: '/api/sos/alerts'));
  });

  late _MockDio dio;
  late SosRepository repository;

  setUp(() {
    dio = _MockDio();
    repository = SosRepository(dio);
  });

  Map<String, dynamic> buildAlertJson({String status = 'ACTIVE'}) => {
        'id': 'alert-1',
        'userId': 'user-1',
        'userName': 'Rider One',
        'userPhone': '+919999999999',
        'userEmail': 'rider@bikie.app',
        'type': 'BREAKDOWN',
        'description': 'Bike stalled on the highway',
        'latitude': 12.9716,
        'longitude': 77.5946,
        'city': 'Bengaluru',
        'status': status,
        'severity': 'ASSISTANCE',
        'escalationTier': 'NEARBY_RIDERS_GENERAL',
        'currentRadiusMeters': 5000,
        'assignedHelperId': null,
        'resolvedAt': null,
        'createdAt': '2026-07-14T00:00:00.000Z',
      };

  Map<String, dynamic> buildHistoryJson({String status = 'RESOLVED'}) => {
        'id': 'alert-1',
        'type': 'BREAKDOWN',
        'description': 'Bike stalled on the highway',
        'city': 'Bengaluru',
        'status': status,
        'severity': 'ASSISTANCE',
        'escalationTier': 'NEARBY_RIDERS_GENERAL',
        'assignedHelperId': null,
        'resolvedAt': null,
        'createdAt': '2026-07-14T00:00:00.000Z',
        'responses': [],
      };

  group('SosRepository.create', () {
    test('posts to /api/sos/alerts with the alert payload and parses the response envelope', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/sos/alerts'),
          statusCode: 200,
          data: {'alert': buildAlertJson()},
        ),
      );

      final alert = await repository.create(
        type: 'BREAKDOWN',
        description: 'Bike stalled on the highway',
        latitude: 12.9716,
        longitude: 77.5946,
        city: 'Bengaluru',
      );

      expect(alert, isA<SOSAlert>());
      expect(alert.id, 'alert-1');
      expect(alert.status, 'ACTIVE');
      expect(alert.city, 'Bengaluru');

      final captured = verify(() => dio.post('/api/sos/alerts', data: captureAny(named: 'data'))).captured.single
          as Map<String, dynamic>;
      expect(captured['type'], 'BREAKDOWN');
      expect(captured['description'], 'Bike stalled on the highway');
      expect(captured['latitude'], 12.9716);
      expect(captured['longitude'], 77.5946);
      expect(captured['city'], 'Bengaluru');
    });

    test('omits the description field entirely when null', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/sos/alerts'),
          statusCode: 200,
          data: {'alert': buildAlertJson()},
        ),
      );

      await repository.create(type: 'ACCIDENT', latitude: 1, longitude: 2, city: 'Mysuru');

      final captured = verify(() => dio.post('/api/sos/alerts', data: captureAny(named: 'data'))).captured.single
          as Map<String, dynamic>;
      expect(captured.containsKey('description'), isFalse);
    });

    test('omits the description field when it is an empty string', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/sos/alerts'),
          statusCode: 200,
          data: {'alert': buildAlertJson()},
        ),
      );

      await repository.create(type: 'ACCIDENT', description: '', latitude: 1, longitude: 2, city: 'Mysuru');

      final captured = verify(() => dio.post('/api/sos/alerts', data: captureAny(named: 'data'))).captured.single
          as Map<String, dynamic>;
      expect(captured.containsKey('description'), isFalse);
    });

    test('surfaces a 403 MEMBERSHIP_REQUIRED error as a typed ApiException', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/api/sos/alerts'),
          response: Response(
            requestOptions: RequestOptions(path: '/api/sos/alerts'),
            statusCode: 403,
            data: {
              'error': 'MEMBERSHIP_REQUIRED',
              'message': 'SOS Emergency is a BIKIE Membership perk. Upgrade to continue.',
            },
          ),
          type: DioExceptionType.badResponse,
        ),
      );

      expect(
        () => repository.create(type: 'BREAKDOWN', latitude: 1, longitude: 2, city: 'Mysuru'),
        throwsA(
          isA<ApiException>()
              .having((e) => e.statusCode, 'statusCode', 403)
              .having((e) => e.isForbidden, 'isForbidden', true)
              .having((e) => e.isMembershipRequired, 'isMembershipRequired', true)
              .having((e) => e.message, 'message', contains('BIKIE Membership')),
        ),
      );
    });

    test('wraps a connection failure (no response) into a network ApiException', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/api/sos/alerts'),
          type: DioExceptionType.connectionTimeout,
          message: 'Connection timed out',
        ),
      );

      expect(
        () => repository.create(type: 'BREAKDOWN', latitude: 1, longitude: 2, city: 'Mysuru'),
        throwsA(
          isA<ApiException>()
              .having((e) => e.statusCode, 'statusCode', 0)
              .having((e) => e.message, 'message', contains('Connection timed out')),
        ),
      );
    });
  });

  group('SosRepository.getActive / getHistory', () {
    test('getActive() gets /api/sos/alerts and parses the alerts list', () async {
      when(() => dio.get(any())).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/sos/alerts'),
          statusCode: 200,
          data: {
            'alerts': [buildAlertJson(), buildAlertJson(status: 'RESPONDED')],
          },
        ),
      );

      final alerts = await repository.getActive();

      expect(alerts, hasLength(2));
      verify(() => dio.get('/api/sos/alerts')).called(1);
    });

    test('getHistory() gets /api/sos/alerts/history and parses the alerts list', () async {
      when(() => dio.get(any())).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/sos/alerts/history'),
          statusCode: 200,
          data: {
            'alerts': [buildHistoryJson(status: 'RESOLVED')],
          },
        ),
      );

      final alerts = await repository.getHistory();

      expect(alerts, hasLength(1));
      expect(alerts.single.status, 'RESOLVED');
      verify(() => dio.get('/api/sos/alerts/history')).called(1);
    });
  });
}
