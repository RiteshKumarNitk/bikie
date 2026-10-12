import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart';
import 'package:mobile/features/onboarding/data/geocoding_repository.dart';
import 'package:mocktail/mocktail.dart';

class _MockDio extends Mock implements Dio {}

void main() {
  test('Nominatim client identifies BIKIE and carries no app credentials', () {
    final dio = buildNominatimDio();
    expect(dio.options.baseUrl, 'https://nominatim.openstreetmap.org');
    expect(dio.options.headers['User-Agent'], nominatimUserAgent);
    expect(nominatimUserAgent, startsWith('BIKIE'));
    expect(dio.options.headers.containsKey('Authorization'), isFalse);
    expect(dio.interceptors.whereType<QueuedInterceptor>(), isEmpty);
  });

  group('GeocodingRepository', () {
    late _MockDio dio;
    late GeocodingRepository repository;

    setUp(() {
      dio = _MockDio();
      repository = GeocodingRepository(dio);
    });

    Response<dynamic> ok(Object data) => Response(requestOptions: RequestOptions(path: '/'), statusCode: 200, data: data);

    test('reverse maps OSM address parts with fallbacks', () async {
      when(() => dio.get('/reverse', queryParameters: any(named: 'queryParameters'))).thenAnswer(
        (_) async => ok({
          'address': {'town': 'Mapusa', 'neighbourhood': 'Khorlim', 'postcode': 403507, 'road': 'NH66'},
        }),
      );

      final result = await repository.reverse(const LatLng(15.59, 73.81));

      expect(result?.city, 'Mapusa');
      expect(result?.area, 'Khorlim');
      expect(result?.pincode, '403507');
      expect(result?.road, 'NH66');
    });

    test('lookup failures return null instead of throwing (never blocks onboarding)', () async {
      when(() => dio.get(any(), queryParameters: any(named: 'queryParameters')))
          .thenThrow(DioException(requestOptions: RequestOptions(path: '/reverse')));

      expect(await repository.reverse(const LatLng(15.59, 73.81)), isNull);
      expect(await repository.searchCity('Panaji'), isNull);
    });

    test('searchCity is India-restricted and parses the first hit', () async {
      when(() => dio.get('/search', queryParameters: any(named: 'queryParameters'))).thenAnswer(
        (_) async => ok([
          {'lat': '15.4909', 'lon': '73.8278'},
        ]),
      );

      expect(await repository.searchCity('Panaji'), const LatLng(15.4909, 73.8278));
      final params =
          verify(() => dio.get('/search', queryParameters: captureAny(named: 'queryParameters'))).captured.single as Map;
      expect(params['countrycodes'], 'in');
      expect(await repository.searchCity('   '), isNull, reason: 'blank city makes no request');
    });
  });
}
