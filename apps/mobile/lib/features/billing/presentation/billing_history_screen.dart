import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

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

  @override
  Widget build(BuildContext context) {
    final paid = DateTime.tryParse(invoice.paidAt);
    final amount = invoice.currency == 'INR'
        ? '₹${invoice.amount.toStringAsFixed(2)}'
        : '${invoice.currency} ${invoice.amount.toStringAsFixed(2)}';
    return Card(
      child: ListTile(
        onTap: () => context.push('/billing/${invoice.id}'),
        title: Text(invoice.planName, style: Theme.of(context).textTheme.titleSmall),
        subtitle: Text(
          '${invoice.receiptNo}\n${paid == null ? '' : DateFormat('d MMM y').format(paid)}',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        isThreeLine: true,
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(amount, style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 4),
            Text(
              invoice.status == 'PAID' ? 'Paid' : 'Refunded',
              style: Theme.of(context).textTheme.labelSmall,
            ),
          ],
        ),
      ),
    );
  }
}
