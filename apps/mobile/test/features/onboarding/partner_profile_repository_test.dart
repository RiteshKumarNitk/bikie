import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/onboarding/data/partner_profile_model.dart';
import 'package:mobile/features/onboarding/data/partner_profile_repository.dart';
import 'package:mocktail/mocktail.dart';

class _MockDio extends Mock implements Dio {}

void main() {
  setUpAll(() {
    registerFallbackValue(RequestOptions(path: '/api/partner/profile'));
  });

  late _MockDio dio;
  late PartnerProfileRepository repository;

  setUp(() {
    dio = _MockDio();
    repository = PartnerProfileRepository(dio);
    when(() => dio.put(any(), data: any(named: 'data'))).thenAnswer(
      (_) async => Response(requestOptions: RequestOptions(path: '/api/partner/profile'), statusCode: 200, data: {}),
    );
  });

  test('save() always sends the three required fields', () async {
    await repository.save(const PartnerProfileInput(businessName: 'Goa Moto Rentals', type: 'RENTAL', city: 'Goa'));

    final captured =
        verify(() => dio.put('/api/partner/profile', data: captureAny(named: 'data'))).captured.single as Map<String, dynamic>;

    expect(captured['businessName'], 'Goa Moto Rentals');
    expect(captured['type'], 'RENTAL');
    expect(captured['city'], 'Goa');
  });

  test('save() omits blank/null optional fields entirely', () async {
    await repository.save(const PartnerProfileInput(
      businessName: 'Goa Moto Rentals',
      type: 'RENTAL',
      city: 'Goa',
      addressLine: '',
      governmentIdNumber: null,
      contactPerson2Name: null,
    ));

    final captured =
        verify(() => dio.put('/api/partner/profile', data: captureAny(named: 'data'))).captured.single as Map<String, dynamic>;

    expect(captured.containsKey('addressLine'), isFalse);
    expect(captured.containsKey('governmentIdNumber'), isFalse);
    expect(captured.containsKey('contactPerson2Name'), isFalse);
  });

  test('save() includes optional fields when provided', () async {
    await repository.save(const PartnerProfileInput(
      businessName: 'Goa Moto Rentals',
      type: 'RENTAL',
      city: 'Goa',
      contactPerson1Name: 'Rahul Sharma',
      contactPerson1Mobile: '9876543210',
    ));

    final captured =
        verify(() => dio.put('/api/partner/profile', data: captureAny(named: 'data'))).captured.single as Map<String, dynamic>;

    expect(captured['contactPerson1Name'], 'Rahul Sharma');
    expect(captured['contactPerson1Mobile'], '9876543210');
  });

  test('save() includes shop address, map pin, and government ID when provided (ADR-036)', () async {
    await repository.save(const PartnerProfileInput(
      businessName: 'Goa Moto Rentals',
      type: 'RENTAL',
      city: 'Goa',
      addressLine: 'Anjuna Beach Road',
      area: 'Anjuna',
      pincode: '403509',
      latitude: 15.5937,
      longitude: 73.7392,
      governmentIdType: 'AADHAAR',
      governmentIdNumber: '123456789012',
    ));

    final captured =
        verify(() => dio.put('/api/partner/profile', data: captureAny(named: 'data'))).captured.single as Map<String, dynamic>;

    expect(captured['addressLine'], 'Anjuna Beach Road');
    expect(captured['area'], 'Anjuna');
    expect(captured['pincode'], '403509');
    expect(captured['latitude'], 15.5937);
    expect(captured['longitude'], 73.7392);
    expect(captured['governmentIdType'], 'AADHAAR');
    expect(captured['governmentIdNumber'], '123456789012');
  });
}
