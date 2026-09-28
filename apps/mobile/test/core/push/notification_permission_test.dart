import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/providers.dart';
import 'package:mobile/core/push/notification_permission.dart';
import 'package:mobile/core/push/push_registration_service.dart';
import 'package:mobile/core/storage/app_preferences.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/widgets/notification_permission_prompt.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';
import 'package:mobile/features/auth/data/user_model.dart';
import 'package:mobile/features/auth/domain/auth_controller.dart';
import 'package:mobile/features/auth/domain/auth_state.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _MockPush extends Mock implements PushRegistrationService {}

class _MockAuthRepository extends Mock implements AuthRepository {}

/// Scriptable stand-in for the Android plugin calls.
class _FakePermissionService implements NotificationPermissionService {
  _FakePermissionService(this.current, {this.afterRequest});

  NotificationPermissionState current;
  NotificationPermissionState? afterRequest;
  int requests = 0;
  int settingsOpened = 0;

  @override
  Future<NotificationPermissionState> check() async => current;

  @override
  Future<NotificationPermissionState> request() async {
    requests++;
    if (afterRequest != null) current = afterRequest!;
    return current;
  }

  @override
  Future<void> openSystemSettings() async => settingsOpened++;
}

UserModel _user(String accountType) => UserModel.fromJson({
      'id': 'u1',
      'name': 'Test',
      'email': 't@bikie.app',
      'role': accountType == 'SERVICE_PROVIDER' ? 'PARTNER' : 'RENTER',
      'accountType': accountType,
    });

void main() {
  late _MockPush push;

  setUp(() {
    push = _MockPush();
    when(() => push.registerForCurrentUser()).thenAnswer((_) async {});
    resetNotificationPromptForTest();
  });

  group('NotificationPermissionController', () {
    test('registers the push token when permission becomes granted — and only then', () async {
      final service = _FakePermissionService(NotificationPermissionState.canRequest,
          afterRequest: NotificationPermissionState.granted);
      final controller = NotificationPermissionController(service, push);

      expect(await controller.refresh(), NotificationPermissionState.canRequest);
      verifyNever(() => push.registerForCurrentUser());

      expect(await controller.request(), NotificationPermissionState.granted);
      verify(() => push.registerForCurrentUser()).called(1);

      await controller.refresh(); // still granted: no duplicate registration
      verifyNever(() => push.registerForCurrentUser());
    });

    test('a denied request leaves notifications off and registers nothing new', () async {
      final service = _FakePermissionService(NotificationPermissionState.canRequest,
          afterRequest: NotificationPermissionState.blocked);
      final controller = NotificationPermissionController(service, push);

      expect(await controller.request(), NotificationPermissionState.blocked);
      verifyNever(() => push.registerForCurrentUser());
    });

    test('turning notifications on in Settings is picked up on the next refresh (app resume)', () async {
      final service = _FakePermissionService(NotificationPermissionState.blocked);
      final controller = NotificationPermissionController(service, push);
      await controller.refresh();

      service.current = NotificationPermissionState.granted;
      await controller.refresh();

      expect(controller.state, NotificationPermissionState.granted);
      verify(() => push.registerForCurrentUser()).called(1);
    });
  });

  group('NotificationPermissionGate', () {
    late AppPreferences prefs;

    Future<_FakePermissionService> pumpGate(
      WidgetTester tester,
      NotificationPermissionState state, {
      NotificationPermissionState? afterRequest,
      String accountType = 'RIDER',
      DateTime? lastShown,
    }) async {
      SharedPreferences.setMockInitialValues({});
      prefs = AppPreferences(await SharedPreferences.getInstance());
      if (lastShown != null) await prefs.setNotificationPromptShownAt(lastShown);
      final service = _FakePermissionService(state, afterRequest: afterRequest);
      final authRepository = _MockAuthRepository();

      await tester.pumpWidget(ProviderScope(
        overrides: [
          appPreferencesProvider.overrideWithValue(prefs),
          notificationPermissionServiceProvider.overrideWithValue(service),
          pushRegistrationServiceProvider.overrideWithValue(push),
          authControllerProvider.overrideWith(
            (ref) => AuthController(authRepository, push)..state = AuthState.authenticated(_user(accountType)),
          ),
        ],
        child: MaterialApp(
          theme: AppTheme.dark,
          home: const NotificationPermissionGate(child: Scaffold(body: Text('home'))),
        ),
      ));
      await tester.pumpAndSettle();
      return service;
    }

    testWidgets('explains why before asking, then shows the system dialog on Allow', (tester) async {
      final service = await pumpGate(tester, NotificationPermissionState.canRequest,
          afterRequest: NotificationPermissionState.granted);

      expect(find.text('Turn on notifications'), findsOneWidget);
      expect(find.text('SOS alerts when a rider near you needs help'), findsOneWidget);
      expect(service.requests, 0, reason: 'the system dialog only follows an explicit tap');

      await tester.tap(find.text('Allow notifications'));
      await tester.pumpAndSettle();

      expect(service.requests, 1);
      expect(find.text('Turn on notifications'), findsNothing);
      verify(() => push.registerForCurrentUser()).called(1);
      expect(prefs.notificationPromptShownAt, isNotNull);
    });

    testWidgets('Service Providers see their own reasons', (tester) async {
      await pumpGate(tester, NotificationPermissionState.canRequest, accountType: 'SERVICE_PROVIDER');
      expect(find.text('New SOS assistance requests near you'), findsOneWidget);
    });

    testWidgets('once Android stops showing the dialog, offers Settings instead', (tester) async {
      final service = await pumpGate(tester, NotificationPermissionState.blocked);

      expect(find.text('Open settings'), findsOneWidget);
      await tester.tap(find.text('Open settings'));
      await tester.pumpAndSettle();

      expect(service.settingsOpened, 1);
      expect(service.requests, 0);
    });

    testWidgets('never shown when notifications are already on', (tester) async {
      await pumpGate(tester, NotificationPermissionState.granted);
      expect(find.text('Turn on notifications'), findsNothing);
    });

    testWidgets('"Not now" is respected for a few days', (tester) async {
      await pumpGate(tester, NotificationPermissionState.canRequest,
          lastShown: DateTime.now().subtract(const Duration(days: 1)));
      expect(find.text('Turn on notifications'), findsNothing);
    });

    testWidgets('offered again after the re-prompt interval', (tester) async {
      await pumpGate(tester, NotificationPermissionState.canRequest,
          lastShown: DateTime.now().subtract(const Duration(days: 4)));
      expect(find.text('Turn on notifications'), findsOneWidget);
    });

    testWidgets('only once per launch, even if the shell is rebuilt', (tester) async {
      await pumpGate(tester, NotificationPermissionState.canRequest);
      await tester.tap(find.text('Not now'));
      await tester.pumpAndSettle();

      // A fresh gate in the same process (e.g. after navigating or re-login) doesn't re-open it,
      // even with no "last shown" date in the new preferences.
      await pumpGate(tester, NotificationPermissionState.canRequest);
      expect(find.text('Turn on notifications'), findsNothing);
    });
  });
}
