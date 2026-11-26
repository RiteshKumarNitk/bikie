import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/core/providers.dart';
import 'package:mobile/core/storage/app_preferences.dart';
import 'package:mobile/core/push/push_registration_service.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/widgets/responsive_frame.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';
import 'package:mobile/features/auth/data/user_model.dart';
import 'package:mobile/features/auth/domain/auth_controller.dart';
import 'package:mobile/features/auth/domain/auth_state.dart';
import 'package:mobile/features/billing/presentation/billing_history_screen.dart';
import 'package:mobile/features/billing/presentation/invoice_detail_screen.dart';
import 'package:mobile/features/bookings/presentation/bookings_screen.dart';
import 'package:mobile/features/membership/presentation/membership_screen.dart';
import 'package:mobile/features/nearby_riders/domain/rider_findability_service.dart';
import 'package:mobile/features/notifications/presentation/notifications_screen.dart';
import 'package:mobile/features/onboarding/presentation/intro_screen.dart';
import 'package:mobile/features/onboarding/presentation/welcome_screen.dart';
import 'package:mobile/features/partner_dashboard/presentation/partner_active_screen.dart';
import 'package:mobile/features/partner_dashboard/presentation/partner_history_screen.dart';
import 'package:mobile/features/partner_membership/presentation/partner_membership_screen.dart';
import 'package:mobile/features/profile/presentation/profile_screen.dart';
import 'package:mobile/features/referrals/presentation/referrals_screen.dart';
import 'package:mobile/features/sos/presentation/sos_history_screen.dart';
import 'package:mobile/features/trips/presentation/my_rides_screen.dart';
import 'package:mobile/features/trips/presentation/ride_requests_screen.dart';
import 'package:mobile/features/trips/presentation/trips_list_screen.dart';
import 'package:mobile/features/wishlist/presentation/wishlist_screen.dart';
import 'package:mobile/features/account_type_request/presentation/account_type_request_screen.dart';
import 'package:mobile/features/auth/presentation/login_screen.dart';
import 'package:mobile/features/auth/presentation/signup_screen.dart';
import 'package:mobile/features/bikes/presentation/bikes_list_screen.dart';
import 'package:mobile/features/destinations/presentation/destinations_list_screen.dart';
import 'package:mobile/features/home/presentation/home_screen.dart';
import 'package:mobile/features/nearby_riders/presentation/nearby_riders_screen.dart';
import 'package:mobile/features/onboarding/presentation/rider_onboarding_screen.dart';
import 'package:mobile/features/partner_dashboard/presentation/partner_home_screen.dart';
import 'package:mobile/features/partner_dashboard/presentation/partner_requests_screen.dart';
import 'package:mobile/features/sos/presentation/sos_screen.dart';
import 'package:mobile/features/trips/presentation/create_ride_screen.dart';
import 'package:mobile/features/onboarding/presentation/partner_onboarding_screen.dart';
import 'package:mobile/features/partner_dashboard/presentation/partner_sos_request_screen.dart';
import 'package:mobile/features/partners/presentation/partners_screen.dart';
import 'package:mobile/features/sos/presentation/sos_detail_screen.dart';
import 'package:mobile/features/trips/presentation/trip_detail_screen.dart';
import 'package:mobile/features/bikes/presentation/bike_detail_screen.dart';
import 'package:mobile/features/destinations/presentation/destination_detail_screen.dart';
import 'package:mobile/features/messaging/presentation/conversation_thread_screen.dart';
import 'package:mobile/features/messaging/presentation/conversations_list_screen.dart';
import 'package:mobile/features/onboarding/presentation/splash_screen.dart';
import 'package:mobile/features/ride_room/presentation/ride_room_screen.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Responsive audit: every screen below is pumped at the widths from the UI-polish brief
/// (320 → 600+) and at normal and enlarged system font sizes. Flutter reports any RenderFlex
/// overflow or other layout error as an exception, which fails the test — so this catches
/// clipping/overflow regressions that `flutter analyze` and unit tests can't see.
///
/// The network layer is replaced by [_FakeAdapter], which serves deliberately long names,
/// emails, titles and descriptions, so text-wrapping paths are actually exercised.
const _sizes = <String, Size>{
  '320 small': Size(320, 640),
  '360 standard': Size(360, 760),
  '390 modern': Size(390, 844),
  '412 large Android': Size(412, 915),
  '430 large': Size(430, 932),
  '600 tablet': Size(600, 960),
  'landscape 780×360': Size(780, 360),
};
const _textScales = [1.0, 1.3, 2.0];

