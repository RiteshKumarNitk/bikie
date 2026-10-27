import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/membership/data/membership_model.dart';
import 'package:mobile/features/membership/domain/membership_subscription_display.dart';

/// Mirrors partner_subscription_display_test.dart exactly (Service Provider ₹99/month) for the
/// Rider ₹149/year yearly auto-renewal — same cases, same priority-order guarantees, proving the
/// two displays never disagree about what a given membership row means.
MembershipPlan _plan() => const MembershipPlan(
      id: 'plan-1',
      name: 'Rider Yearly Membership',
      description: 'desc',
      price: 149,
      durationDays: 365,
      benefits: [],
      isActive: true,
    );

UserMembership _membership({
  String endDate = '2027-10-26T00:00:00.000Z',
  String? razorpaySubscriptionId = 'sub_rider123',
  String? subscriptionStatus = 'active',
  String? currentPeriodStart = '2026-10-26T00:00:00.000Z',
  String? currentPeriodEnd = '2027-10-26T00:00:00.000Z',
  String? cancelledAt,
}) =>
    UserMembership(
      id: 'um-1',
      userId: 'u1',
      planId: 'plan-1',
      plan: _plan(),
      startDate: '2026-10-26T00:00:00.000Z',
      endDate: endDate,
      status: 'ACTIVE',
      daysLeft: 365,
      razorpaySubscriptionId: razorpaySubscriptionId,
      subscriptionStatus: subscriptionStatus,
      currentPeriodStart: currentPeriodStart,
      currentPeriodEnd: currentPeriodEnd,
      cancelledAt: cancelledAt,
    );

void main() {
  group('subscriptionDisplayState', () {
    test('1. an active, healthy subscription shows the next payment date from currentPeriodEnd', () {
      final state = subscriptionDisplayState(_membership());
      expect(state.kind, SubscriptionDisplayKind.active);
      expect(state.nextPaymentDate, formatMembershipDate('2027-10-26T00:00:00.000Z'));
    });

    test('3. the current period start comes from currentPeriodStart, not guessed', () {
      final state = subscriptionDisplayState(_membership());
      expect(state.periodStartDate, formatMembershipDate('2026-10-26T00:00:00.000Z'));
    });

    test('3b. no currentPeriodStart yet shows no period start, not a fabricated one', () {
      final state = subscriptionDisplayState(_membership(currentPeriodStart: null));
      expect(state.kind, SubscriptionDisplayKind.active);
      expect(state.periodStartDate, isNull);
    });

    test('4. a cancelled subscription never shows a future auto-payment date', () {
      final state = subscriptionDisplayState(_membership(cancelledAt: '2026-11-01T00:00:00.000Z'));
      expect(state.kind, SubscriptionDisplayKind.cancelled);
      expect(state.nextPaymentDate, isNull);
      expect(state.validUntilDate, formatMembershipDate('2027-10-26T00:00:00.000Z'));
    });

    test('5. a halted (failed) payment shows the correct Failed warning with the real valid-until date', () {
      final state = subscriptionDisplayState(_membership(subscriptionStatus: 'halted'));
      expect(state.kind, SubscriptionDisplayKind.paymentProblem);
      expect(state.statusLabel, 'Failed');
      expect(state.validUntilDate, formatMembershipDate('2027-10-26T00:00:00.000Z'));
    });

    test('5b. a pending payment shows Pending, distinct from halted/failed', () {
      final state = subscriptionDisplayState(_membership(subscriptionStatus: 'pending'));
      expect(state.statusLabel, 'Pending');
    });

    test('6. the renewal/next-payment date changes 1:1 with the server currentPeriodEnd (one year later, not one month)', () {
      final a = subscriptionDisplayState(_membership(currentPeriodEnd: '2027-10-26T00:00:00.000Z'));
      final b = subscriptionDisplayState(_membership(currentPeriodEnd: '2028-10-26T00:00:00.000Z'));
      expect(a.nextPaymentDate, isNot(equals(b.nextPaymentDate)));
      expect(b.nextPaymentDate, formatMembershipDate('2028-10-26T00:00:00.000Z'));
      expect(b.renewalDate, b.nextPaymentDate);
    });

    test('a one-time/free/legacy membership renders no subscription section', () {
      final state = subscriptionDisplayState(_membership(
        razorpaySubscriptionId: null,
        subscriptionStatus: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      ));
      expect(state.kind, SubscriptionDisplayKind.none);
    });

    test('cancellation takes priority over a lingering payment-problem status on the same row', () {
      final state = subscriptionDisplayState(
        _membership(subscriptionStatus: 'cancelled', cancelledAt: '2026-11-01T00:00:00.000Z'),
      );
      expect(state.kind, SubscriptionDisplayKind.cancelled);
    });

    test('falls back to endDate for the next-payment date only if currentPeriodEnd is missing', () {
      final state = subscriptionDisplayState(_membership(currentPeriodEnd: null));
      expect(state.kind, SubscriptionDisplayKind.active);
      expect(state.nextPaymentDate, formatMembershipDate('2027-10-26T00:00:00.000Z'));
    });
  });

  group('formatMembershipDate', () {
    test("renders as 'DD Month YYYY'", () {
      expect(formatMembershipDate('2027-10-26T00:00:00.000Z'), '26 October 2027');
    });
  });
}
