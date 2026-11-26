import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/payments/razorpay_checkout.dart';
import 'package:mobile/core/payments/razorpay_subscription_checkout.dart';
import 'package:mobile/core/payments/subscription_authorization.dart';

void main() {
  group('normalizeIndianMobileForRazorpay — Razorpay\'s documented +{country}{number} format', () {
    test('normalizes the stored and typed forms to +91XXXXXXXXXX', () {
      for (final input in ['9876543210', '09876543210', '919876543210', '+919876543210', '+91 98765 43210', '98765-43210']) {
        expect(normalizeIndianMobileForRazorpay(input), '+919876543210', reason: input);
      }
    });

    test('never guesses: invalid or missing numbers are left for Razorpay to ask', () {
      for (final input in [null, '', '12345', '5876543210', '+14155552671', 'abc', '98765432101234']) {
        expect(normalizeIndianMobileForRazorpay(input), isNull, reason: '$input');
      }
    });
  });

  group('razorpayPrefillEmail', () {
    test('keeps a real email, drops placeholders and malformed values (never invents one)', () {
      expect(razorpayPrefillEmail('rider@example.com'), 'rider@example.com');
      expect(razorpayPrefillEmail('  rider@example.com '), 'rider@example.com');
      expect(razorpayPrefillEmail('919876543210@bikie.local'), isNull);
      expect(razorpayPrefillEmail('user@bikie.app'), isNull);
      expect(razorpayPrefillEmail('not-an-email'), isNull);
      expect(razorpayPrefillEmail('a@b'), isNull);
      expect(razorpayPrefillEmail(null), isNull);
    });
  });

  group('buildSubscriptionCheckoutOptions', () {
    test('passes the subscription id and public key, with prefilled name, +91 mobile and email', () {
      final options = buildSubscriptionCheckoutOptions(
        keyId: 'rzp_test_public',
        subscriptionId: 'sub_123',
        planName: 'Golden Subscription',
        prefill: const RazorpayPrefill(name: 'Asha Rao', email: 'asha@example.com', contact: '9876543210'),
      );

      expect(options['key'], 'rzp_test_public');
      expect(options['subscription_id'], 'sub_123');
      expect(options.containsKey('order_id'), isFalse);
      expect(options.containsKey('amount'), isFalse, reason: 'the amount comes from the server-side Razorpay plan');
      expect(options['prefill'], {'name': 'Asha Rao', 'email': 'asha@example.com', 'contact': '+919876543210'});
      // Not documented for subscription checkouts — deliberately not used.
      expect(options.containsKey('readonly'), isFalse);
      expect(options.containsKey('hidden'), isFalse);
      expect(options.toString().toLowerCase(), isNot(contains('secret')));
    });

    test('omits prefill fields it cannot trust', () {
      final options = buildSubscriptionCheckoutOptions(
        keyId: 'rzp_test_public',
        subscriptionId: 'sub_123',
        planName: 'Plan',
        prefill: const RazorpayPrefill(name: 'Asha', email: '919876543210@bikie.local', contact: '12345'),
      );
      expect(options['prefill'], {'name': 'Asha'});

      final none = buildSubscriptionCheckoutOptions(keyId: 'k', subscriptionId: 's', planName: 'p');
      expect(none.containsKey('prefill'), isFalse);
    });
  });

  group('SubscriptionCheckoutInfo.fromJson', () {
    test('uses in-app Checkout only when the server asks for it and sends a key', () {
      SubscriptionCheckoutInfo info(Map<String, dynamic> extra) =>
          SubscriptionCheckoutInfo.fromJson({'id': 'sub_1', 'status': 'created', 'shortUrl': 'https://rzp.io/i/1', ...extra});

      expect(info({'checkoutMode': 'native', 'keyId': 'rzp_test_public'}).useNativeCheckout, isTrue);
      expect(info({'checkoutMode': 'native', 'keyId': null}).useNativeCheckout, isFalse);
      expect(info({'checkoutMode': 'hosted', 'keyId': 'rzp_test_public'}).useNativeCheckout, isFalse);
      // Responses from a server without the new fields (older deploys) stay on the hosted flow.
      expect(info({}).useNativeCheckout, isFalse);
      expect(info({'reused': true}).reused, isTrue);
    });
  });

  group('authorizeSubscription', () {
    const native = SubscriptionCheckoutInfo(
      subscriptionId: 'sub_1',
      shortUrl: 'https://rzp.io/i/1',
      keyId: 'rzp_test_public',
      mode: SubscriptionCheckoutMode.native,
    );
    const hosted = SubscriptionCheckoutInfo(
      subscriptionId: 'sub_1',
      shortUrl: 'https://rzp.io/i/1',
      mode: SubscriptionCheckoutMode.hosted,
    );
    const prefill = RazorpayPrefill(name: 'Asha', contact: '9876543210');

    Future<SubscriptionAuthorizationResult> run(
      SubscriptionCheckoutInfo checkout, {
      SubscriptionCheckoutResult? checkoutResult,
      Future<bool> Function(SubscriptionCheckoutSuccess)? confirm,
      List<String>? hostedOpens,
      bool hostedOpenSucceeds = true,
      List<String>? launchedSubscriptions,
    }) {
      return authorizeSubscription(
        checkout: checkout,
        planName: 'Plan',
        prefill: prefill,
        launcher: ({required keyId, required subscriptionId, required planName, prefill}) async {
          launchedSubscriptions?.add(subscriptionId);
          return checkoutResult!;
        },
        confirm: confirm ?? (_) async => false,
        openHostedPage: (url) async {
          hostedOpens?.add(url);
          return hostedOpenSucceeds;
        },
      );
    }

    const success = SubscriptionCheckoutSuccess(paymentId: 'pay_1', subscriptionId: 'sub_1', signature: 'sig');

    test('native success → server confirms → activated', () async {
      SubscriptionCheckoutSuccess? confirmed;
      final result = await run(native, checkoutResult: success, confirm: (s) async {
        confirmed = s;
        return true;
      });
      expect(result.outcome, SubscriptionAuthorizationOutcome.activated);
      expect(confirmed!.paymentId, 'pay_1');
    });

    test('native success but Razorpay has not recorded the charge yet → confirming (keep watching)', () async {
      final result = await run(native, checkoutResult: success, confirm: (_) async => false);
      expect(result.outcome, SubscriptionAuthorizationOutcome.confirming);
      expect(result.awaitingConfirmation, isTrue);
    });

    test('native success but verification errors → still confirming, never reported as failed', () async {
      final result = await run(
        native,
        checkoutResult: success,
        confirm: (_) async => throw ApiException(statusCode: 503, message: 'down'),
      );
      expect(result.outcome, SubscriptionAuthorizationOutcome.confirming);
    });

    test('native cancel → cancelled, hosted page never opened', () async {
      final hostedOpens = <String>[];
      final result = await run(native, checkoutResult: const SubscriptionCheckoutCancelled(), hostedOpens: hostedOpens);
      expect(result.outcome, SubscriptionAuthorizationOutcome.cancelled);
      expect(hostedOpens, isEmpty);
    });

    test('native failure → Razorpay\'s message is shown', () async {
      final result = await run(native, checkoutResult: const SubscriptionCheckoutFailed('Card declined'));
      expect(result.outcome, SubscriptionAuthorizationOutcome.failed);
      expect(result.userMessage, 'Card declined');
    });

    test('native Checkout unavailable → hosted page for the SAME subscription, no new one', () async {
      final hostedOpens = <String>[];
      final launched = <String>[];
      final result = await run(
        native,
        checkoutResult: const SubscriptionCheckoutUnavailable(),
        hostedOpens: hostedOpens,
        launchedSubscriptions: launched,
      );
      expect(result.outcome, SubscriptionAuthorizationOutcome.hostedOpened);
      expect(launched, ['sub_1']);
      expect(hostedOpens, ['https://rzp.io/i/1']);
    });

    test('hosted mode never launches the SDK', () async {
      final launched = <String>[];
      final result = await run(hosted, hostedOpens: [], launchedSubscriptions: launched);
      expect(result.outcome, SubscriptionAuthorizationOutcome.hostedOpened);
      expect(launched, isEmpty);
    });

    test('hosted page cannot be opened → openFailed with a clear message', () async {
      final result = await run(hosted, hostedOpenSucceeds: false);
      expect(result.outcome, SubscriptionAuthorizationOutcome.openFailed);
      expect(result.userMessage, kSubscriptionPageOpenFailedMessage);
    });
  });
}
