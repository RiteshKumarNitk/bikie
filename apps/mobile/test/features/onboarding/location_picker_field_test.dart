import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/features/onboarding/presentation/location_picker_field.dart';

const _gps = LatLng(15.4909, 73.8278); // Panaji
const _saved = LatLng(26.9124, 75.7873); // Jaipur

Future<void> _pump(WidgetTester tester, Widget picker) async {
  // Wider than a phone only because the test font renders every glyph as a full square, which
  // makes flutter_map's own (unchanged) OSM attribution row overflow a phone width in tests.
  tester.view.physicalSize = const Size(800, 1000);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(MaterialApp(
    theme: AppTheme.dark,
    home: Scaffold(body: SingleChildScrollView(padding: const EdgeInsets.all(16), child: picker)),
  ));
  await tester.pumpAndSettle();
}

// `ElevatedButton.icon` builds a private subclass, so match by `is`, not exact type.
ElevatedButton _confirmButton(WidgetTester tester) => tester.widget<ElevatedButton>(
      find.ancestor(of: find.text('Confirm location'), matching: find.byWidgetPredicate((w) => w is ElevatedButton)),
    );

void main() {
  group('confirm mode — new Service Provider (no saved location)', () {
    testWidgets('auto-locates on open and centres there; nothing is selected until Confirm', (tester) async {
      var locateCalls = 0;
      final confirmed = <LatLng>[];
      await _pump(
        tester,
        LocationPickerField(
          value: null,
          confirmMode: true,
          autoLocate: true,
          locateUser: () async {
            locateCalls++;
            return _gps;
          },
          onChanged: confirmed.add,
        ),
      );

      expect(locateCalls, 1);
      expect(confirmed, isEmpty, reason: 'moving the map to GPS must not count as a selection');

      await tester.tap(find.text('Confirm location'));
      await tester.pump();

      expect(confirmed, [_gps]);
      expect(find.textContaining('Location confirmed'), findsOneWidget);
    });

    testWidgets('GPS denied: shows the manual-selection message and does not allow confirming the placeholder', (tester) async {
      final confirmed = <LatLng>[];
      await _pump(
        tester,
        LocationPickerField(
          value: null,
          confirmMode: true,
          autoLocate: true,
          locateUser: () async => null,
          onChanged: confirmed.add,
        ),
      );

      expect(
        find.text("We couldn't access your current location. Please move the map and select your service location manually."),
        findsOneWidget,
      );
      expect(_confirmButton(tester).onPressed, isNull);

      // Manual selection still works: moving the map makes the centre a real candidate.
      await tester.drag(find.byType(FlutterMap), const Offset(-120, 40));
      await tester.pumpAndSettle();
      expect(_confirmButton(tester).onPressed, isNotNull);
      await tester.tap(find.text('Confirm location'));
      await tester.pump();
      expect(confirmed, hasLength(1));
    });

    testWidgets('GPS denied with a typed city: opens near the city but still requires the user to choose', (tester) async {
      const cityCentre = LatLng(12.9716, 77.5946);
      final confirmed = <LatLng>[];
      await _pump(
        tester,
        LocationPickerField(
          value: null,
          confirmMode: true,
          autoLocate: true,
          locateUser: () async => null,
          resolveFallbackCenter: () async => cityCentre,
          onChanged: confirmed.add,
        ),
      );

      expect(_confirmButton(tester).onPressed, isNull, reason: 'a city centre is only a starting view');
      await tester.drag(find.byType(FlutterMap), const Offset(40, 0));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Confirm location'));
      await tester.pump();
      // Selected near the city (a 40px drag at zoom 12 is ~1.5 km), not near the centre of India.
      expect(const Distance().as(LengthUnit.Kilometer, confirmed.single, cityCentre), lessThan(5));
    });

    testWidgets('moving the map changes the selection; "Use current location" re-centres', (tester) async {
      final confirmed = <LatLng>[];
      await _pump(
        tester,
        LocationPickerField(
          value: null,
          confirmMode: true,
          autoLocate: true,
          locateUser: () async => _gps,
          onChanged: confirmed.add,
        ),
      );

      await tester.drag(find.byType(FlutterMap), const Offset(-150, 0));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Confirm location'));
      await tester.pump();
      expect(confirmed.last.longitude, greaterThan(_gps.longitude), reason: 'dragging left moves the centre east');

      await tester.tap(find.text('Use current location'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Confirm location'));
      await tester.pump();
      expect(confirmed.last, _gps);
    });
  });

  group('confirm mode — existing Service Provider (saved location)', () {
    testWidgets('opens on the saved location without requesting GPS', (tester) async {
      var locateCalls = 0;
      final confirmed = <LatLng>[];
      await _pump(
        tester,
        LocationPickerField(
          value: _saved,
          confirmMode: true,
          autoLocate: true,
          locateUser: () async {
            locateCalls++;
            return _gps;
          },
          onChanged: confirmed.add,
        ),
      );

      expect(locateCalls, 0, reason: 'a saved location must never be silently replaced by GPS');
      expect(find.textContaining('Location confirmed (26.91240, 75.78730)'), findsOneWidget);
      expect(_confirmButton(tester).onPressed, isNull, reason: 'nothing changed yet');
      expect(confirmed, isEmpty);
    });

    testWidgets('manual adjustment is reported as unconfirmed until Confirm', (tester) async {
      final unconfirmedEvents = <bool>[];
      final confirmed = <LatLng>[];
      await _pump(
        tester,
        LocationPickerField(
          value: _saved,
          confirmMode: true,
          autoLocate: true,
          locateUser: () async => _gps,
          onUnconfirmedChange: unconfirmedEvents.add,
          onChanged: confirmed.add,
        ),
      );

      await tester.drag(find.byType(FlutterMap), const Offset(0, 80));
      await tester.pumpAndSettle();
      expect(unconfirmedEvents.last, isTrue);
      expect(confirmed, isEmpty);

      await tester.tap(find.text('Confirm location'));
      await tester.pumpAndSettle();
      expect(confirmed.single.latitude, greaterThan(_saved.latitude), reason: 'dragging down moves the centre north');
      expect(unconfirmedEvents.last, isFalse);
    });
  });

  group('default tap-to-place mode (ride meeting point) — unchanged', () {
    testWidgets('tapping reports the location immediately, with no GPS and no confirm step', (tester) async {
      final changes = <LatLng>[];
      await _pump(tester, LocationPickerField(value: null, onChanged: changes.add));

      expect(find.text('Confirm location'), findsNothing);
      expect(find.text('Use current location'), findsNothing);
      expect(find.text("Tap anywhere on the map to drop a pin at your shop's location."), findsOneWidget);

      await tester.tap(find.byType(FlutterMap));
      // flutter_map reports a tap only once the double-tap (zoom) window has passed.
      await tester.pumpAndSettle(const Duration(milliseconds: 100));
      await tester.pump(const Duration(milliseconds: 500));

      expect(changes, hasLength(1));
      expect(find.textContaining('Pin set at'), findsOneWidget);
    });
  });
}
