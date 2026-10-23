import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/push/push_registration_service.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';
import 'package:mobile/features/auth/data/user_model.dart';
import 'package:mobile/features/auth/domain/auth_controller.dart';
import 'package:mobile/features/nearby_riders/domain/rider_findability_service.dart';
import 'package:mocktail/mocktail.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

class _MockPush extends Mock implements PushRegistrationService {}

class _MockFindability extends Mock implements RiderFindabilityService {}

UserModel _rider({String id = 'u1'}) => UserModel.fromJson({
      'id': id,
      'name': 'Test',
      'email': '$id@bikie.app',
      'role': 'RENTER',
      'accountType': 'RIDER',
    });

void main() {
  late _MockAuthRepository authRepository;
  late _MockPush push;
  late _MockFindability findability;

  setUp(() {
    authRepository = _MockAuthRepository();
    push = _MockPush();
    findability = _MockFindability();
    when(() => push.registerForCurrentUser()).thenAnswer((_) async {});
    when(() => push.unregisterCurrentDevice()).thenAnswer((_) async {});
    when(() => findability.restore()).thenAnswer((_) async {});
  });

  AuthController controller() => AuthController(authRepository, push, findability);

  group('session bootstrap/login restores the signed-in account\'s findability preference', () {
    test('bootstrap() with an existing session restores it', () async {
      when(() => authRepository.getSession()).thenAnswer((_) async => _rider());
      await controller().bootstrap();
      verify(() => findability.restore()).called(1);
    });

    test('bootstrap() with no session never restores anything', () async {
      when(() => authRepository.getSession()).thenAnswer((_) async => null);
      await controller().bootstrap();
      verifyNever(() => findability.restore());
    });

    test('signIn() restores the just-signed-in account\'s own preference', () async {
      when(() => authRepository.signIn(email: any(named: 'email'), password: any(named: 'password')))
          .thenAnswer((_) async => _rider());
      await controller().signIn(email: 'a@bikie.app', password: 'x');
      verify(() => findability.restore()).called(1);
    });

    test('verifyOtp() restores the account\'s preference after OTP sign-in', () async {
      when(() => authRepository.verifyOtp(
            phoneNumber: any(named: 'phoneNumber'),
            code: any(named: 'code'),
            reqId: any(named: 'reqId'),
            legalConsent: any(named: 'legalConsent'),
          )).thenAnswer((_) async => _rider());
      await controller().verifyOtp(phoneNumber: '+911234567890', code: '1234');
      verify(() => findability.restore()).called(1);
    });
  });

  group('logout stops findability tracking so it never leaks into the next session', () {
    test('signOut() stops it', () async {
      when(() => authRepository.signOut()).thenAnswer((_) async {});
      await controller().signOut();
      verify(() => findability.stop()).called(1);
    });

    test('forceLogout() (expired session) also stops it', () {
      controller().forceLogout();
      verify(() => findability.stop()).called(1);
    });
  });

  test(
    'logging into a different account on the same device restores THAT account\'s own setting — '
    'restore() is called fresh on every login, never skipped because a previous session already ran it',
    () async {
      final ctrl = controller();
      when(() => authRepository.signOut()).thenAnswer((_) async {});
      when(() => authRepository.signIn(email: any(named: 'email'), password: any(named: 'password')))
          .thenAnswer((invocation) async => _rider(id: invocation.namedArguments[#email] as String));

      await ctrl.signIn(email: 'first@bikie.app', password: 'x');
      await ctrl.signOut();
      await ctrl.signIn(email: 'second@bikie.app', password: 'x');

      // restore() ran once per login (not cached/skipped the second time), and stop() ran on the
      // logout in between — each account's state is independently re-fetched from the backend.
      verify(() => findability.restore()).called(2);
      verify(() => findability.stop()).called(1);
    },
  );
}
