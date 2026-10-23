import 'package:intl/intl.dart';

import '../data/partner_membership_model.dart';

/// Pure display logic for the Service Provider monthly subscription — mirrors
/// `apps/web/lib/partner-subscription-display.ts` exactly (same priority order, same states), so
/// the two clients never disagree about what a given `PartnerMembership` row means. Kept separate
/// from the screen's widget tree specifically so the date/status decisions are unit-testable
/// without pumping a widget.
///
/// Every date shown comes straight from the server's `PartnerMembership` row
/// (`currentPeriodStart`/`currentPeriodEnd`/`endDate`, ultimately written by the backend's
/// `recordSubscriptionCharge` from Razorpay's own webhook payload) — never computed/guessed here.
enum SubscriptionDisplayKind { none, active, paymentProblem, cancelled }

/// Razorpay subscription statuses that mean "renewing normally" — anything else (`pending`,
/// `halted`, or an unrecognized future status) is surfaced as a payment problem.
const _healthySubscriptionStatuses = {'created', 'authenticated', 'active'};

class SubscriptionDisplayState {
  const SubscriptionDisplayState._({
    required this.kind,
    this.nextPaymentDate,
    this.validUntilDate,
    this.renewalDate,
    this.periodStartDate,
    this.statusLabel,
  });

  const SubscriptionDisplayState.none() : this._(kind: SubscriptionDisplayKind.none);

  const SubscriptionDisplayState.active({
    required String nextPaymentDate,
    required String validUntilDate,
    required String renewalDate,
    String? periodStartDate,
  }) : this._(
          kind: SubscriptionDisplayKind.active,
          nextPaymentDate: nextPaymentDate,
          validUntilDate: validUntilDate,
          renewalDate: renewalDate,
          periodStartDate: periodStartDate,
        );

  const SubscriptionDisplayState.paymentProblem({required String statusLabel, required String validUntilDate})
      : this._(kind: SubscriptionDisplayKind.paymentProblem, statusLabel: statusLabel, validUntilDate: validUntilDate);

  const SubscriptionDisplayState.cancelled({required String validUntilDate})
      : this._(kind: SubscriptionDisplayKind.cancelled, validUntilDate: validUntilDate);

  final SubscriptionDisplayKind kind;
  final String? nextPaymentDate;
  final String? validUntilDate;
  final String? renewalDate;
  final String? periodStartDate;
  final String? statusLabel;
}

/// `d MMMM y`, e.g. "23 November 2026" — matches the web page's `formatMembershipDate`.
String formatMembershipDate(String iso) {
  final date = DateTime.tryParse(iso);
  return date == null ? iso : DateFormat('d MMMM y').format(date);
}

String _statusLabel(String? status) {
  if (status == 'halted') return 'Failed';
  if (status == 'pending') return 'Pending';
  if (status == null) return 'Failed';
  return status[0].toUpperCase() + status.substring(1);
}

/// Decides what the Auto-Renewal section should show, in priority order: a scheduled
/// cancellation (`cancelledAt`) always wins over a payment-problem status (Razorpay stamps both
/// together on a Razorpay-initiated cancellation). Returns [SubscriptionDisplayState.none] for a
/// one-time/free membership (`razorpaySubscriptionId` absent).
SubscriptionDisplayState subscriptionDisplayState(PartnerMembership membership) {
  if (membership.razorpaySubscriptionId == null) return const SubscriptionDisplayState.none();

  if (membership.cancelledAt != null) {
    return SubscriptionDisplayState.cancelled(validUntilDate: formatMembershipDate(membership.endDate));
  }

  final status = membership.subscriptionStatus;
  if (status != null && !_healthySubscriptionStatuses.contains(status)) {
    return SubscriptionDisplayState.paymentProblem(
      statusLabel: _statusLabel(status),
      validUntilDate: formatMembershipDate(membership.endDate),
    );
  }

  final nextPaymentIso = membership.currentPeriodEnd ?? membership.endDate;
  return SubscriptionDisplayState.active(
    nextPaymentDate: formatMembershipDate(nextPaymentIso),
    validUntilDate: formatMembershipDate(membership.endDate),
    renewalDate: formatMembershipDate(nextPaymentIso),
    periodStartDate: membership.currentPeriodStart == null ? null : formatMembershipDate(membership.currentPeriodStart!),
  );
}