const _longName = 'Venkata Subramanian Raghunathan Iyer';
const _longEmail = 'venkata.subramanian.raghunathan.iyer@verylongcompanydomain.co.in';

final _riderUser = {
  'id': 'user-1',
  'name': _longName,
  'email': _longEmail,
  'role': 'RENTER',
  'accountType': 'RIDER',
  'phoneNumber': '+919876543210',
};
final _spUser = {
  ..._riderUser,
  'role': 'PARTNER',
  'accountType': 'SERVICE_PROVIDER',
  'partnerStatus': 'PENDING_VERIFICATION',
};

Map<String, dynamic> _plan({required num price, required int days, String name = 'Golden Subscription'}) => {
      'id': 'plan-1',
      'name': name,
      'description': 'BIKIE membership with SOS access, priority assistance and community features',
      'price': price,
      'durationDays': days,
      'benefits': [
        'Send Red and Amber SOS alerts to nearby riders and Service Providers',
        'Create and join community rides with a private Ride Room',
        'Priority support from the BIKIE team',
      ],
      'isActive': true,
    };

Map<String, dynamic> _membership({required num price, required int days}) => {
      'id': 'm-1',
      'userId': 'user-1',
      'planId': 'plan-1',
      'plan': _plan(price: price, days: days),
      'startDate': '2026-10-29T00:00:00.000Z',
      'endDate': '2027-10-29T00:00:00.000Z',
      'status': 'ACTIVE',
      'daysLeft': 338,
      'razorpaySubscriptionId': 'sub_ABCDEFGHIJKLMN',
      'subscriptionStatus': 'active',
      'currentPeriodStart': '2026-10-29T00:00:00.000Z',
      'currentPeriodEnd': '2027-10-29T00:00:00.000Z',
    };

Map<String, dynamic> _sosAlert(String id, {String type = 'BIKE_BREAKDOWN', String severity = 'ASSISTANCE'}) => {
      'id': id,
      'userId': 'user-2',
      'userName': _longName,
      'type': type,
      'latitude': 12.9716,
      'longitude': 77.5946,
      'city': 'Electronic City Phase 1, Bengaluru Urban',
      'status': 'ACTIVE',
      'severity': severity,
      'escalationTier': 'NEARBY_RIDERS_GENERAL',
      'currentRadiusMeters': 10000,
      'assignedHelperId': null,
      'resolvedAt': null,
      'distanceMeters': 2400,
      'createdAt': '2026-11-20T09:00:00.000Z',
    };

Map<String, dynamic> _bikeSummary(String slug, {String imageUrl = ''}) => {
      'id': 'bike-$slug',
      'slug': slug,
      'name': 'Royal Enfield Classic 350 Signals Edition (Dual-Channel ABS)',
      'brand': 'Royal Enfield',
      'category': {'name': 'Cruiser', 'slug': 'cruiser'},
      'pricePerDay': 1499,
      'city': 'Thiruvananthapuram',
      'imageUrl': imageUrl,
      'ratingAvg': 4.7,
      'ratingCount': 1284,
      'instantBooking': true,
    };

const _longMessage = 'Hey everyone! Quick update for tomorrow — we meet at the Hebbal flyover petrol pump at '
    '4:30 AM sharp, full riding gear is mandatory (no exceptions), carry your licence and RC, and please '
    'fill up your tanks tonight because the first fuel stop after Devanahalli is about 60 km away.';

Map<String, dynamic> _trip(int i) => {
      'id': 'trip-$i',
      'slug': 'trip-$i',
      'title': 'Sunrise ride to Nandi Hills via the old Bellary Road and back before breakfast',
      'imageUrl': '',
      'type': 'WEEKEND_RIDE',
      'difficulty': 'MODERATE',
      'price': 1499,
      'seatsTotal': 12,
      'seatsLeft': 3,
      'startDate': '2026-12-12T00:00:00.000Z',
      'endDate': '2026-12-13T00:00:00.000Z',
      'status': 'UPCOMING',
      'organizer': {'id': 'user-2', 'name': _longName},
      'destination': {'name': 'Nandi Hills, Chikkaballapur District, Karnataka', 'slug': 'nandi'},
    };

