import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/home/presentation/widgets/rider_findability_banner.dart';
import 'package:mobile/features/membership/data/membership_model.dart';
import 'package:mobile/features/membership/domain/membership_providers.dart';
import 'package:mobile/features/nearby_riders/domain/nearby_riders_providers.dart';
import 'package:mobile/features/nearby_riders/domain/rider_findability_service.dart';
import 'package:mobile/features/nearby_riders/domain/rider_location_permission.dart';
import 'package:mocktail/mocktail.dart';

class _MockFindability extends Mock implements RiderFindabilityService {}

UserMembership _membership() => UserMembership.fromJson({
      'id': 'um-1',
      'userId': 'user-1',
      'planId': 'plan-1',
      'plan': {
        'id': 'plan-1',
        'name': 'Golden Subscription',
        'description': 'BIKIE Rider Yearly Membership',
        'price': 149,
        'durationDays': 365,
        'benefits': <String>[],
        'isActive': true,
      },
      'startDate': '2026-10-29T00:00:00.000Z',
      'endDate': '2027-10-29T00:00:00.000Z',
      'status': 'ACTIVE',
      'daysLeft': 365,
    });

void main() {
  late _MockFindability findability;

  setUp(() {
    findability = _MockFindability();
  });

  Future<void> pumpBanner(
    WidgetTester tester, {
    required AsyncValue<UserMembership?> membership,
    required AsyncValue<bool> sharing,
    AsyncValue<RiderLocationPermissionState> permission = const AsyncValue.data(RiderLocationPermissionState.granted),
  }) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          riderFindabilityServiceProvider.overrideWithValue(findability),
          activeMembershipProvider.overrideWith((ref) => Future.value(membership.valueOrNull)),
          sharingEnabledProvider.overrideWith((ref) => Future.value(sharing.valueOrNull ?? false)),
          riderLocationPermissionStateProvider.overrideWith((ref) => Future.value(permission.valueOrNull)),
        ],
        child: const MaterialApp(home: Scaffold(body: RiderFindabilityBanner())),
      ),
    );
  }

  testWidgets('no active membership shows the locked state, never a Switch', (tester) async {
    await pumpBanner(
      tester,
      membership: const AsyncValue.data(null),
      sharing: const AsyncValue.data(false),
    );
    await tester.pump();

    expect(find.text('NOT FINDABLE'), findsOneWidget);
    expect(find.text('Activate ₹149/year membership to be findable'), findsOneWidget);
    expect(find.byType(Switch), findsNothing);
  });

  testWidgets('active membership + sharing on shows FINDABLE with a Switch', (tester) async {
    await pumpBanner(
      tester,
      membership: AsyncValue.data(_membership()),
      sharing: const AsyncValue.data(true),
    );
    await tester.pump();
    await tester.pump();

    expect(find.text('FINDABLE'), findsOneWidget);
    final switchWidget = tester.widget<Switch>(find.byType(Switch));
    expect(switchWidget.value, isTrue);
  });

  testWidgets('active membership + sharing off shows NOT FINDABLE with a Switch', (tester) async {
    await pumpBanner(
      tester,
      membership: AsyncValue.data(_membership()),
      sharing: const AsyncValue.data(false),
    );
    await tester.pump();
    await tester.pump();

    expect(find.text('NOT FINDABLE'), findsOneWidget);
    final switchWidget = tester.widget<Switch>(find.byType(Switch));
    expect(switchWidget.value, isFalse);
  });
}
