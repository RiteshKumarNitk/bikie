import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/features/billing/data/billing_repository.dart';
import 'package:mocktail/mocktail.dart';

class _MockDio extends Mock implements Dio {}

void main() {
  setUpAll(() {
    registerFallbackValue(RequestOptions(path: '/api/billing/history'));
  });

  late _MockDio dio;
  late BillingRepository repository;

  setUp(() {
    dio = _MockDio();
    repository = BillingRepository(dio);
  });

  Response<T> ok<T>(String path, T data) =>
      Response<T>(requestOptions: RequestOptions(path: path), statusCode: 200, data: data);

  Map<String, dynamic> summaryJson({String id = 'inv-1'}) => {
        'id': id,
        'receiptNo': 'BIKIE-2026-000001',
        'accountType': 'RIDER',
        'planName': 'Membership',
        'amount': 99,
        'currency': 'INR',
        'status': 'PAID',
        'paidAt': '2026-08-30T09:00:00.000Z',
        'membershipStartDate': '2026-08-30T00:00:00.000Z',
        'membershipEndDate': '2027-08-30T00:00:00.000Z',
      };

  group('BillingRepository.getHistory', () {
    test('gets /api/billing/history and parses the invoices list', () async {
      when(() => dio.get('/api/billing/history')).thenAnswer(
        (_) async => ok('/api/billing/history', {
          'invoices': [summaryJson(id: 'inv-1'), summaryJson(id: 'inv-2')],
        }),
      );

      final invoices = await repository.getHistory();

      expect(invoices, hasLength(2));
      expect(invoices.first.receiptNo, 'BIKIE-2026-000001');
      expect(invoices.first.amount, 99);
    });

    test('returns an empty list when the envelope has no invoices key', () async {
      when(() => dio.get('/api/billing/history'))
          .thenAnswer((_) async => ok('/api/billing/history', <String, dynamic>{}));

      expect(await repository.getHistory(), isEmpty);
    });
  });

  group('BillingRepository.getInvoice', () {
    test('gets /api/billing/invoices/:id and parses the detail envelope', () async {
      when(() => dio.get('/api/billing/invoices/inv-1')).thenAnswer(
        (_) async => ok('/api/billing/invoices/inv-1', {
          'invoice': {
            ...summaryJson(),
            'userId': 'user-1',
            'customerName': 'Priya Verma',
            'customerPhone': '+919876543210',
            'planId': 'plan-1',
            'durationDays': 365,
            'razorpayPaymentId': 'pay_abc',
            'razorpayOrderId': 'order_abc',
            'paymentId': 'pay_abc',
            'confirmationSmsSentAt': null,
            'createdAt': '2026-08-30T09:00:00.000Z',
          },
        }),
      );

      final inv = await repository.getInvoice('inv-1');

      expect(inv.receiptNo, 'BIKIE-2026-000001');
      expect(inv.customerName, 'Priya Verma');
      expect(inv.durationDays, 365);
      expect(inv.summary.amount, 99);
    });

    test('surfaces a 404 (someone else\'s / missing invoice) as a typed ApiException', () async {
      when(() => dio.get('/api/billing/invoices/nope')).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/api/billing/invoices/nope'),
          response: Response(
            requestOptions: RequestOptions(path: '/api/billing/invoices/nope'),
            statusCode: 404,
            data: {'error': 'NOT_FOUND'},
          ),
        ),
      );

      expect(() => repository.getInvoice('nope'), throwsA(isA<ApiException>()));
    });
  });
}
