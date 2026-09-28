import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:mobile/core/push/push_registration_service.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';
import 'package:mobile/features/auth/data/user_model.dart';
import 'package:mobile/features/auth/domain/auth_controller.dart';
import 'package:mobile/features/auth/domain/auth_state.dart';
import 'package:mobile/features/onboarding/data/geocoding_repository.dart';
import 'package:mobile/features/onboarding/data/partner_profile_model.dart';
import 'package:mobile/features/onboarding/data/partner_profile_repository.dart';
import 'package:mobile/features/onboarding/presentation/partner_onboarding_screen.dart';
import 'package:mobile/features/sos/domain/sos_providers.dart';
import 'package:mocktail/mocktail.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

class _MockPush extends Mock implements PushRegistrationService {}

class _MockPartnerRepository extends Mock implements PartnerProfileRepository {}

class _MockGeocoding extends Mock implements GeocodingRepository {}

const _gps = (latitude: 15.4909, longitude: 73.8278);
const _savedLat = 26.9124;
const _savedLng = 75.7873;

final _serviceProvider = UserModel.fromJson(const {
  'id': 'sp-1',
  'name': 'Honda Service',
  'email': 'sp@bikie.app',
  'role': 'PARTNER',
  'accountType': 'SERVICE_PROVIDER',
  'partnerStatus': 'DRAFT',
});

