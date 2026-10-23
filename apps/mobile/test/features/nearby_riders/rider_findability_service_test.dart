import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/nearby_riders/data/nearby_riders_repository.dart';
import 'package:mobile/features/nearby_riders/domain/rider_findability_service.dart';
import 'package:mobile/features/nearby_riders/domain/rider_location_permission.dart';
import 'package:mocktail/mocktail.dart';

class _MockRepository extends Mock implements NearbyRidersRepository {}

/// Scriptable stand-in for the Android plugin calls — mirrors
/// `notification_permission_test.dart`'s `_FakePermissionService`.
class _FakePermissionService implements RiderLocationPermissionService {
  _FakePermissionService(this.current, {this.afterRequest});

  RiderLocationPermissionState current;
  RiderLocationPermissionState? afterRequest;
  int requests = 0;
  int settingsOpened = 0;

  @override
  Future<RiderLocationPermissionState> check() async => current;

  @override
  Future<RiderLocationPermissionState> request() async {
    requests++;
    if (afterRequest != null) current = afterRequest!;
    return current;
  }

  @override
  Future<void> openSystemSettings() async => settingsOpened++;
}

void main() {
  late _MockRepository repository;

  Future<({double latitude, double longitude})?> fakeFix() async => (latitude: 12.9, longitude: 77.6);

  RiderFindabilityService buildService(RiderLocationPermissionService permission) =>
      RiderFindabilityService(repository, permission, captureFix: fakeFix);

  setUp(() {
    repository = _MockRepository();
    when(() => repository.setSharingEnabled(any())).thenAnswer((_) async {});
    when(() => repository.updateLocation(any(), any())).thenAnswer((_) async {});
  });

  group('enable()', () {
    test('requests permission, persists true, pushes a fix, and starts the periodic refresh', () async {
      final permission = _FakePermissionService(RiderLocationPermissionState.canRequest,
          afterRequest: RiderLocationPermissionState.granted);
      final service = buildService(permission);

      final result = await service.enable();

      expect(result, RiderLocationPermissionState.granted);
      expect(permission.requests, 1);
      verify(() => repository.setSharingEnabled(true)).called(1);
      expect(service.isTimerActive, isTrue);
    });

    test('does not persist or start tracking when permission is denied', () async {
      final permission = _FakePermissionService(RiderLocationPermissionState.canRequest,
          afterRequest: RiderLocationPermissionState.canRequest);
      final service = buildService(permission);

      final result = await service.enable();

      expect(result, RiderLocationPermissionState.canRequest);
      verifyNever(() => repository.setSharingEnabled(any()));
      expect(service.isTimerActive, isFalse);
    });

    test('never shows the dialog when permission is already granted', () async {
      final permission = _FakePermissionService(RiderLocationPermissionState.granted);
      final service = buildService(permission);

      await service.enable();

      expect(permission.requests, 0, reason: 'already granted — must not prompt again');
    });
  });

  group('disable()', () {
    test('persists false and stops the periodic refresh', () async {
      final permission = _FakePermissionService(RiderLocationPermissionState.granted);
      final service = buildService(permission);
      await service.enable();
      expect(service.isTimerActive, isTrue);

      await service.disable();

      verify(() => repository.setSharingEnabled(false)).called(1);
      expect(service.isTimerActive, isFalse);
    });
  });

  group('restore() — app start / resume, never prompts', () {
    test('persisted true + permission already granted: pushes a fix and resumes tracking silently', () async {
      when(() => repository.getSharingEnabled()).thenAnswer((_) async => true);
      final permission = _FakePermissionService(RiderLocationPermissionState.granted);
      final service = buildService(permission);

      await service.restore();

      expect(service.isTimerActive, isTrue);
      verify(() => repository.updateLocation(any(), any())).called(1);
      expect(permission.requests, 0, reason: 'restore must never request permission itself');
    });

    test('persisted true but permission missing: leaves tracking off and never requests', () async {
      when(() => repository.getSharingEnabled()).thenAnswer((_) async => true);
      final permission = _FakePermissionService(RiderLocationPermissionState.canRequest);
      final service = buildService(permission);

      await service.restore();

      expect(service.isTimerActive, isFalse);
      expect(permission.requests, 0);
      verifyNever(() => repository.updateLocation(any(), any()));
    });

    test('persisted false: tracking stays off, no fix pushed', () async {
      when(() => repository.getSharingEnabled()).thenAnswer((_) async => false);
      final permission = _FakePermissionService(RiderLocationPermissionState.granted);
      final service = buildService(permission);

      await service.restore();

      expect(service.isTimerActive, isFalse);
      verifyNever(() => repository.updateLocation(any(), any()));
    });

    test('explicitly disabled stays disabled across a restart (restore reads the real persisted value)', () async {
      when(() => repository.getSharingEnabled()).thenAnswer((_) async => false);
      final permission = _FakePermissionService(RiderLocationPermissionState.granted);
      final service = buildService(permission);

      await service.restore();

      expect(service.isTimerActive, isFalse);
    });

    test('never starts a second timer if restore runs again while already tracking', () async {
      when(() => repository.getSharingEnabled()).thenAnswer((_) async => true);
      final permission = _FakePermissionService(RiderLocationPermissionState.granted);
      final service = buildService(permission);

      await service.restore();
      expect(service.isTimerActive, isTrue);
      await service.restore(); // simulates a second app-resume
      await service.restore(); // and a third

      // Exactly one fix per restore call (3 total) — not a growing number from duplicate timers.
      verify(() => repository.updateLocation(any(), any())).called(3);
      expect(service.isTimerActive, isTrue);
    });
  });

  group('stop() — logout', () {
    test('cancels the periodic refresh', () async {
      when(() => repository.getSharingEnabled()).thenAnswer((_) async => true);
      final permission = _FakePermissionService(RiderLocationPermissionState.granted);
      final service = buildService(permission);
      await service.restore();
      expect(service.isTimerActive, isTrue);

      service.stop();

      expect(service.isTimerActive, isFalse);
    });
  });

  group('account switching — restore() always reflects the current session, never a cached value', () {
    test('a different account with sharing off after a previous account had it on', () async {
      when(() => repository.getSharingEnabled()).thenAnswer((_) async => true);
      final permission = _FakePermissionService(RiderLocationPermissionState.granted);
      final service = buildService(permission);
      await service.restore();
      expect(service.isTimerActive, isTrue);

      // Logout.
      service.stop();
      expect(service.isTimerActive, isFalse);

      // A different account logs in on the same device/service instance — its own setting (off)
      // must be read fresh from the backend, never inherit the previous account's `true`.
      when(() => repository.getSharingEnabled()).thenAnswer((_) async => false);
      await service.restore();

      expect(service.isTimerActive, isFalse);
    });
  });
}
