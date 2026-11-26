import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/payments/razorpay_checkout.dart';
import 'package:mobile/core/payments/razorpay_subscription_checkout.dart';
import 'package:mobile/features/partner_membership/data/partner_membership_repository.dart';
import 'package:mobile/features/partner_membership/presentation/partner_membership_screen.dart';
import 'package:mocktail/mocktail.dart';
import 'package:url_launcher_platform_interface/link.dart';
import 'package:url_launcher_platform_interface/url_launcher_platform_interface.dart';

class _MockDio extends Mock implements Dio {}

/// Records launches without a real platform channel. `succeed: false` simulates a device that
/// can't open the page in any mode.
class _FakeUrlLauncherPlatform extends UrlLauncherPlatform {
  _FakeUrlLauncherPlatform({this.succeed = true});

  final bool succeed;
  final List<(String, PreferredLaunchMode)> launches = [];

  @override
  LinkDelegate? get linkDelegate => null;

  @override
  Future<bool> launchUrl(String url, LaunchOptions options) async {
    launches.add((url, options.mode));
    return succeed;
  }
}

Response<T> _ok<T>(String path, T data) =>
    Response<T>(requestOptions: RequestOptions(path: path), statusCode: 200, data: data);

Map<String, dynamic> _planJson() => {
      'id': 'plan-sp-monthly',
      'name': 'Service Provider Membership',
      'description': 'BIKIE Service Provider monthly membership',
      'price': 99,
      'durationDays': 30,
      'benefits': <String>[],
      'isActive': true,
    };

Map<String, dynamic> _membershipJson({required String status}) => {
      'id': 'pm-1',
      'userId': 'user-1',
      'planId': 'plan-sp-monthly',
      'plan': _planJson(),
      'startDate': '2026-11-25T00:00:00.000Z',
      'endDate': '2026-12-25T00:00:00.000Z',
      'status': status,
      'daysLeft': 30,
    };