Map<String, dynamic> _invoice({String id = 'inv-1'}) => {
      'id': id,
      'receiptNo': 'BIKIE-2026-000001',
      'accountType': 'RIDER',
      'planName': 'Golden Subscription',
      'amount': 149,
      'currency': 'INR',
      'status': 'PAID',
      'paidAt': '2026-10-29T09:00:00.000Z',
      'membershipStartDate': '2026-10-29T00:00:00.000Z',
      'membershipEndDate': '2027-10-29T00:00:00.000Z',
      'paymentType': 'INITIAL_SUBSCRIPTION',
      'subscription': {
        'razorpaySubscriptionId': 'sub_ABCDEFGHIJKLMN',
        'status': 'active',
        'currentPeriodEnd': '2027-10-29T00:00:00.000Z',
        'nextPeriodEnd': '2028-10-29T00:00:00.000Z',
        'renewalCount': 0,
      },
    };

/// Path → JSON body. Matched longest-prefix-first so `/api/trips/mine` beats `/api/trips`.
final Map<String, Object> _routes = {
  '/api/auth/get-session': {'user': _riderUser},
  '/api/membership/plans': {'plans': [_plan(price: 149, days: 365)]},
  '/api/membership/active': {'membership': _membership(price: 149, days: 365), 'pendingSubscription': null},
  '/api/partner-membership/plans': {'plans': [_plan(price: 99, days: 30, name: 'Service Provider Membership')]},
  '/api/partner-membership/active': {'membership': _membership(price: 99, days: 30)},
  '/api/billing/history': {'invoices': [_invoice(), _invoice(id: 'inv-2')]},
  '/api/billing/invoices/': {
    'invoice': {
      ..._invoice(),
      'userId': 'user-1',
      'customerName': _longName,
      'customerPhone': '+919876543210',
      'planId': 'plan-1',
      'durationDays': 365,
      'razorpayPaymentId': 'pay_ABCDEFGHIJKLMN',
      'razorpayOrderId': null,
      'paymentId': 'pay_ABCDEFGHIJKLMN',
      'confirmationSmsSentAt': '2026-10-29T09:00:05.000Z',
      'createdAt': '2026-10-29T09:00:00.000Z',
    },
  },
  '/api/bikes/re-classic-350/reviews': {
    'reviews': [
      {
        'id': 'rev-1',
        'rating': 5,
        'comment': _longMessage,
        'createdAt': '2026-11-01T00:00:00.000Z',
        'author': {'name': _longName},
      },
    ],
  },
  '/api/bikes/re-classic-350': {
    'bike': {
      // A broken image URL on purpose: the screen must show the fallback, not an error box.
      ..._bikeSummary('re-classic-350', imageUrl: 'https://images.invalid/missing.jpg'),
      'gallery': <String>[],
      'description': _longMessage,
      'securityDeposit': 5000,
      'engineCc': 349,
      'mileageKmpl': 35,
      'hasAbs': true,
      'helmetIncluded': true,
      'deliveryAvailable': true,
    },
  },
  '/api/bikes': {
    'bikes': [_bikeSummary('re-classic-350'), _bikeSummary('re-hunter-350')],
    'total': 2,
    'page': 1,
    'pageSize': 20,
  },
  '/api/categories': {'categories': <Object>[]},
  '/api/destinations/goa': {
    'destination': {
      'id': 'dest-goa',
      'slug': 'goa',
      'name': 'North Goa Coastal Belt — Anjuna, Vagator and Morjim',
      'state': 'Goa',
      'imageUrl': '',
      'bikeCount': 2,
      'description': _longMessage,
      'bikes': [_bikeSummary('re-classic-350')],
    },
  },
  '/api/destinations': {
    'destinations': [
      {'id': 'dest-goa', 'slug': 'goa', 'name': 'North Goa Coastal Belt', 'state': 'Goa', 'imageUrl': '', 'bikeCount': 42},
    ],
  },
  '/api/conversations/c-1/messages': {
    'messages': [
      {
        'id': 'm-1',
        'conversationId': 'c-1',
        'senderId': 'user-2',
        'senderName': _longName,
        'content': _longMessage,
        'createdAt': '2026-11-24T18:00:00.000Z',
      },
      {
        'id': 'm-2',
        'conversationId': 'c-1',
        'senderId': 'user-1',
        'senderName': 'Me',
        'content': 'https://maps.google.com/?q=13.0358,77.5970&a-very-long-unbroken-link-that-must-wrap-without-overflowing',
        'createdAt': '2026-11-24T18:05:00.000Z',
      },
    ],
  },
  '/api/conversations': {
    'conversations': [
      {
        'id': 'c-1',
        'title': 'Sunrise ride to Nandi Hills via the old Bellary Road — Ride Group',
        'participants': [
          {'id': 'user-1', 'name': 'Me', 'role': 'MEMBER'},
          {'id': 'user-2', 'name': _longName, 'role': 'ORGANIZER'},
        ],
        'lastMessage': {'content': _longMessage, 'createdAt': '2026-11-24T18:00:00.000Z'},
        'unreadCount': 128,
        'createdAt': '2026-11-20T00:00:00.000Z',
        'updatedAt': '2026-11-24T18:00:00.000Z',
      },
    ],
  },
  '/api/trips/trip-1/room/announcements': {
    'announcements': [
      {
        'id': 'ann-1',
        'tripId': 'trip-1',
        'authorId': 'user-2',
        'authorName': _longName,
        'content': _longMessage,
        'createdAt': '2026-11-24T18:00:00.000Z',
      },
    ],
  },
  '/api/trips/trip-1/room/media': {'media': <Object>[]},
  '/api/trips/trip-1/room': {
    'room': {
      'tripId': 'trip-1',
      'conversationId': 'c-1',
      'role': 'ORGANIZER',
      'isLocked': false,
      'meetingPoint': 'Hebbal Flyover Indian Oil Petrol Pump, Outer Ring Road Junction, Bengaluru',
      'emergencyContacts': [
        {'name': _longName, 'phone': '+919876543210', 'relation': 'Ride marshal and first-aid volunteer'},
      ],
    },
  },
  '/api/trips/trip-1/requests/mine': {'request': null},
  '/api/trips/trip-1/requests': {'requests': <Object>[]},
  '/api/trips/trip-1': {
    'trip': {
      ..._trip(1),
      'description': 'We meet at the Hebbal flyover at 4:30 AM sharp, ride up through Devanahalli, catch the '
          'sunrise at the top and ride back down before the traffic starts. Full riding gear is mandatory.',
      'gallery': <String>[],
    },
  },
  '/api/sos/alerts/a-1/offers': {'offers': <Object>[]},
  '/api/sos/alerts/a-1': {'alert': _sosAlert('a-1'), 'timeline': <Object>[]},
  '/api/trips/mine': {
    'organized': [_trip(1)],
    'joined': [_trip(2)],
    'requested': <Object>[],
    'stats': {'ridesOrganized': 4, 'requestsSent': 12, 'requestsApproved': 9, 'ridesCancelled': 1, 'approvalRate': 75},
  },
  '/api/trips': {'trips': [_trip(1), _trip(2)], 'total': 2},
  '/api/requests/pending': {'requests': <Object>[]},
  '/api/notifications': {
    'notifications': [
      {
        'id': 'n-1',
        'type': 'SOS_ALERT',
        'title': 'Emergency assistance needed near Electronic City Phase 1',
        'body': '$_longName needs help with a flat tyre 2.4 km from you. Tap to view the request and respond.',
        'createdAt': '2026-11-20T09:00:00.000Z',
      },
    ],
    'unreadCount': 1,
  },
  '/api/sos/alerts/history': {'alerts': <Object>[]},
  '/api/sos/alerts/mine': {'alerts': <Object>[]},
  '/api/partner/sos/active': {'sessions': <Object>[]},
  '/api/partner/sos/history': {'sessions': <Object>[]},
  '/api/partner/sos/pending': {'offers': <Object>[]},
  '/api/referrals/me': {'code': 'BIKIE-VENKAT-2026', 'referrals': <Object>[], 'referredBy': null},
  '/api/wishlist': {'items': <Object>[]},
  '/api/bookings': {'bookings': <Object>[]},
  '/api/reviews/mine': {'reviews': <Object>[]},
  '/api/rider-profile': {'profile': null, 'showCompletionReminder': true},
  '/api/partner/profile': {'partner': null},
  '/api/rider-location/consent': {'enabled': true},
  '/api/rider-location/sos-opt-out': {'enabled': true},
  '/api/riders/nearby': {
    'riders': [
      {'id': 'r-1', 'name': _longName, 'distanceMeters': 1234},
      {'id': 'r-2', 'name': 'Priya', 'distanceMeters': 18950},
    ],
  },
  '/api/sos/alerts': {'alerts': [_sosAlert('a-1'), _sosAlert('a-2', type: 'ACCIDENT', severity: 'EMERGENCY')]},
  '/api/partner/sos/dashboard': {
    'stats': {'activeRequests': 12, 'todayAssistanceCount': 3, 'completedCount': 148, 'ratingAvg': 4.8, 'ratingCount': 96},
  },
  '/api/partner/sos/nearby': {
    'requests': [
      {
        'id': 'a-1',
        'type': 'BIKE_BREAKDOWN',
        'severity': 'ASSISTANCE',
        'city': 'Electronic City Phase 1, Bengaluru Urban',
        'distanceMeters': 2400,
        'createdAt': '2026-11-20T09:00:00.000Z',
      },
    ],
  },
  '/api/legal/current': {
    'documents': [
      for (final (type, title) in [
        ('TERMS_AND_CONDITIONS', 'Terms & Conditions'),
        ('PRIVACY_POLICY', 'Privacy Policy'),
        ('USER_AGREEMENT', 'User Agreement'),
      ])
        {
          'documentId': 'doc-$type',
          'type': type,
          'title': title,
          'versionId': 'v-$type',
          'version': 1,
          'content': 'Content',
          'publishedAt': '2026-09-28T00:00:00.000Z',
        },
    ],
    'versionIds': ['v-TERMS_AND_CONDITIONS', 'v-PRIVACY_POLICY', 'v-USER_AGREEMENT'],
  },
  '/api/account-type-requests': {'requests': <Object>[]},
};

