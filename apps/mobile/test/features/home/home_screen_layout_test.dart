import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/widgets/responsive_frame.dart';
import 'package:mobile/features/home/presentation/home_screen.dart';
import 'package:mobile/features/nearby_riders/domain/nearby_riders_providers.dart';
import 'package:mobile/features/sos/data/sos_model.dart';
import 'package:mobile/features/sos/domain/sos_providers.dart';

/// Layout-only checks: any RenderFlex overflow is reported as a test failure, so pumping the
/// SOS Home and the SOS sheet across screen sizes and font scales guards against regressions
/// that `flutter analyze` and the repository tests can't see.
const _sizes = {
  'small phone': Size(320, 568),
  'large phone': Size(412, 915),
  'landscape phone': Size(780, 360),
  'tablet': Size(1024, 1366),
};

final _activeAlert = SOSAlert.fromJson(const {
  'id': 'alert-1',
  'userId': 'user-1',
  'userName': 'Rider One',
  'type': 'BIKE_BREAKDOWN',
  'latitude': 12.9716,
  'longitude': 77.5946,
  'city': 'Bengaluru',
  'status': 'ACTIVE',
  'severity': 'ASSISTANCE',
  'escalationTier': 'NEARBY_RIDERS_GENERAL',
  'currentRadiusMeters': 5000,
  'assignedHelperId': null,
  'resolvedAt': null,
  'createdAt': '2026-07-14T00:00:00.000Z',
});

Future<void> _pumpHome(WidgetTester tester, {required Size size, double textScale = 1, bool withAlert = false}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  tester.platformDispatcher.textScaleFactorTestValue = textScale;
  addTearDown(tester.view.reset);
  addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        mySosAlertsProvider.overrideWith((ref) async => withAlert ? [_activeAlert] : const <SOSAlert>[]),
        sharingEnabledProvider.overrideWith((ref) async => false),
      ],
      child: MaterialApp(
        theme: AppTheme.dark,
        builder: (context, child) => ResponsiveFrame(child: child!),
        home: const HomeScreen(),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  for (final entry in _sizes.entries) {
    for (final textScale in [1.0, 2.0]) {
      testWidgets('Home lays out without overflow — ${entry.key}, text x$textScale', (tester) async {
        await _pumpHome(tester, size: entry.value, textScale: textScale, withAlert: true);

        expect(find.text('SOS'), findsOneWidget);
        expect(find.text('Your SOS alert is active'), findsOneWidget);
        expect(find.text('Be findable in an emergency'), findsOneWidget);
        expect(tester.takeException(), isNull);
      });

      testWidgets('SOS sheet lays out without overflow — ${entry.key}, text x$textScale', (tester) async {
        await _pumpHome(tester, size: entry.value, textScale: textScale);

        await tester.tap(find.bySemanticsLabel('Send SOS alert'));
        await tester.pumpAndSettle();
        expect(find.text('Send SOS alert'), findsOneWidget);

        // Amber is the tallest confirm step (category picker + city fallback + actions). On
        // short screens it sits below the fold — the sheet scrolls rather than overflowing.
        final amber = find.text('Amber Alert — Assistance');
        await tester.ensureVisible(amber);
        await tester.pumpAndSettle();
        await tester.tap(amber);
        await tester.pumpAndSettle();
        final send = find.text('Send Amber Alert');
        await tester.ensureVisible(send);
        expect(send, findsOneWidget);
        expect(tester.takeException(), isNull);
      });
    }
  }

  testWidgets('Home drops the marketplace feed — SOS is the only primary action', (tester) async {
    await _pumpHome(tester, size: const Size(412, 915));

    expect(find.text('Featured bikes'), findsNothing);
    expect(find.text('Popular destinations'), findsNothing);
    expect(find.text('What riders say'), findsNothing);
    expect(find.byTooltip('SOS history'), findsOneWidget);
    expect(find.byTooltip('Nearby SOS alerts'), findsOneWidget);
  });

  testWidgets('ResponsiveFrame caps content width on wide screens', (tester) async {
    await _pumpHome(tester, size: const Size(1366, 1024));

    expect(tester.getSize(find.byType(HomeScreen)).width, kMaxContentWidth);
  });
}
