// Mirrors `packages/types/src/billing.ts` (ADR-070). Plain classes with manual `fromJson`
// deliberately — this project's `build_runner` codegen is broken on the current toolchain, and
// these are read-only DTOs that don't need freezed's copyWith/equality.

/// `ONE_TIME` — a Rider annual purchase, or an SP membership bought via the one-time/free path.
/// `INITIAL_SUBSCRIPTION` — the first, authorization-triggered charge on a recurring SP
/// subscription. `AUTO_RENEWAL` — a later, webhook-confirmed recurring charge on the same
/// subscription. Mirrors `packages/types/src/billing.ts`'s `InvoicePaymentTypeDTO` — computed
/// server-side, never guessed here.
enum InvoicePaymentType { oneTime, initialSubscription, autoRenewal }

InvoicePaymentType _parsePaymentType(String? value) {
  switch (value) {
    case 'INITIAL_SUBSCRIPTION':
      return InvoicePaymentType.initialSubscription;
    case 'AUTO_RENEWAL':
      return InvoicePaymentType.autoRenewal;
    default:
      return InvoicePaymentType.oneTime;
  }
}

class InvoiceSummary {
  const InvoiceSummary({
    required this.id,
    required this.receiptNo,
    required this.accountType,
    required this.planName,
    required this.amount,
    required this.currency,
    required this.status,
    required this.paidAt,
    required this.membershipStartDate,
    required this.membershipEndDate,
    required this.paymentType,
  });

  final String id;
  final String receiptNo;
  final String accountType; // RIDER | SERVICE_PROVIDER
  final String planName;
  final num amount;
  final String currency;
  final String status; // PAID | REFUNDED
  final String paidAt;
  final String membershipStartDate;
  final String membershipEndDate;
  final InvoicePaymentType paymentType;

  factory InvoiceSummary.fromJson(Map<String, dynamic> json) => InvoiceSummary(
        id: json['id'] as String,
        receiptNo: json['receiptNo'] as String,
        accountType: json['accountType'] as String,
        planName: json['planName'] as String,
        amount: json['amount'] as num,
        currency: json['currency'] as String,
        status: json['status'] as String,
        paidAt: json['paidAt'] as String,
        membershipStartDate: json['membershipStartDate'] as String,
        membershipEndDate: json['membershipEndDate'] as String,
        paymentType: _parsePaymentType(json['paymentType'] as String?),
      );
}

/// Mirrors `packages/types/src/billing.ts`'s `InvoiceSubscriptionStateDTO` — the live Razorpay
/// subscription state as of whenever the invoice is read, `null` for a `ONE_TIME` invoice.
class InvoiceSubscriptionState {
  const InvoiceSubscriptionState({
    required this.razorpaySubscriptionId,
    required this.status,
    required this.currentPeriodEnd,
    required this.cancelledAt,
  });

  final String razorpaySubscriptionId;
  final String? status;
  final String? currentPeriodEnd;
  final String? cancelledAt;

  factory InvoiceSubscriptionState.fromJson(Map<String, dynamic> json) => InvoiceSubscriptionState(
        razorpaySubscriptionId: json['razorpaySubscriptionId'] as String,
        status: json['status'] as String?,
        currentPeriodEnd: json['currentPeriodEnd'] as String?,
        cancelledAt: json['cancelledAt'] as String?,
      );
}

class InvoiceDetail {
  const InvoiceDetail({
    required this.summary,
    required this.userId,
    required this.customerName,
    required this.customerPhone,
    required this.planId,
    required this.durationDays,
    required this.razorpayPaymentId,
    required this.razorpayOrderId,
    required this.paymentId,
    required this.confirmationSmsSentAt,
    required this.createdAt,
    required this.subscription,
  });

  final InvoiceSummary summary;
  final String userId;
  final String customerName;
  final String? customerPhone;
  final String planId;
  final int durationDays;
  final String? razorpayPaymentId;
  final String? razorpayOrderId;
  final String? paymentId;
  final String? confirmationSmsSentAt;
  final String createdAt;
  final InvoiceSubscriptionState? subscription;

  String get id => summary.id;
  String get receiptNo => summary.receiptNo;

  factory InvoiceDetail.fromJson(Map<String, dynamic> json) => InvoiceDetail(
        summary: InvoiceSummary.fromJson(json),
        userId: json['userId'] as String,
        customerName: json['customerName'] as String,
        customerPhone: json['customerPhone'] as String?,
        planId: json['planId'] as String,
        durationDays: json['durationDays'] as int,
        razorpayPaymentId: json['razorpayPaymentId'] as String?,
        razorpayOrderId: json['razorpayOrderId'] as String?,
        paymentId: json['paymentId'] as String?,
        confirmationSmsSentAt: json['confirmationSmsSentAt'] as String?,
        createdAt: json['createdAt'] as String,
        subscription: json['subscription'] == null
            ? null
            : InvoiceSubscriptionState.fromJson(json['subscription'] as Map<String, dynamic>),
      );
}