/// Per-test overrides (path → body), consulted before [_routes]; cleared after every test.
final Map<String, Object> _routeOverrides = {};

/// Requests the fixtures don't know — printed once per run so gaps are visible, never fatal.
final Set<String> _unmatched = {};

class _FakeAdapter implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(RequestOptions options, Stream<Uint8List>? requestStream, Future<void>? cancelFuture) async {
    final path = options.uri.path;
    if (_routeOverrides.containsKey(path)) {
      return ResponseBody.fromString(jsonEncode(_routeOverrides[path]), 200, headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      });
    }
    final keys = _routes.keys.where(path.startsWith).toList()..sort((a, b) => b.length.compareTo(a.length));
    Object body;
    if (keys.isNotEmpty) {
      body = _routes[keys.first]!;
    } else {
      _unmatched.add('${options.method} $path');
      body = <String, Object>{};
    }
    return ResponseBody.fromString(jsonEncode(body), 200, headers: {
      Headers.contentTypeHeader: [Headers.jsonContentType],
    });
  }

  @override
  void close({bool force = false}) {}
}

class _MockAuthRepository extends Mock implements AuthRepository {}

class _MockPush extends Mock implements PushRegistrationService {}

class _MockFindability extends Mock implements RiderFindabilityService {}

class _SignedInAuthController extends AuthController {
  _SignedInAuthController(UserModel user) : super(_MockAuthRepository(), _MockPush(), _MockFindability()) {
    state = AuthState.authenticated(user);
  }
}

