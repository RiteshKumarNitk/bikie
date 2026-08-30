import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'invoice_model.dart';

/// ADR-070 — read-only membership billing history. Uses the same authenticated backend APIs the
/// web app does; no business logic lives here. Every response is already scoped to the
/// signed-in user server-side.
final billingRepositoryProvider = Provider<BillingRepository>((ref) {
  return BillingRepository(ref.watch(dioProvider));
});

class BillingRepository {
  BillingRepository(this._dio);

  final Dio _dio;

  Future<List<InvoiceSummary>> getHistory() {
    return apiGuard(() async {
      final res = await _dio.get('/api/billing/history');
      final list = (res.data['invoices'] as List?) ?? const [];
      return list.map((e) => InvoiceSummary.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  Future<InvoiceDetail> getInvoice(String id) {
    return apiGuard(() async {
      final res = await _dio.get('/api/billing/invoices/$id');
      return InvoiceDetail.fromJson(res.data['invoice'] as Map<String, dynamic>);
    });
  }
}
