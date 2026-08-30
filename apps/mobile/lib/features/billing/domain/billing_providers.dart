import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/billing_repository.dart';
import '../data/invoice_model.dart';

final billingHistoryProvider = FutureProvider.autoDispose<List<InvoiceSummary>>((ref) {
  return ref.watch(billingRepositoryProvider).getHistory();
});

final invoiceProvider = FutureProvider.autoDispose.family<InvoiceDetail, String>((ref, id) {
  return ref.watch(billingRepositoryProvider).getInvoice(id);
});
