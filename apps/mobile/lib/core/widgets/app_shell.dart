import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show SystemNavigator;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/domain/auth_controller.dart';
import '../../features/auth/domain/role_provider.dart';
import '../../features/partner_dashboard/presentation/widgets/partner_availability_banner.dart';
import 'notification_permission_prompt.dart';
import 'rider_findability_gate.dart';

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
    final accountType = ref.watch(authControllerProvider.select((s) => s.user?.accountType));
    final isPartner = isServiceProviderAccountType(accountType);
    final tabs = isPartner ? partnerTabs : riderTabs;
    final destinations = isPartner ? _partnerDestinations : _riderDestinations;

    final location = GoRouterState.of(context).matchedLocation;
    final currentIndex = indexForTab(tabs, location);

    return NotificationPermissionGate(
      child: RiderFindabilityGate(
        child: PopScope(
          // Every tab switch uses `context.go`, which *replaces* the shell's single route rather
          // than pushing a new one (see `onDestinationSelected` below) — so there's never
          // anything for the system back button to pop within the shell itself; `canPop: false`
          // makes that explicit instead of accidentally relying on the Navigator happening to be
          // empty. Screens pushed on top of the shell (`/bikes/:slug`, `/trips/:slug`, …) are
          // separate top-level routes outside this ShellRoute, so they already pop normally and
          // never reach this handler at all.
          canPop: false,
          onPopInvokedWithResult: (didPop, result) => _handleBackPress(context, currentIndex),
          child: Scaffold(
            body: SafeArea(
              top: true,
              bottom: false,
              child: Column(
                children: [
                  if (isPartner) const PartnerAvailabilityBanner(),
                  Expanded(child: child),
                ],
              ),
            ),
            bottomNavigationBar: NavigationBar(
              selectedIndex: currentIndex,
              onDestinationSelected: (index) => context.go(tabs[index]),
              destinations: destinations,
            ),
          ),
        ),
      ),
    );
  }

  /// Not on the Home tab: back returns to Home first, matching standard Android back behavior,
  /// rather than exiting from wherever the Rider/Service Provider happens to be. Already on Home:
  /// back must ask before actually leaving the app — nothing should close BIKIE on a stray tap.
  Future<void> _handleBackPress(BuildContext context, int currentTabIndex) async {
    if (currentTabIndex != 0) {
      context.go('/');
      return;
    }
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Exit BIKIE?'),
        content: const Text('Are you sure you want to exit the app?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Exit')),
        ],
      ),
    );
    if (confirmed == true) SystemNavigator.pop();
  }
}
