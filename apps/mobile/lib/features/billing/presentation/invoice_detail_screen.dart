import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/widgets/async_value_view.dart';
import '../data/invoice_model.dart';
import '../domain/billing_providers.dart';

/// ADR-070 — a single membership receipt, rendered natively from the stored (immutable)
/// invoice snapshot. Every figure here is what was charged at purchase time and never changes
/// if plan pricing is later updated.
class InvoiceDetailScreen extends ConsumerWidget {
  const InvoiceDetailScreen({super.key, required this.invoiceId});

  final String invoiceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final invoice = ref.watch(invoiceProvider(invoiceId));

    return Scaffold(
      appBar: AppBar(title: const Text('Receipt')),
      body: AsyncValueView<InvoiceDetail>(
        value: invoice,
        onRetry: () => ref.invalidate(invoiceProvider(invoiceId)),
        data: (inv) => _Receipt(inv: inv),
      ),
    );
  }
}

class _Receipt extends StatelessWidget {
  const _Receipt({required this.inv});

  final InvoiceDetail inv;

  String _date(String iso) {
    final d = DateTime.tryParse(iso);
    return d == null ? iso : DateFormat('d MMM y').format(d);
  }

  @override
  Widget build(BuildContext context) {
    final s = inv.summary;
    final amount = s.currency == 'INR'
        ? '₹${s.amount.toStringAsFixed(2)}'
        : '${s.currency} ${s.amount.toStringAsFixed(2)}';
    final rows = <(String, String)>[
      ('Receipt no.', s.receiptNo),
      ('Status', s.status == 'PAID' ? 'Paid' : 'Refunded'),
      ('Billed to', inv.customerName),
      if (inv.customerPhone != null) ('Mobile', inv.customerPhone!),
      ('Account type', s.accountType == 'SERVICE_PROVIDER' ? 'Service Provider' : 'Rider'),
      ('Plan', s.planName),
      ('Membership term', '${inv.durationDays} days'),
      ('Membership start', _date(s.membershipStartDate)),
      ('Membership expiry', _date(s.membershipEndDate)),
      ('Payment date', _date(s.paidAt)),
      if (inv.razorpayPaymentId != null) ('Razorpay payment ID', inv.razorpayPaymentId!),
      if (inv.razorpayOrderId != null) ('Razorpay order ID', inv.razorpayOrderId!),
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('BIKIE', style: Theme.of(context).textTheme.titleLarge),
                Text('Membership Receipt', style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 16),
                Text('Amount ${s.status == 'PAID' ? 'paid' : 'refunded'}',
                    style: Theme.of(context).textTheme.labelSmall),
                Text(amount, style: Theme.of(context).textTheme.headlineSmall),
                if (s.amount == 0)
                  Text('Free plan — no payment was collected.',
                      style: Theme.of(context).textTheme.bodySmall),
                const Divider(height: 28),
                ...rows.map(
                  (r) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 4,
                          child: Text(r.$1, style: Theme.of(context).textTheme.bodySmall),
                        ),
                        Expanded(
                          flex: 6,
                          child: Text(
                            r.$2,
                            textAlign: TextAlign.right,
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'This is a system-generated receipt for a BIKIE membership purchase. Amount, plan and '
          'membership dates reflect the configuration in effect at the time of purchase.',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}