Dio _fakeDio() => Dio(BaseOptions(baseUrl: 'http://bikie.test'))..httpClientAdapter = _FakeAdapter();

class _ScreenCase {
  const _ScreenCase(this.name, this.builder, {this.serviceProvider = false});
  final String name;
  final Widget Function() builder;
  final bool serviceProvider;
}

final _screens = <_ScreenCase>[
  _ScreenCase('Intro', () => const IntroScreen()),
  _ScreenCase('Welcome', () => const WelcomeScreen()),
  _ScreenCase('Rider membership', () => const MembershipScreen()),
  _ScreenCase('Service Provider membership', () => const PartnerMembershipScreen(), serviceProvider: true),
  _ScreenCase('Payment history', () => const BillingHistoryScreen()),
  _ScreenCase('Receipt', () => const InvoiceDetailScreen(invoiceId: 'inv-1')),
  _ScreenCase('Rider profile', () => const ProfileScreen()),
  _ScreenCase('Service Provider profile', () => const ProfileScreen(), serviceProvider: true),
  _ScreenCase('Rides list', () => const TripsListScreen()),
  _ScreenCase('My rides', () => const MyRidesScreen()),
  _ScreenCase('Ride requests', () => const RideRequestsScreen()),
  _ScreenCase('Notifications', () => const NotificationsScreen()),
  _ScreenCase('SOS history', () => const SosHistoryScreen()),
  _ScreenCase('Bookings', () => const BookingsScreen()),
  _ScreenCase('Wishlist', () => const WishlistScreen()),
  _ScreenCase('Referrals', () => const ReferralsScreen()),
  _ScreenCase('Service Provider active', () => const PartnerActiveScreen(), serviceProvider: true),
  _ScreenCase('Service Provider history', () => const PartnerHistoryScreen(), serviceProvider: true),
  _ScreenCase('Login', () => const LoginScreen()),
  _ScreenCase('Sign up', () => const SignupScreen()),
  _ScreenCase('Home (SOS)', () => const HomeScreen()),
  _ScreenCase('SOS', () => const SosScreen()),
  _ScreenCase('Nearby riders', () => const NearbyRidersScreen()),
  _ScreenCase('Rider details form', () => const RiderOnboardingScreen()),
  _ScreenCase('Account type request', () => const AccountTypeRequestScreen()),
  _ScreenCase('Create ride', () => const CreateRideScreen()),
  _ScreenCase('Bikes', () => const BikesListScreen()),
  _ScreenCase('Destinations', () => const DestinationsListScreen()),
  _ScreenCase('Service Provider home', () => const PartnerHomeScreen(), serviceProvider: true),
  _ScreenCase('Service Provider requests', () => const PartnerRequestsScreen(), serviceProvider: true),
  _ScreenCase('Ride detail', () => const TripDetailScreen(slug: 'trip-1')),
  _ScreenCase('SOS detail', () => const SosDetailScreen(alertId: 'a-1')),
  _ScreenCase('Service Provider request detail', () => const PartnerSosRequestScreen(alertId: 'a-1'), serviceProvider: true),
  _ScreenCase('Service Provider business profile form', () => const PartnerOnboardingScreen(), serviceProvider: true),
  _ScreenCase('Service Providers map', () => const PartnersScreen()),
  _ScreenCase('Splash', () => const SplashScreen()),
  _ScreenCase('Bike detail (broken image)', () => const BikeDetailScreen(slug: 're-classic-350')),
  _ScreenCase('Destination detail', () => const DestinationDetailScreen(slug: 'goa')),
  _ScreenCase('Conversations', () => const ConversationsListScreen()),
  _ScreenCase('Chat thread (long messages)', () => const ConversationThreadScreen(conversationId: 'c-1')),
  _ScreenCase('Ride Room', () => const RideRoomScreen(slug: 'trip-1')),
];

