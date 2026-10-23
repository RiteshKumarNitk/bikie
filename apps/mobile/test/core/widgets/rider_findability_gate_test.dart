import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/widgets/rider_findability_gate.dart';
import 'package:mobile/features/nearby_riders/domain/rider_findability_service.dart';
import 'package:mobile/features/nearby_riders/domain/rider_location_permission.dart';
import 'package:mocktail/mocktail.dart';

class _MockFindability extends Mock implements RiderFindabilityService {}

class _MockPermissionService extends Mock implements RiderLocationPermissionService {}

void main() {
  late _MockFindability findability;
  late _MockPermissionService permissionService;

  setUp(() {
    findability = _MockFindability();
    when(() => findability.restore()).thenAnswer((_) async {});
    permissionService = _MockPermissionService();
    when(() => permissionService.check()).thenAnswer((_) async => RiderLocationPermissionState.granted);
  });

  Future<void> pumpGate(WidgetTester tester) async {
    await tester.pumpWidget(ProviderScope(
      overrides: [
        riderFindabilityServiceProvider.overrideWithValue(findability),
        riderLocationPermissionServiceProvider.overrideWithValue(permissionService),
      ],
      child: const MaterialApp(
        home: RiderFindabilityGate(child: Scaffold(body: Text('home'))),
      ),
    ));
    await tester.pumpAndSettle();
  }

  testWidgets('restores on first mount — picking up a persisted-true account without any prompt', (tester) async {
    await pumpGate(tester);
    verify(() => findability.restore()).called(1);
  });

  testWidgets(
    'restores again on resume — covers backgrounding, being swiped from recent apps, and reopening',
    (tester) async {
      await pumpGate(tester);
      verify(() => findability.restore()).called(1);

      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);
      await tester.pump();
      // Pausing alone must never trigger a restore/reset — only coming back does.
      verifyNever(() => findability.restore());

      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
      await tester.pump();

      verify(() => findability.restore()).called(1);
    },
  );
}
