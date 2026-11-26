import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../data/invoice_model.dart';
import '../domain/billing_providers.dart';

/// ADR-070 — read-only membership payment / invoice history for the signed-in user (both
/// account types). Backed entirely by `GET /api/billing/*`; no pricing or activation logic on
/// the client.
class BillingHistoryScreen extends ConsumerWidget {
  const BillingHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(billingHistoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Payment History')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(billingHistoryProvider),
        child: AsyncValueView<List<InvoiceSummary>>(
          value: history,
          onRetry: () => ref.invalidate(billingHistoryProvider),
          data: (invoices) {
            if (invoices.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 120),
                  Center(child: Text('No membership payments yet.')),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: invoices.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) => _InvoiceCard(invoice: invoices[i]),
            );
          },
        ),
      ),
    );
  }
}

class _InvoiceCard extends StatelessWidget {
  const _InvoiceCard({required this.invoice});

  final InvoiceSummary invoice;

  /// "Subscription payment" for the authorization charge, "Paid via AutoPay" for every later
  /// recurring charge — `null` for a plain one-time purchase, where no extra label is shown.
  String? get _paymentTypeLabel {
    switch (invoice.paymentType) {
      case InvoicePaymentType.initialSubscription:
        return 'Subscription payment';
      case InvoicePaymentType.autoRenewal:
        return 'Paid via AutoPay';
      case InvoicePaymentType.oneTime:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final paid = DateTime.tryParse(invoice.paidAt);
    final amount = invoice.currency == 'INR'
        ? '₹${invoice.amount.toStringAsFixed(2)}'
        : '${invoice.currency} ${invoice.amount.toStringAsFixed(2)}';
    final typeLabel = _paymentTypeLabel;
    final statusLabel = invoice.status == 'PAID' ? 'Paid' : 'Refunded';
    final textTheme = Theme.of(context).textTheme;
    // A plain Row instead of a three-line ListTile: ListTile's fixed tile height clipped the
    // amount/label column at larger system font sizes. Here every line wraps and the card grows.
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/billing/${invoice.id}'),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(invoice.planName, style: textTheme.titleSmall),
                    const SizedBox(height: 2),
                    Text(invoice.receiptNo, style: textTheme.bodySmall),
                    if (paid != null) Text(DateFormat('d MMM y').format(paid), style: textTheme.bodySmall),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(amount, style: textTheme.titleSmall),
                    const SizedBox(height: 4),
                    Text(
                      typeLabel == null ? statusLabel : '$typeLabel · $statusLabel',
                      textAlign: TextAlign.end,
                      style: textTheme.labelSmall?.copyWith(
                        color: typeLabel == null ? null : AppTheme.accentTextOf(context),
                        fontWeight: typeLabel == null ? null : FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
