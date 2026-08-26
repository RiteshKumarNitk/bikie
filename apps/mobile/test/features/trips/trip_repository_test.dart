import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/features/trips/data/trip_models.dart';
import 'package:mobile/features/trips/data/trip_repository.dart';
import 'package:mocktail/mocktail.dart';

class _MockDio extends Mock implements Dio {}

void main() {
  setUpAll(() {
    registerFallbackValue(RequestOptions(path: '/api/trips'));
  });

  late _MockDio dio;
  late TripRepository repository;

  setUp(() {
    dio = _MockDio();
    repository = TripRepository(dio);
  });

  Response<T> okResponse<T>(String path, T data) =>
      Response<T>(requestOptions: RequestOptions(path: path), statusCode: 200, data: data);

  Map<String, dynamic> buildTripSummaryJson({String slug = 'himalayan-run'}) => {
        'id': 'trip-1',
        'slug': slug,
        'title': 'Himalayan Run',
        'imageUrl': 'https://example.com/ride.jpg',
        'type': 'ADVENTURE',
        'difficulty': 'HARD',
        'price': 0,
        'seatsTotal': 10,
        'seatsLeft': 4,
        'startDate': '2026-09-01T00:00:00.000Z',
        'endDate': '2026-09-05T00:00:00.000Z',
        'status': 'UPCOMING',
        'destination': null,
      };

  group('TripRepository.create', () {
    test('posts to /api/trips with UTC dates and parses the trip envelope', () async {
      final start = DateTime.utc(2026, 9, 1);
      final end = DateTime.utc(2026, 9, 5);

      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => okResponse('/api/trips', {'trip': buildTripSummaryJson()}),
      );

      final trip = await repository.create(
        title: 'Himalayan Run',
        description: 'A great ride',
        type: 'ADVENTURE',
        seatsTotal: 10,
        startDate: start,
        endDate: end,
      );

      expect(trip, isA<TripSummary>());
      expect(trip.slug, 'himalayan-run');

      final captured =
          verify(() => dio.post('/api/trips', data: captureAny(named: 'data'))).captured.single as Map<String, dynamic>;
      expect(captured['title'], 'Himalayan Run');
      expect(captured['difficulty'], 'MODERATE');
      expect(captured['price'], 0);
      expect(captured['seatsTotal'], 10);
      expect(captured['startDate'], start.toIso8601String());
      expect(captured.containsKey('meetingPoint'), isFalse);
      expect(captured.containsKey('destinationId'), isFalse);
      expect(captured.containsKey('gallery'), isFalse);
    });

    test('includes gallery URLs when provided, omits the key when empty', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => okResponse('/api/trips', {'trip': buildTripSummaryJson()}),
      );

      await repository.create(
        title: 'Himalayan Run',
        description: 'A great ride',
        type: 'ADVENTURE',
        seatsTotal: 10,
        startDate: DateTime.utc(2026, 9, 1),
        endDate: DateTime.utc(2026, 9, 5),
        gallery: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
      );

      final captured =
          verify(() => dio.post('/api/trips', data: captureAny(named: 'data'))).captured.single as Map<String, dynamic>;
      expect(captured['gallery'], ['https://example.com/1.jpg', 'https://example.com/2.jpg']);
    });

    test('surfaces a 403 MEMBERSHIP_REQUIRED error as a typed ApiException', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/api/trips'),
          response: Response(
            requestOptions: RequestOptions(path: '/api/trips'),
            statusCode: 403,
            data: {'error': 'MEMBERSHIP_REQUIRED', 'message': 'Ride creation is a BIKIE Membership perk.'},
          ),
          type: DioExceptionType.badResponse,
        ),
      );

      expect(
        () => repository.create(
          title: 'Himalayan Run',
          description: 'A great ride',
          type: 'ADVENTURE',
          seatsTotal: 10,
          startDate: DateTime.utc(2026, 9, 1),
          endDate: DateTime.utc(2026, 9, 5),
        ),
        throwsA(isA<ApiException>().having((e) => e.isMembershipRequired, 'isMembershipRequired', true)),
      );
    });
  });

  group('TripRepository.getMine', () {
    test('parses organized/joined/requested and stats', () async {
      when(() => dio.get(any())).thenAnswer(
        (_) async => okResponse('/api/trips/mine', {
          'organized': [buildTripSummaryJson()],
          'joined': <Map<String, dynamic>>[],
          'requested': <Map<String, dynamic>>[],
          'stats': {
            'ridesOrganized': 1,
            'requestsSent': 2,
            'requestsApproved': 1,
            'ridesCancelled': 0,
            'approvalRate': 50,
          },
        }),
      );

      final mine = await repository.getMine();

      expect(mine.organized, hasLength(1));
      expect(mine.joined, isEmpty);
      expect(mine.stats.approvalRate, 50);
    });
  });

  group('TripRepository request lifecycle', () {
    test('requestToJoin omits the message field when blank', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => okResponse('/api/trips/himalayan-run/requests', {'success': true}),
      );

      await repository.requestToJoin('himalayan-run', message: '  ');

      final captured =
          verify(() => dio.post('/api/trips/himalayan-run/requests', data: captureAny(named: 'data'))).captured.single
              as Map<String, dynamic>;
      expect(captured.containsKey('message'), isFalse);
    });

    test('getMyRequestStatus returns null when the caller never requested', () async {
      when(() => dio.get(any())).thenAnswer(
        (_) async => okResponse('/api/trips/himalayan-run/requests/mine', {'request': null}),
      );

      final status = await repository.getMyRequestStatus('himalayan-run');

      expect(status, isNull);
    });

    test('getMyRequestStatus parses a PENDING status', () async {
      when(() => dio.get(any())).thenAnswer(
        (_) async => okResponse(
          '/api/trips/himalayan-run/requests/mine',
          {
            'request': {'status': 'PENDING', 'message': 'Bringing my own bike'},
          },
        ),
      );

      final status = await repository.getMyRequestStatus('himalayan-run');

      expect(status?.status, 'PENDING');
      expect(status?.message, 'Bringing my own bike');
    });

    test('approveRequest posts to the approve endpoint with no body', () async {
      when(() => dio.post(any())).thenAnswer(
        (_) async => okResponse('/api/trips/himalayan-run/requests/p1/approve', {'success': true}),
      );

      await repository.approveRequest('himalayan-run', 'p1');

      verify(() => dio.post('/api/trips/himalayan-run/requests/p1/approve')).called(1);
    });

    test('rejectRequest surfaces a 409 NO_SEATS error as a typed ApiException', () async {
      when(() => dio.post(any())).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/api/trips/himalayan-run/requests/p1/approve'),
          response: Response(
            requestOptions: RequestOptions(path: '/api/trips/himalayan-run/requests/p1/approve'),
            statusCode: 409,
            data: {'error': 'NO_SEATS'},
          ),
          type: DioExceptionType.badResponse,
        ),
      );

      expect(
        () => repository.approveRequest('himalayan-run', 'p1'),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'statusCode', 409)),
      );
    });
  });

  group('TripRepository.cancelTrip', () {
    test('posts to the cancel endpoint with an empty body when no reason is given', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => okResponse('/api/trips/himalayan-run/cancel', {'success': true}),
      );

      await repository.cancelTrip('himalayan-run');

      final captured =
          verify(() => dio.post('/api/trips/himalayan-run/cancel', data: captureAny(named: 'data'))).captured.single
              as Map<String, dynamic>;
      expect(captured.containsKey('reason'), isFalse);
    });

    test('includes the reason when provided', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => okResponse('/api/trips/himalayan-run/cancel', {'success': true}),
      );

      await repository.cancelTrip('himalayan-run', reason: 'Weather');

      final captured =
          verify(() => dio.post('/api/trips/himalayan-run/cancel', data: captureAny(named: 'data'))).captured.single
              as Map<String, dynamic>;
      expect(captured['reason'], 'Weather');
    });

    test('surfaces a 409 NOT_UPCOMING error as a typed ApiException', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/api/trips/himalayan-run/cancel'),
          response: Response(
            requestOptions: RequestOptions(path: '/api/trips/himalayan-run/cancel'),
            statusCode: 409,
            data: {'error': 'NOT_UPCOMING'},
          ),
          type: DioExceptionType.badResponse,
        ),
      );

      expect(
        () => repository.cancelTrip('himalayan-run'),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'statusCode', 409)),
      );
    });
  });

  group('TripRepository.getGroupConversationId', () {
    test('returns the conversation id once the ride has one', () async {
      when(() => dio.get(any())).thenAnswer(
        (_) async => okResponse('/api/trips/himalayan-run/group', {'conversationId': 'conv-1'}),
      );

      final id = await repository.getGroupConversationId('himalayan-run');

      expect(id, 'conv-1');
    });

    test('returns null (not an error) when no one has been approved yet (404 NOT_STARTED)', () async {
      when(() => dio.get(any())).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/api/trips/himalayan-run/group'),
          response: Response(
            requestOptions: RequestOptions(path: '/api/trips/himalayan-run/group'),
            statusCode: 404,
            data: {'error': 'NOT_STARTED'},
          ),
          type: DioExceptionType.badResponse,
        ),
      );

      final id = await repository.getGroupConversationId('himalayan-run');

      expect(id, isNull);
    });

    test('rethrows a non-404 error as a typed ApiException', () async {
      when(() => dio.get(any())).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/api/trips/himalayan-run/group'),
          response: Response(
            requestOptions: RequestOptions(path: '/api/trips/himalayan-run/group'),
            statusCode: 403,
            data: {'error': 'FORBIDDEN'},
          ),
          type: DioExceptionType.badResponse,
        ),
      );

      expect(
        () => repository.getGroupConversationId('himalayan-run'),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'statusCode', 403)),
      );
    });
  });
}
