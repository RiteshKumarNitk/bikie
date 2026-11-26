import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_exception.dart';

void main() {
  group('ApiException.fromResponseData — user-facing message', () {
    test('a server-provided message always wins over the code', () {
      final e = ApiException.fromResponseData(409, {
        'error': 'SUBSCRIPTION_ALREADY_EXISTS',
        'message': 'You already have an active subscription.',
      });
      expect(e.message, 'You already have an active subscription.');
      expect(e.errorCode, 'SUBSCRIPTION_ALREADY_EXISTS');
    });

    test('a known code without a message gets readable text, never the raw code', () {
      final e = ApiException.fromResponseData(409, {'error': 'ALREADY_OFFERED'});
      expect(e.message, "You've already offered to help with this request.");
      expect(e.errorCode, 'ALREADY_OFFERED');
    });

    test('an unknown machine code falls back to a generic message', () {
      final e = ApiException.fromResponseData(400, {'error': 'SOME_NEW_CODE'});
      expect(e.message, 'Something went wrong. Please try again.');
      expect(e.errorCode, 'SOME_NEW_CODE');
    });

    test('a plain-English error string is shown as-is', () {
      final e = ApiException.fromResponseData(404, {'error': 'Bike not found'});
      expect(e.message, 'Bike not found');
    });

    test('an empty message is treated as missing', () {
      final e = ApiException.fromResponseData(409, {'error': 'ALREADY_RATED', 'message': ''});
      expect(e.message, "You've already rated this helper.");
    });

    test('membership-required branching still works off the code', () {
      final e = ApiException.fromResponseData(403, {'error': 'MEMBERSHIP_REQUIRED'});
      expect(e.isMembershipRequired, isTrue);
      expect(e.message, isNot('MEMBERSHIP_REQUIRED'));
    });
  });
}