Future<void> _pump(WidgetTester tester, _ScreenCase screen, Size size, double textScale, {double keyboardInset = 0}) async {
  tester.view.physicalSize = size;
  if (keyboardInset > 0) tester.view.viewInsets = FakeViewPadding(bottom: keyboardInset);
  tester.view.devicePixelRatio = 1;
  tester.platformDispatcher.textScaleFactorTestValue = textScale;
  addTearDown(tester.view.reset);
  addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);

  final user = UserModel.fromJson(screen.serviceProvider ? _spUser : _riderUser);
  final prefs = await SharedPreferences.getInstance();
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        appPreferencesProvider.overrideWithValue(AppPreferences(prefs)),
        dioProvider.overrideWithValue(_fakeDio()),
        authControllerProvider.overrideWith((ref) => _SignedInAuthController(user)),
      ],
      child: MaterialApp(
        theme: AppTheme.dark,
        builder: (context, child) => ResponsiveFrame(child: child!),
        home: screen.builder(),
      ),
    ),
  );
  // Bounded pumps instead of pumpAndSettle(): several screens show indefinitely-animating
  // progress indicators by design (pending-payment polling, location lookups).
  for (var i = 0; i < 6; i++) {
    await tester.pump(const Duration(milliseconds: 200));
  }
}

