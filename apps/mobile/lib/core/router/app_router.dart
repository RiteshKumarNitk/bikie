import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/domain/auth_controller.dart';
import '../../features/auth/domain/auth_state.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/signup_screen.dart';
import '../../features/bikes/presentation/bike_detail_screen.dart';
import '../../features/bikes/presentation/bikes_list_screen.dart';
import '../../features/bookings/presentation/bookings_screen.dart';
import '../../features/destinations/presentation/destination_detail_screen.dart';
import '../../features/destinations/presentation/destinations_list_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/membership/presentation/membership_screen.dart';
import '../../features/messaging/presentation/conversation_thread_screen.dart';
import '../../features/messaging/presentation/conversations_list_screen.dart';
import '../../features/nearby_riders/presentation/nearby_riders_screen.dart';
import '../../features/notifications/presentation/notifications_screen.dart';
import '../../features/onboarding/presentation/intro_screen.dart';
import '../../features/onboarding/presentation/welcome_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/referrals/presentation/referrals_screen.dart';
import '../../features/ride_room/presentation/ride_room_screen.dart';
import '../../features/sos/presentation/sos_detail_screen.dart';
import '../../features/sos/presentation/sos_history_screen.dart';
import '../../features/sos/presentation/sos_screen.dart';
import '../../features/trips/presentation/create_ride_screen.dart';
import '../../features/trips/presentation/my_rides_screen.dart';
import '../../features/trips/presentation/ride_requests_screen.dart';
import '../../features/trips/presentation/trip_detail_screen.dart';
import '../../features/trips/presentation/trips_list_screen.dart';
import '../../features/wishlist/presentation/wishlist_screen.dart';
import '../providers.dart';
import '../widgets/app_shell.dart';

/// The only screens a logged-out visitor can reach — every other route
/// requires a session. This is a deliberate mobile-only posture (the web
/// allows anonymous marketing browsing) per explicit product direction: the
/// app should walk a logged-out visitor through Intro → Welcome → Login/OTP
/// before anything else, not offer a free-browse path around it.
const _preAuthPaths = {'/intro', '/welcome', '/login', '/signup'};

final routerProvider = Provider<GoRouter>((ref) {
  final authStatus = ref.watch(authControllerProvider.select((s) => s.status));
  final hasSeenIntro = ref.watch(hasSeenIntroProvider);

  final String initialLocation;
  if (authStatus == AuthStatus.authenticated) {
    initialLocation = '/';
  } else {
    initialLocation = hasSeenIntro ? '/welcome' : '/intro';
  }

  return GoRouter(
    initialLocation: initialLocation,
    redirect: (context, state) {
      if (authStatus == AuthStatus.unknown) return null;

      final path = state.matchedLocation;
      final isAuthenticated = authStatus == AuthStatus.authenticated;
      final isPreAuthPath = _preAuthPaths.contains(path);

      if (!isAuthenticated && !isPreAuthPath) {
        return hasSeenIntro ? '/welcome' : '/intro';
      }
      if (isAuthenticated && isPreAuthPath) {
        return '/';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/intro', builder: (context, state) => const IntroScreen()),
      GoRoute(path: '/welcome', builder: (context, state) => const WelcomeScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (context, state) => const SignupScreen()),
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
          GoRoute(path: '/trips', builder: (context, state) => const TripsListScreen()),
          GoRoute(path: '/bikes', builder: (context, state) => const BikesListScreen()),
          GoRoute(path: '/bookings', builder: (context, state) => const BookingsScreen()),
          GoRoute(path: '/profile', builder: (context, state) => const ProfileScreen()),
        ],
      ),
      GoRoute(
        path: '/bikes/:slug',
        builder: (context, state) => BikeDetailScreen(slug: state.pathParameters['slug']!),
      ),
      GoRoute(path: '/destinations', builder: (context, state) => const DestinationsListScreen()),
      GoRoute(
        path: '/destinations/:slug',
        builder: (context, state) => DestinationDetailScreen(slug: state.pathParameters['slug']!),
      ),
      GoRoute(path: '/trips/create', builder: (context, state) => const CreateRideScreen()),
      GoRoute(
        path: '/trips/:slug',
        builder: (context, state) => TripDetailScreen(slug: state.pathParameters['slug']!),
      ),
      GoRoute(
        path: '/trips/:slug/room',
        builder: (context, state) => RideRoomScreen(slug: state.pathParameters['slug']!),
      ),
      GoRoute(path: '/rides/mine', builder: (context, state) => const MyRidesScreen()),
      GoRoute(path: '/notifications', builder: (context, state) => const NotificationsScreen()),
      GoRoute(path: '/requests', builder: (context, state) => const RideRequestsScreen()),
      GoRoute(path: '/wishlist', builder: (context, state) => const WishlistScreen()),
      GoRoute(path: '/sos', builder: (context, state) => const SosScreen()),
      GoRoute(path: '/sos/nearby-riders', builder: (context, state) => const NearbyRidersScreen()),
      GoRoute(path: '/sos/history', builder: (context, state) => const SosHistoryScreen()),
      GoRoute(
        path: '/sos/:id',
        builder: (context, state) => SosDetailScreen(alertId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/membership', builder: (context, state) => const MembershipScreen()),
      GoRoute(path: '/referrals', builder: (context, state) => const ReferralsScreen()),
      GoRoute(path: '/messages', builder: (context, state) => const ConversationsListScreen()),
      GoRoute(
        path: '/messages/:id',
        builder: (context, state) => ConversationThreadScreen(conversationId: state.pathParameters['id']!),
      ),
    ],
  );
});
