import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/membership/data/membership_repository.dart';
import 'package:mobile/features/membership/presentation/membership_screen.dart';
import 'package:mocktail/mocktail.dart';
import 'package:url_launcher_platform_interface/link.dart';
import 'package:url_launcher_platform_interface/url_launcher_platform_interface.dart';

class _MockDio extends Mock implements Dio {}

/// Records what the screen actually asked to be launched, without touching a real platform
/// channel — `UrlLauncherPlatform.instance` is the documented seam `package:url_launcher`
/// itself calls through (`launchUrl()` → `UrlLauncherPlatform.instance.launchUrl(...)`).
class _FakeUrlLauncherPlatform extends UrlLauncherPlatform {
  String? lastLaunchedUrl;

  @override
  LinkDelegate? get linkDelegate => null;

  @override
  Future<bool> launchUrl(String url, LaunchOptions options) async {
    lastLaunchedUrl = url;
    return true;
  }
}

Response<T> _ok<T>(String path, T data) =>
    Response<T>(requestOptions: RequestOptions(path: path), statusCode: 200, data: data);

Map<String, dynamic> _planJson() => {
      'id': 'plan-rider-yearly',
      'name': 'Golden Subscription',
      'description': 'BIKIE Rider Yearly Membership',
      'price': 149,
      'durationDays': 365,
      'benefits': <String>[],
      'isActive': true,
    };

Map<String, dynamic> _membershipJson({required String status}) => {
      'id': 'um-1',
      'userId': 'user-1',
      'planId': 'plan-rider-yearly',
      'plan': _planJson(),
      'startDate': '2026-10-29T00:00:00.000Z',
      'endDate': '2027-10-29T00:00:00.000Z',
      'status': status,
      'daysLeft': 365,
    };

void main() {
  setUpAll(() {
    registerFallbackValue(RequestOptions(path: '/'));
  });

  late _MockDio dio;
  late _FakeUrlLauncherPlatform fakeLauncher;
  late UrlLauncherPlatform originalLauncher;

  setUp(() {
    dio = _MockDio();
    fakeLauncher = _FakeUrlLauncherPlatform();
    originalLauncher = UrlLauncherPlatform.instance;
    UrlLauncherPlatform.instance = fakeLauncher;

    when(() => dio.get('/api/membership/plans')).thenAnswer(
      (_) async => _ok('/api/membership/plans', {
        'plans': [_planJson()],
      }),
    );
  });

  tearDown(() {
    UrlLauncherPlatform.instance = originalLauncher;
  });

  Future<void> pumpScreen(WidgetTester tester, {bool settle = true}) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [membershipRepositoryProvider.overrideWithValue(MembershipRepository(dio))],
        child: const MaterialApp(home: MembershipScreen()),
      ),
    );
    if (settle) {
      await tester.pumpAndSettle();
    } else {
      // The pending card's CircularProgressIndicator animates indefinitely by design, so
      // pumpAndSettle() never resolves while it's on screen — bounded pumps instead, just
      // enough for the initial FutureProviders to resolve.
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));
    }
  }

  group('confirmation dialog before opening Razorpay', () {
    setUp(() {
      when(() => dio.get('/api/membership/active')).thenAnswer(
        (_) async => _ok('/api/membership/active', {'membership': null, 'pendingSubscription': null}),
      );
    });

    testWidgets('tapping Start Yearly Membership shows the dialog before anything is launched', (tester) async {
      await pumpScreen(tester);

      await tester.tap(find.text('Start Yearly Membership — ₹149/year'));
      await tester.pumpAndSettle();

      expect(find.text('Set up AutoPay'), findsOneWidget);
      expect(find.textContaining("You'll be taken to Razorpay"), findsOneWidget);
      expect(fakeLauncher.lastLaunchedUrl, isNull);
      verifyNever(() => dio.post('/api/membership/subscription', data: any(named: 'data')));
    });

    testWidgets('Cancel dismisses the dialog without starting a subscription or launching Razorpay', (tester) async {
      await pumpScreen(tester);

      await tester.tap(find.text('Start Yearly Membership — ₹149/year'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();

      expect(find.text('Set up AutoPay'), findsNothing);
      expect(fakeLauncher.lastLaunchedUrl, isNull);
      verifyNever(() => dio.post('/api/membership/subscription', data: any(named: 'data')));
    });

    testWidgets('Continue starts the subscription and launches the existing short_url unchanged', (tester) async {
      when(() => dio.post('/api/membership/subscription', data: {'planId': 'plan-rider-yearly'})).thenAnswer(
        (_) async => _ok('/api/membership/subscription', {
          'membership': _membershipJson(status: 'PENDING'),
          'subscription': {'id': 'sub_test123', 'status': 'created', 'shortUrl': 'https://rzp.io/rzp/testlink'},
        }),
      );

      await pumpScreen(tester);
      await tester.tap(find.text('Start Yearly Membership — ₹149/year'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      expect(fakeLauncher.lastLaunchedUrl, 'https://rzp.io/rzp/testlink');
      verify(() => dio.post('/api/membership/subscription', data: {'planId': 'plan-rider-yearly'})).called(1);
    });
  });

  group('Check status on the pending card', () {
    testWidgets('refreshes membership/pending state the same way resume and polling do', (tester) async {
      var activeCalls = 0;
      when(() => dio.get('/api/membership/active')).thenAnswer((_) async {
        activeCalls++;
        return _ok('/api/membership/active', {
          'membership': null,
          'pendingSubscription': _membershipJson(status: 'PENDING'),
        });
      });

      await pumpScreen(tester, settle: false);

      expect(find.text('Payment processing'), findsOneWidget);
      expect(find.text('Check status'), findsOneWidget);
      final callsBeforeTap = activeCalls;

      final checkStatusButton = find.byKey(const Key('pending-subscription-check-status'));
      await tester.tap(checkStatusButton);
      await tester.pump();

      // Duplicate rapid taps are ignored while a check is already in flight — same stable
      // widget, found by key rather than by its now-changed "Checking…" label.
      await tester.tap(checkStatusButton);
      await tester.pump();

      expect(find.text('Checking…'), findsOneWidget);

      // Longer than _checkStatus's own 600ms debounce delay.
      await tester.pump(const Duration(milliseconds: 700));
      await tester.pump();

      expect(find.text('Check status'), findsOneWidget);
      expect(activeCalls, greaterThan(callsBeforeTap));
    });
  });
}
