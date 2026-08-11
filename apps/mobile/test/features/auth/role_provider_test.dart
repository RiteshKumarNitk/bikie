import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/auth/domain/role_provider.dart';

/// ADR-053 — `isServiceProviderAccountType` is the one formula every tab/routing surface
/// (app_router.dart, app_shell.dart, profile_screen.dart) reduces to. `accountType` is
/// server-authoritative and mutually exclusive — no capability/verification nuance left to test
/// here, that's `evaluatePartnerCapability`'s job on the backend.
void main() {
  group('isServiceProviderAccountType', () {
    test('true only for SERVICE_PROVIDER', () {
      expect(isServiceProviderAccountType('SERVICE_PROVIDER'), isTrue);
    });

    test('false for RIDER, null, or anything else', () {
      expect(isServiceProviderAccountType('RIDER'), isFalse);
      expect(isServiceProviderAccountType(null), isFalse);
      expect(isServiceProviderAccountType('SUSPENDED'), isFalse);
    });
  });
}
