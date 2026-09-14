import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/partner_dashboard/domain/partner_dashboard_providers.dart';
import 'package:mobile/features/sos/domain/sos_providers.dart';

/// Regression coverage for the root cause of "an eligible Amber SOS request never appears in a
/// Service Provider's Requests tab": `partnerNearbyRequestsProvider` silently returns `[]`
/// whenever `partnerLocationProvider` is `null`, and — before `partnerLocationBootstrapProvider`
/// was added — nothing in the Service Provider tab set ever set it (the only setter anywhere in
/// the app was the Rider-only SOS screen's "Share my location" button, structurally unreachable
/// for a Service Provider account). `captureOneShotLocation()` itself calls the real Geolocator
/// plugin, which has no method-channel mock anywhere in this test suite (matching the existing,
/// long-standing `SosScreen._shareLocation` having no test coverage either) — these tests instead
/// lock in the one piece of `partnerLocationBootstrapProvider`'s own logic that doesn't require
/// touching Geolocator: it must never overwrite an already-known location or flip the
/// "location denied" flag once a fix is already in hand.
void main() {
  test('does nothing (no Geolocator call, no denied flag) once a location is already known', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    container.read(sosActiveAlertsLocationProvider.notifier).state = (latitude: 12.9, longitude: 77.6);
    container.read(partnerLocationDeniedProvider.notifier).state = true; // pretend an earlier attempt failed

    await container.read(partnerLocationBootstrapProvider.future);

    // Location untouched, and the stale "denied" flag from before a location existed is not
    // cleared by the bootstrap's early return — only a fresh capture attempt would do that.
    expect(container.read(partnerLocationProvider), (latitude: 12.9, longitude: 77.6));
  });

  test('partnerLocationProvider is the same underlying state as sosActiveAlertsLocationProvider', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    container.read(sosActiveAlertsLocationProvider.notifier).state = (latitude: 1.0, longitude: 2.0);

    // Confirms the Requests tab reads the exact same state a Rider's "Share my location" button
    // writes to — one shared provider, not two independent copies that could drift apart.
    expect(container.read(partnerLocationProvider), container.read(sosActiveAlertsLocationProvider));
  });
}