void main() {
  setUpAll(() {
    registerFallbackValue(const PartnerProfileInput(businessName: 'x', type: 'MECHANIC', city: 'x'));
    registerFallbackValue(const LatLng(0, 0));
  });

  late _MockAuthRepository authRepository;
  late _MockPartnerRepository partnerRepository;
  late _MockGeocoding geocoding;
  late int gpsCalls;

  setUp(() {
    authRepository = _MockAuthRepository();
    partnerRepository = _MockPartnerRepository();
    geocoding = _MockGeocoding();
    gpsCalls = 0;
    when(() => authRepository.updateUser(name: any(named: 'name'))).thenAnswer((_) async {});
    when(() => authRepository.getSession()).thenAnswer((_) async => _serviceProvider);
    when(() => partnerRepository.save(any())).thenAnswer((_) async {});
    when(() => geocoding.reverse(any())).thenAnswer(
      (_) async => const ReverseGeocodeResult(city: 'Panaji', area: 'Altinho', pincode: '403001', road: 'MG Road'),
    );
    when(() => geocoding.searchCity(any())).thenAnswer((_) async => null);
  });

  Future<void> pumpScreen(
    WidgetTester tester, {
    PartnerProfileSummary? initialProfile,
    ({double latitude, double longitude})? gpsFix = _gps,
  }) async {
    // Wide because the test font renders glyphs as full squares (flutter_map's attribution row
    // would otherwise overflow), tall so the whole form fits without scrolling. Layout at phone
    // sizes is covered by the picker's own tests.
    tester.view.physicalSize = const Size(900, 3200);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    final router = GoRouter(
      initialLocation: '/start',
      routes: [
        GoRoute(path: '/start', builder: (_, __) => const Scaffold(body: Text('start'))),
        GoRoute(path: '/form', builder: (_, __) => PartnerOnboardingScreen(initialProfile: initialProfile)),
        GoRoute(path: '/partner-membership', builder: (_, __) => const Scaffold(body: Text('membership'))),
      ],
    );
    await tester.pumpWidget(ProviderScope(
      overrides: [
        authRepositoryProvider.overrideWithValue(authRepository),
        authControllerProvider.overrideWith(
          (ref) => AuthController(authRepository, _MockPush())..state = AuthState.authenticated(_serviceProvider),
        ),
        partnerProfileRepositoryProvider.overrideWithValue(partnerRepository),
        geocodingRepositoryProvider.overrideWithValue(geocoding),
        oneShotLocationProvider.overrideWithValue(() async {
          gpsCalls++;
          return gpsFix;
        }),
      ],
      child: MaterialApp.router(theme: AppTheme.dark, routerConfig: router),
    ));
    router.push('/form');
    await tester.pumpAndSettle();
  }

  Future<void> fillRequired(WidgetTester tester) async {
    await tester.enterText(find.widgetWithText(TextField, 'Business name *'), 'Honda Service');
    await tester.enterText(find.widgetWithText(TextField, 'Business mobile *'), '9876543210');
    await tester.enterText(find.widgetWithText(TextField, 'Business email *'), 'hello@honda.com');
    await tester.enterText(find.widgetWithText(TextField, 'City *'), 'Panaji');
  }

  Future<void> tapVisible(WidgetTester tester, Finder finder) async {
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  PartnerProfileInput savedInput() =>
      verify(() => partnerRepository.save(captureAny())).captured.single as PartnerProfileInput;

  group('new Service Provider', () {
    testWidgets('requests GPS on open and saves the confirmed GPS location', (tester) async {
      await pumpScreen(tester);
      expect(gpsCalls, 1);

      await fillRequired(tester);
      await tapVisible(tester, find.text('Confirm location'));
      await tapVisible(tester, find.text('Save & continue'));

      final input = savedInput();
      expect(input.latitude, _gps.latitude);
      expect(input.longitude, _gps.longitude);
      expect(find.text('membership'), findsOneWidget);
    });

    testWidgets('saving without a confirmed location is rejected', (tester) async {
      await pumpScreen(tester);
      await fillRequired(tester);

      await tapVisible(tester, find.text('Save & continue'));

      expect(find.text('Please select and confirm your service location to continue.'), findsOneWidget);
      verifyNever(() => partnerRepository.save(any()));
    });

    testWidgets('GPS denied: manual selection + confirm still completes onboarding', (tester) async {
      await pumpScreen(tester, gpsFix: null);
      expect(
        find.text("We couldn't access your current location. Please move the map and select your service location manually."),
        findsOneWidget,
      );

      await fillRequired(tester);
      final map = find.byType(FlutterMap);
      await tester.ensureVisible(map);
      await tester.drag(map, const Offset(-80, 60));
      await tester.pumpAndSettle();
      await tapVisible(tester, find.text('Confirm location'));
      await tapVisible(tester, find.text('Save & continue'));

      final input = savedInput();
      expect(input.latitude, isNotNull);
      expect(input.longitude, isNotNull);
    });

    testWidgets('reverse geocoding runs once on confirm and fills only empty address fields', (tester) async {
      await pumpScreen(tester);
      verifyNever(() => geocoding.reverse(any()));

      await tester.enterText(find.widgetWithText(TextField, 'City *'), 'Goa');
      await tester.enterText(find.widgetWithText(TextField, 'Address line (optional)'), 'Shop 4, typed by me');
      await tapVisible(tester, find.text('Confirm location'));

      verify(() => geocoding.reverse(any())).called(1);
      TextField field(String label) => tester.widget<TextField>(find.widgetWithText(TextField, label));
      expect(field('City *').controller!.text, 'Goa', reason: 'typed value kept');
      expect(field('Address line (optional)').controller!.text, 'Shop 4, typed by me', reason: 'typed value kept');
      expect(field('Area (optional)').controller!.text, 'Altinho', reason: 'empty field filled');
      expect(field('Pincode (optional)').controller!.text, '403001', reason: 'empty field filled');
    });
  });

  group('existing Service Provider', () {
    const profile = PartnerProfileSummary(
      businessName: 'Honda Service',
      type: 'MECHANIC',
      isVerified: false,
      isAvailable: true,
      isGeneralResponder: false,
      businessMobile: '9876543210',
      businessEmail: 'hello@honda.com',
      city: 'Jaipur',
      latitude: _savedLat,
      longitude: _savedLng,
    );

    testWidgets('opens on the saved location, never auto-requests GPS, and keeps it on save', (tester) async {
      await pumpScreen(tester, initialProfile: profile);
      expect(gpsCalls, 0);

      await tapVisible(tester, find.text('Save changes'));

      final input = savedInput();
      expect(input.latitude, _savedLat);
      expect(input.longitude, _savedLng);
      verifyNever(() => geocoding.reverse(any()));
    });

    testWidgets('an adjusted but unconfirmed pin blocks saving; confirming saves the new location', (tester) async {
      await pumpScreen(tester, initialProfile: profile);

      final map = find.byType(FlutterMap);
      await tester.ensureVisible(map);
      await tester.drag(map, const Offset(0, 80));
      await tester.pumpAndSettle();

      await tapVisible(tester, find.text('Save changes'));
      expect(find.textContaining("didn't confirm the new location"), findsOneWidget);
      verifyNever(() => partnerRepository.save(any()));

      await tapVisible(tester, find.text('Confirm location'));
      await tapVisible(tester, find.text('Save changes'));
      final input = savedInput();
      expect(input.latitude, greaterThan(_savedLat), reason: 'dragging down moves the pin north');
    });
  });
}
