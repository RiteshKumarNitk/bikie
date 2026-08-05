import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/onboarding/data/rider_profile_model.dart';
import 'package:mobile/features/onboarding/data/rider_profile_repository.dart';
import 'package:mocktail/mocktail.dart';

class _MockDio extends Mock implements Dio {}

void main() {
  setUpAll(() {
    registerFallbackValue(RequestOptions(path: '/api/rider-profile'));
  });

  late _MockDio dio;
  late RiderProfileRepository repository;

  setUp(() {
    dio = _MockDio();
    repository = RiderProfileRepository(dio);
    when(() => dio.put(any(), data: any(named: 'data'))).thenAnswer(
      (_) async => Response(requestOptions: RequestOptions(path: '/api/rider-profile'), statusCode: 200, data: {}),
    );
  });

  test('save() omits blank/null fields entirely rather than sending them as null', () async {
    await repository.save(const RiderProfileInput(
      drivingLicenceNumber: 'KA0120230012345',
      addressLine: '',
      gender: null,
      bloodGroup: 'O+',
    ));

    final captured =
        verify(() => dio.put('/api/rider-profile', data: captureAny(named: 'data'))).captured.single as Map<String, dynamic>;

    expect(captured['drivingLicenceNumber'], 'KA0120230012345');
    expect(captured['bloodGroup'], 'O+');
    expect(captured.containsKey('addressLine'), isFalse);
    expect(captured.containsKey('gender'), isFalse);
  });

  test('save() omits the three bare enum fields when null (they reject a literal null server-side)', () async {
    await repository.save(const RiderProfileInput());

    final captured =
        verify(() => dio.put('/api/rider-profile', data: captureAny(named: 'data'))).captured.single as Map<String, dynamic>;

    expect(captured.containsKey('governmentIdType'), isFalse);
    expect(captured.containsKey('riderFrequency'), isFalse);
    expect(captured.containsKey('ridingClubType'), isFalse);
  });

  test('save() filters out emergency contacts missing a name or phone, and trims the rest', () async {
    await repository.save(const RiderProfileInput(
      emergencyContacts: [
        EmergencyContactInput(name: '  Mom  ', phone: ' 9876543210 ', relation: 'Mother'),
        EmergencyContactInput(name: '', phone: '9111111111'),
        EmergencyContactInput(name: 'No Phone', phone: ''),
      ],
    ));

    final captured =
        verify(() => dio.put('/api/rider-profile', data: captureAny(named: 'data'))).captured.single as Map<String, dynamic>;

    expect(captured['emergencyContacts'], [
      {'name': 'Mom', 'phone': '9876543210', 'relation': 'Mother'},
    ]);
  });

  test("save() drops clubName unless ridingClubType is CLUB_MEMBER", () async {
    await repository.save(const RiderProfileInput(ridingClubType: 'SOLO', clubName: 'Some Club'));

    final captured =
        verify(() => dio.put('/api/rider-profile', data: captureAny(named: 'data'))).captured.single as Map<String, dynamic>;

    expect(captured.containsKey('clubName'), isFalse);
    expect(captured['ridingClubType'], 'SOLO');
  });

  test('skip() posts to /api/rider-profile/skip', () async {
    when(() => dio.post(any())).thenAnswer(
      (_) async => Response(requestOptions: RequestOptions(path: '/api/rider-profile/skip'), statusCode: 200, data: {}),
    );

    await repository.skip();

    verify(() => dio.post('/api/rider-profile/skip')).called(1);
  });
}
