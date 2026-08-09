import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/auth/domain/role_provider.dart';

/// ADR-046b — `resolveActiveMode` is the pure decision function every mode-switch surface
/// (app_router.dart, app_shell.dart, profile_screen.dart, and switchActiveMode's own success
/// path) reduces to. Covers the exact scenario list from the mode-switch tightening request:
/// no application / pending / rejected / approved / suspended-after-approved, each with and
/// without a locally stored mode preference.
void main() {
  group('resolveActiveMode', () {
    test('no application (partnerStatus null) always resolves to RIDER', () {
      expect(resolveActiveMode(null, null), 'RIDER');
      expect(resolveActiveMode(null, 'PARTNER'), 'RIDER');
      expect(resolveActiveMode(null, 'RIDER'), 'RIDER');
    });

    test('DRAFT/PENDING_VERIFICATION/MORE_INFORMATION_REQUIRED/REJECTED all resolve to RIDER '
        'regardless of a stale stored PARTNER preference', () {
      for (final status in ['DRAFT', 'PENDING_VERIFICATION', 'MORE_INFORMATION_REQUIRED', 'REJECTED']) {
        expect(resolveActiveMode(status, null), 'RIDER', reason: status);
        expect(resolveActiveMode(status, 'PARTNER'), 'RIDER', reason: status);
        expect(resolveActiveMode(status, 'RIDER'), 'RIDER', reason: status);
      }
    });

    test('APPROVED with no stored preference defaults to PARTNER', () {
      expect(resolveActiveMode('APPROVED', null), 'PARTNER');
    });

    test('APPROVED respects a stored RIDER preference (does not force Partner mode)', () {
      expect(resolveActiveMode('APPROVED', 'RIDER'), 'RIDER');
    });

    test('APPROVED with a stored PARTNER preference stays in Partner mode', () {
      expect(resolveActiveMode('APPROVED', 'PARTNER'), 'PARTNER');
    });

    test('SUSPENDED demotes back to RIDER even with a stored PARTNER preference from before '
        'the suspension (the "next mode switch must fail" / auto-demotion requirement)', () {
      expect(resolveActiveMode('SUSPENDED', 'PARTNER'), 'RIDER');
    });
  });
}
