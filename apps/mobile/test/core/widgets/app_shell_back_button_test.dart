import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/providers.dart';
import 'package:mobile/core/push/notification_permission.dart';
import 'package:mobile/core/push/push_registration_service.dart';
import 'package:mobile/core/storage/app_preferences.dart';
import 'package:mobile/core/widgets/app_shell.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';
import 'package:mobile/features/auth/data/user_model.dart';
import 'package:mobile/features/auth/domain/auth_controller.dart';
import 'package:mobile/features/auth/domain/auth_state.dart';
import 'package:mobile/features/nearby_riders/domain/rider_findability_service.dart';
import 'package:mobile/features/nearby_riders/domain/rider_location_permission.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _MockPush extends Mock implements PushRegistrationService {}

class _MockFindability extends Mock implements RiderFindabilityService {}

class _MockAuthRepository extends Mock implements AuthRepository {}

class _MockLocationPermission extends Mock implements RiderLocationPermissionService {}

class _FakeNotificationPermissionService implements NotificationPermissionService {
  @override
  Future<NotificationPermissionState> check() async => NotificationPermissionState.granted;

  @override
  Future<NotificationPermissionState> request() async => NotificationPermissionState.granted;

  @override
  Future<void> openSystemSettings() async {}
}

final _rider = UserModel.fromJson({
  'id': 'u1',
  'name': 'Test Rider',
  'email': 't@bikie.app',
  'role': 'RENTER',
  'accountType': 'RIDER',
});

/// Covers the system back button at the root of the app: must never close BIKIE outright. A
/// non-Home tab returns to Home first; Home itself asks for confirmation before actually exiting.
void main() {
  late _MockPush push;
  late _MockFindability findability;
  late _MockAuthRepository authRepository;
  late _MockLocationPermission locationPermission;
  late AppPreferences prefs;

  setUp(() async {
    push = _MockPush();
    when(() => push.registerForCurrentUser()).thenAnswer((_) async {});
    findability = _MockFindability();
    when(() => findability.restore()).thenAnswer((_) async {});
    authRepository = _MockAuthRepository();
    locationPermission = _MockLocationPermission();
    when(() => locationPermission.check()).thenAnswer((_) async => RiderLocationPermissionState.granted);
    SharedPreferences.setMockInitialValues({});
    prefs = AppPreferences(await SharedPreferences.getInstance());
  });

  Future<void> pumpShell(WidgetTester tester, {required String initialLocation}) async {
    final router = GoRouter(
      initialLocation: initialLocation,
      routes: [
        ShellRoute(
          builder: (context, state, child) => AppShell(child: child),
          routes: [
            GoRoute(path: '/', builder: (_, __) => const Text('home-screen')),
            GoRoute(path: '/trips', builder: (_, __) => const Text('trips-screen')),
          ],
        ),
      ],
    );

    await tester.pumpWidget(ProviderScope(
      overrides: [
        appPreferencesProvider.overrideWithValue(prefs),
        notificationPermissionServiceProvider.overrideWithValue(_FakeNotificationPermissionService()),
        pushRegistrationServiceProvider.overrideWithValue(push),
        riderFindabilityServiceProvider.overrideWithValue(findability),
        riderLocationPermissionServiceProvider.overrideWithValue(locationPermission),
        authControllerProvider.overrideWith(
          (ref) => AuthController(authRepository, push, findability)..state = AuthState.authenticated(_rider),
        ),
      ],
      child: MaterialApp.router(routerConfig: router),
    ));
    await tester.pumpAndSettle();
  }

  testWidgets('on a non-Home tab, the back button returns to Home instead of exiting', (tester) async {
    await pumpShell(tester, initialLocation: '/trips');
    expect(find.text('trips-screen'), findsOneWidget);

    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();

    expect(find.text('home-screen'), findsOneWidget);
    // No confirmation dialog for this hop — only leaving the app asks.
    expect(find.text('Exit BIKIE?'), findsNothing);
  });

  testWidgets('on the Home tab, the back button asks for confirmation instead of closing the app', (tester) async {
    await pumpShell(tester, initialLocation: '/');

    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();

    expect(find.text('Exit BIKIE?'), findsOneWidget);
    expect(find.text('Cancel'), findsOneWidget);
    expect(find.text('Exit'), findsOneWidget);
  });

  testWidgets('Cancel dismisses the dialog and leaves the app open on Home', (tester) async {
    await pumpShell(tester, initialLocation: '/');
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();

    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();

    expect(find.text('Exit BIKIE?'), findsNothing);
    expect(find.text('home-screen'), findsOneWidget);
  });

  testWidgets('Exit dismisses the dialog (confirmed exit is handed off to the OS, not asserted here)', (tester) async {
    await pumpShell(tester, initialLocation: '/');
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();

    await tester.tap(find.text('Exit'));
    await tester.pumpAndSettle();

    expect(find.text('Exit BIKIE?'), findsNothing);
  });
}