void main() {
  setUpAll(() => registerFallbackValue(RequestOptions(path: '/')));

  late _MockDio dio;
  late UrlLauncherPlatform originalLauncher;

  setUp(() {
    dio = _MockDio();
    originalLauncher = UrlLauncherPlatform.instance;
    when(() => dio.get('/api/partner-membership/plans')).thenAnswer(
      (_) async => _ok('/api/partner-membership/plans', {'plans': [_planJson()]}),
    );
    when(() => dio.get('/api/partner-membership/active')).thenAnswer(
      (_) async => _ok('/api/partner-membership/active', {'membership': null}),
    );
    when(() => dio.post('/api/partner-membership/subscription', data: {'planId': 'plan-sp-monthly'})).thenAnswer(
      (_) async => _ok('/api/partner-membership/subscription', {
        'membership': _membershipJson(status: 'PENDING'),
        'subscription': {'id': 'sub_sp123', 'status': 'created', 'shortUrl': 'https://rzp.io/rzp/sptestlink'},
      }),
    );
  });

  tearDown(() => UrlLauncherPlatform.instance = originalLauncher);

  Future<void> pumpScreen(WidgetTester tester, {SubscriptionCheckoutLauncher? launcher}) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          partnerMembershipRepositoryProvider.overrideWithValue(PartnerMembershipRepository(dio)),
          if (launcher != null) subscriptionCheckoutLauncherProvider.overrideWithValue(launcher),
        ],
        child: const MaterialApp(home: PartnerMembershipScreen()),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('Start Membership explains the Razorpay step before anything is sent or opened', (tester) async {
    final launcher = _FakeUrlLauncherPlatform();
    UrlLauncherPlatform.instance = launcher;
    await pumpScreen(tester);

    await tester.tap(find.text('Start Membership — ₹99/month'));
    await tester.pumpAndSettle();

    expect(find.text('Set up AutoPay'), findsOneWidget);
    expect(find.textContaining('approve AutoPay for your ₹99/month membership'), findsOneWidget);
    expect(launcher.launches, isEmpty);
    verifyNever(() => dio.post('/api/partner-membership/subscription', data: any(named: 'data')));

    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(launcher.launches, isEmpty);
    verifyNever(() => dio.post('/api/partner-membership/subscription', data: any(named: 'data')));
  });

  testWidgets('a double tap opens one dialog and sends one subscription request', (tester) async {
    final launcher = _FakeUrlLauncherPlatform();
    UrlLauncherPlatform.instance = launcher;
    await pumpScreen(tester);

    final start = find.text('Start Membership — ₹99/month');
    await tester.tap(start);
    await tester.tap(start, warnIfMissed: false);
    await tester.pumpAndSettle();

    expect(find.text('Set up AutoPay'), findsOneWidget);
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    verify(() => dio.post('/api/partner-membership/subscription', data: {'planId': 'plan-sp-monthly'})).called(1);
    expect(launcher.launches, hasLength(1));
  });

  testWidgets('Continue opens the unchanged short_url in an in-app browser tab', (tester) async {
    final launcher = _FakeUrlLauncherPlatform();
    UrlLauncherPlatform.instance = launcher;
    await pumpScreen(tester);

    await tester.tap(find.text('Start Membership — ₹99/month'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    expect(launcher.launches.single.$1, 'https://rzp.io/rzp/sptestlink');
    expect(launcher.launches.single.$2, PreferredLaunchMode.inAppBrowserView);
    expect(find.textContaining('updates automatically'), findsOneWidget);
  });

  testWidgets('tells the user when the Razorpay page could not be opened', (tester) async {
    final launcher = _FakeUrlLauncherPlatform(succeed: false);
    UrlLauncherPlatform.instance = launcher;
    await pumpScreen(tester);

    await tester.tap(find.text('Start Membership — ₹99/month'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    // In-app tab first, then the external-browser fallback.
    expect(launcher.launches.map((l) => l.$2), [PreferredLaunchMode.inAppBrowserView, PreferredLaunchMode.externalApplication]);
    expect(find.textContaining("Couldn't open the Razorpay payment page"), findsOneWidget);
  });

  testWidgets('returning to the app re-fetches membership status from the backend', (tester) async {
    UrlLauncherPlatform.instance = _FakeUrlLauncherPlatform();
    var activeCalls = 0;
    when(() => dio.get('/api/partner-membership/active')).thenAnswer((_) async {
      activeCalls++;
      return _ok('/api/partner-membership/active', {'membership': null});
    });
    await pumpScreen(tester);
    final before = activeCalls;

    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.pumpAndSettle();

    expect(activeCalls, greaterThan(before));
  });

  group('in-app Razorpay Checkout (server checkoutMode: native)', () {
    void serveNativeSubscription() {
      when(() => dio.post('/api/partner-membership/subscription', data: {'planId': 'plan-sp-monthly'})).thenAnswer(
        (_) async => _ok('/api/partner-membership/subscription', {
          'membership': _membershipJson(status: 'PENDING'),
          'subscription': {
            'id': 'sub_sp123',
            'status': 'created',
            'shortUrl': 'https://rzp.io/rzp/sptestlink',
            'keyId': 'rzp_test_public',
            'checkoutMode': 'native',
            'reused': false,
          },
        }),
      );
    }

    Future<void> startAndContinue(WidgetTester tester) async {
      await tester.tap(find.text('Start Membership — ₹99/month'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
    }

    testWidgets('opens the SDK with the server subscription id and sends the callback for server verification', (tester) async {
      final launcher = _FakeUrlLauncherPlatform();
      UrlLauncherPlatform.instance = launcher;
      serveNativeSubscription();
      when(() => dio.post('/api/partner-membership/subscription/verify', data: any(named: 'data'))).thenAnswer(
        (_) async => _ok('/api/partner-membership/subscription/verify', {'membership': _membershipJson(status: 'ACTIVE'), 'active': true}),
      );
      String? openedSubscription;
      String? openedKey;
      await pumpScreen(tester, launcher: ({required keyId, required subscriptionId, required planName, RazorpayPrefill? prefill}) async {
        openedSubscription = subscriptionId;
        openedKey = keyId;
        return const SubscriptionCheckoutSuccess(paymentId: 'pay_1', subscriptionId: 'sub_sp123', signature: 'sig_1');
      });

      await startAndContinue(tester);

      expect(openedSubscription, 'sub_sp123');
      expect(openedKey, 'rzp_test_public');
      verify(() => dio.post('/api/partner-membership/subscription/verify', data: {
            'razorpayPaymentId': 'pay_1',
            'razorpaySubscriptionId': 'sub_sp123',
            'razorpaySignature': 'sig_1',
          })).called(1);
      expect(launcher.launches, isEmpty, reason: 'the hosted page is not opened when in-app Checkout works');
      expect(find.textContaining('membership is now active'), findsOneWidget);
    });

    testWidgets('cancelling Checkout neither verifies nor opens the hosted page', (tester) async {
      final launcher = _FakeUrlLauncherPlatform();
      UrlLauncherPlatform.instance = launcher;
      serveNativeSubscription();
      await pumpScreen(tester, launcher: ({required keyId, required subscriptionId, required planName, RazorpayPrefill? prefill}) async =>
          const SubscriptionCheckoutCancelled());

      await startAndContinue(tester);

      verifyNever(() => dio.post('/api/partner-membership/subscription/verify', data: any(named: 'data')));
      expect(launcher.launches, isEmpty);
      expect(find.textContaining('Payment cancelled'), findsOneWidget);
    });

    testWidgets('if the SDK cannot open, falls back to the hosted page for the same subscription', (tester) async {
      final launcher = _FakeUrlLauncherPlatform();
      UrlLauncherPlatform.instance = launcher;
      serveNativeSubscription();
      await pumpScreen(tester, launcher: ({required keyId, required subscriptionId, required planName, RazorpayPrefill? prefill}) async =>
          const SubscriptionCheckoutUnavailable());

      await startAndContinue(tester);

      expect(launcher.launches.single.$1, 'https://rzp.io/rzp/sptestlink');
      verify(() => dio.post('/api/partner-membership/subscription', data: {'planId': 'plan-sp-monthly'})).called(1);
    });
  });
}
