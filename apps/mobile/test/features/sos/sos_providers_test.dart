import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/features/sos/data/sos_model.dart';
import 'package:mobile/features/sos/data/sos_repository.dart';
import 'package:mobile/features/sos/domain/sos_providers.dart';
import 'package:mocktail/mocktail.dart';

class _MockSosRepository extends Mock implements SosRepository {}

SOSAlert _alert({String status = 'ACTIVE'}) => SOSAlert(
      id: 'alert-1',
      userId: 'user-1',
      userName: 'Rider One',
      userEmail: 'rider@bikie.app',
      type: 'BREAKDOWN',
      latitude: 12.9716,
      longitude: 77.5946,
      city: 'Bengaluru',
      status: status,
      severity: 'ASSISTANCE',
      escalationTier: 'NEARBY_RIDERS_GENERAL',
      currentRadiusMeters: 5000,
      createdAt: '2026-07-14T00:00:00.000Z',
    );

SOSHistoryEntry _historyEntry({String status = 'RESOLVED'}) => SOSHistoryEntry(
      id: 'alert-1',
      type: 'BREAKDOWN',
      city: 'Bengaluru',
      status: status,
      severity: 'ASSISTANCE',
      escalationTier: 'NEARBY_RIDERS_GENERAL',
      createdAt: '2026-07-14T00:00:00.000Z',
    );

void main() {
  late _MockSosRepository repository;
  late ProviderContainer container;

  setUp(() {
    repository = _MockSosRepository();
    container = ProviderContainer(
      overrides: [sosRepositoryProvider.overrideWithValue(repository)],
    );
    addTearDown(container.dispose);
  });

  test('activeSosAlertsProvider delegates to SosRepository.getActive', () async {
    when(() => repository.getActive(city: any(named: 'city'))).thenAnswer((_) async => [_alert()]);

    final result = await container.read(activeSosAlertsProvider.future);

    expect(result, hasLength(1));
    expect(result.single.status, 'ACTIVE');
    verify(() => repository.getActive(city: null)).called(1);
  });

  test('sosHistoryProvider delegates to SosRepository.getHistory', () async {
    when(() => repository.getHistory()).thenAnswer((_) async => [_historyEntry(status: 'RESOLVED')]);

    final result = await container.read(sosHistoryProvider.future);

    expect(result, hasLength(1));
    expect(result.single.status, 'RESOLVED');
    verify(() => repository.getHistory()).called(1);
  });

  test('activeSosAlertsProvider surfaces an ApiException as an AsyncError rather than throwing synchronously', () async {
    when(() => repository.getActive(city: any(named: 'city')))
        .thenThrow(ApiException(statusCode: 500, message: 'Something went wrong'));

    await expectLater(
      container.read(activeSosAlertsProvider.future),
      throwsA(isA<ApiException>().having((e) => e.statusCode, 'statusCode', 500)),
    );

    final state = container.read(activeSosAlertsProvider);
    expect(state.hasError, isTrue);
    expect(state.error, isA<ApiException>());
  });
}