void main() {
  setUpAll(() {
    SharedPreferences.setMockInitialValues({});
  });

  tearDownAll(() {
    if (_unmatched.isNotEmpty) {
      // ignore: avoid_print
      print('[responsive] endpoints without fixtures (served {}): ${_unmatched.join(', ')}');
    }
  });

  for (final screen in _screens) {
    group(screen.name, () {
      for (final size in _sizes.entries) {
        for (final scale in _textScales) {
          testWidgets('lays out at ${size.key}, text x$scale', (tester) async {
            await _pump(tester, screen, size.value, scale);
            expect(tester.takeException(), isNull);
            await tester.pumpWidget(const SizedBox());
          });
        }
      }
    });
  }

  group('with the on-screen keyboard open', () {
    // Forms must stay usable (resize + scroll) when the keyboard takes ~40% of a small phone.
    final forms = _screens.where((c) => const {
          'Login',
          'Sign up',
          'Rider details form',
          'Service Provider business profile form',
          'Create ride',
          'Chat thread (long messages)',
          'Account type request',
        }.contains(c.name));
    for (final screen in forms) {
      for (final size in const [Size(320, 640), Size(360, 760)]) {
        for (final scale in const [1.0, 1.3]) {
          testWidgets('${screen.name} at ${size.width.toInt()}px, text x$scale', (tester) async {
            await _pump(tester, screen, size, scale, keyboardInset: size.height * 0.4);
            expect(tester.takeException(), isNull);
            await tester.pumpWidget(const SizedBox());
          });
        }
      }
    }
  });

  group('dialogs and bottom sheets at 320px with 2× text', () {
    const small = Size(320, 640);
    _ScreenCase named(String name) => _screens.firstWhere((c) => c.name == name);

    tearDown(_routeOverrides.clear);

    testWidgets('"Set up AutoPay" dialog', (tester) async {
      _routeOverrides['/api/membership/active'] = {'membership': null, 'pendingSubscription': null};
      await _pump(tester, named('Rider membership'), small, 2.0);
      final start = find.text('Start Yearly Membership — ₹149/year');
      await tester.ensureVisible(start);
      await tester.pump(const Duration(milliseconds: 100));
      await tester.tap(start);
      for (var i = 0; i < 4; i++) {
        await tester.pump(const Duration(milliseconds: 150));
      }
      expect(find.text('Set up AutoPay'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('"Cancel auto-renewal?" dialog', (tester) async {
      await _pump(tester, named('Rider membership'), small, 2.0);
      final cancel = find.text('Cancel Auto-Renewal');
      await tester.ensureVisible(cancel);
      await tester.pump(const Duration(milliseconds: 100));
      await tester.tap(cancel);
      for (var i = 0; i < 4; i++) {
        await tester.pump(const Duration(milliseconds: 150));
      }
      expect(find.text('Cancel auto-renewal?'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('booking bottom sheet', (tester) async {
      await _pump(tester, named('Bike detail (broken image)'), small, 2.0);
      final book = find.text('Book instantly');
      await tester.ensureVisible(book);
      await tester.pump(const Duration(milliseconds: 100));
      await tester.tap(book);
      for (var i = 0; i < 4; i++) {
        await tester.pump(const Duration(milliseconds: 150));
      }
      expect(find.textContaining('Book Royal Enfield'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('legal document sheet from sign-up', (tester) async {
      await _pump(tester, named('Sign up'), small, 2.0);
      final terms = find.text('Terms & Conditions');
      await tester.ensureVisible(terms.first);
      await tester.pump(const Duration(milliseconds: 100));
      await tester.tap(terms.first);
      for (var i = 0; i < 4; i++) {
        await tester.pump(const Duration(milliseconds: 150));
      }
      expect(find.byTooltip('Close'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
    });
  });
}
