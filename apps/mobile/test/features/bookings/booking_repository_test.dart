import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/features/bookings/data/booking_model.dart';
import 'package:mobile/features/bookings/data/booking_repository.dart';
import 'package:mocktail/mocktail.dart';

class _MockDio extends Mock implements Dio {}

void main() {
  setUpAll(() {
    // Fallback values for mocktail's `any()` matcher on non-primitive
    // positional/named args used below.
    registerFallbackValue(RequestOptions(path: '/api/bookings'));
  });

  late _MockDio dio;
  late BookingRepository repository;

  setUp(() {
    dio = _MockDio();
    repository = BookingRepository(dio);
  });

  Map<String, dynamic> buildBookingJson({String status = 'PENDING'}) => {
        'id': 'booking-1',
        'status': status,
        'startDate': '2026-08-01T00:00:00.000Z',
        'endDate': '2026-08-04T00:00:00.000Z',
        'totalPrice': 1500,
        'pickupCity': 'Bengaluru',
        'createdAt': '2026-07-14T00:00:00.000Z',
        'bike': {
          'slug': 'royal-enfield-classic',
          'name': 'Classic 350',
          'imageUrl': 'https://example.com/bike.jpg',
          'brand': 'Royal Enfield',
        },
        'hasReview': false,
      };

  group('BookingRepository.create', () {
    test('posts to /api/bookings with ISO-8601 UTC dates and parses the booking envelope', () async {
      final start = DateTime.utc(2026, 8, 1);
      final end = DateTime.utc(2026, 8, 4);

      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/bookings'),
          statusCode: 200,
          data: {'booking': buildBookingJson()},
        ),
      );

      final booking = await repository.create(
        bikeId: 'bike-1',
        startDate: start,
        endDate: end,
        pickupCity: 'Bengaluru',
      );

      expect(booking, isA<BookingModel>());
      expect(booking.id, 'booking-1');
      expect(booking.status, 'PENDING');
      expect(booking.pickupCity, 'Bengaluru');

      final captured = verify(() => dio.post('/api/bookings', data: captureAny(named: 'data'))).captured.single
          as Map<String, dynamic>;
      expect(captured['bikeId'], 'bike-1');
      expect(captured['pickupCity'], 'Bengaluru');
      expect(captured['startDate'], start.toIso8601String());
      expect(captured['endDate'], end.toIso8601String());
    });

    test('wraps a Dio error response into a typed ApiException', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/api/bookings'),
          response: Response(
            requestOptions: RequestOptions(path: '/api/bookings'),
            statusCode: 400,
            data: {
              'error': {
                'fieldErrors': {
                  'pickupCity': ['Pickup city is required']
                },
                'formErrors': [],
              },
            },
          ),
          type: DioExceptionType.badResponse,
        ),
      );

      expect(
        () => repository.create(
          bikeId: 'bike-1',
          startDate: DateTime.utc(2026, 8, 1),
          endDate: DateTime.utc(2026, 8, 4),
          pickupCity: '',
        ),
        throwsA(
          isA<ApiException>()
              .having((e) => e.statusCode, 'statusCode', 400)
              .having((e) => e.isValidation, 'isValidation', true)
              .having((e) => e.message, 'message', contains('Pickup city is required')),
        ),
      );
    });

    test('wraps a connection failure (no response) into a network ApiException', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/api/bookings'),
          type: DioExceptionType.connectionError,
          message: 'Connection failed',
        ),
      );

      expect(
        () => repository.create(
          bikeId: 'bike-1',
          startDate: DateTime.utc(2026, 8, 1),
          endDate: DateTime.utc(2026, 8, 4),
          pickupCity: 'Bengaluru',
        ),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'statusCode', 0)),
      );
    });
  });

  group('BookingRepository.getMine', () {
    test('gets /api/bookings and parses the bookings list envelope', () async {
      when(() => dio.get(any(), queryParameters: any(named: 'queryParameters'))).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/bookings'),
          statusCode: 200,
          data: {
            'bookings': [buildBookingJson(status: 'CONFIRMED'), buildBookingJson(status: 'PENDING')],
          },
        ),
      );

      final bookings = await repository.getMine();

      expect(bookings, hasLength(2));
      expect(bookings.first.status, 'CONFIRMED');
      verify(() => dio.get('/api/bookings', queryParameters: null)).called(1);
    });

    test('forwards a status filter as a query parameter', () async {
      when(() => dio.get(any(), queryParameters: any(named: 'queryParameters'))).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/bookings'),
          statusCode: 200,
          data: {
            'bookings': [buildBookingJson(status: 'CONFIRMED')],
          },
        ),
      );

      await repository.getMine(status: 'CONFIRMED');

      verify(() => dio.get('/api/bookings', queryParameters: {'status': 'CONFIRMED'})).called(1);
    });
  });
}
