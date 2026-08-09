import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/domain/auth_controller.dart';
import '../../features/partner_dashboard/presentation/widgets/partner_availability_banner.dart';

/// Which bottom-nav tab a given `matchedLocation` selects — pure, so ADR-044's role-based tab
/// sets are unit-testable without pumping the widget tree. Exact-matches `/` (never treats a
/// sibling route as a `/` match); every other tab matches on prefix so nested routes like
/// `/sos/:id` still highlight the tab they're conceptually under (not applicable to `/sos/:id`
/// itself today, but keeps the same rule `HomeScreen`'s original `_indexForLocation` had).
int indexForTab(List<String> tabs, String location) {
  final index = tabs.indexWhere((t) => location == t || (t != '/' && location.startsWith(t)));
  return index == -1 ? 0 : index;
}

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  static const riderTabs = ['/', '/trips', '/bikes', '/bookings', '/profile'];
  // ADR-044: Home/Requests/Active/Messages/Profile — a partner has no rides/bikes/bookings of
  // their own, so those renter tabs are replaced rather than appended to.
  static const partnerTabs = ['/', '/partner/requests', '/partner/active', '/messages', '/profile'];

  static const _riderDestinations = [
    NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
    NavigationDestination(icon: Icon(Icons.route_outlined), selectedIcon: Icon(Icons.route), label: 'Rides'),
    NavigationDestination(icon: Icon(Icons.two_wheeler_outlined), selectedIcon: Icon(Icons.two_wheeler), label: 'Bikes'),
    NavigationDestination(icon: Icon(Icons.event_note_outlined), selectedIcon: Icon(Icons.event_note), label: 'Bookings'),
    NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
  ];

  static const _partnerDestinations = [
    NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
    NavigationDestination(icon: Icon(Icons.list_alt_outlined), selectedIcon: Icon(Icons.list_alt), label: 'Requests'),
    NavigationDestination(icon: Icon(Icons.sos_outlined), selectedIcon: Icon(Icons.sos), label: 'Active'),
    NavigationDestination(icon: Icon(Icons.chat_outlined), selectedIcon: Icon(Icons.chat), label: 'Messages'),
    NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isPartner = ref.watch(authControllerProvider.select((s) => s.user?.role == 'PARTNER'));
    final tabs = isPartner ? partnerTabs : riderTabs;
    final destinations = isPartner ? _partnerDestinations : _riderDestinations;

    final location = GoRouterState.of(context).matchedLocation;
    final currentIndex = indexForTab(tabs, location);

    return Scaffold(
      body: Column(
        children: [
          if (isPartner) const PartnerAvailabilityBanner(),
          Expanded(child: child),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) => context.go(tabs[index]),
        destinations: destinations,
      ),
    );
  }
}
