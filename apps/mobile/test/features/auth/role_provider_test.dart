import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/auth/domain/role_provider.dart';

/// ADR-046b/ADR-049 — `resolveActiveMode` is the pure decision function every mode-switch surface
/// (app_router.dart, app_shell.dart, profile_screen.dart, and switchActiveMode's own success
/// path) reduces to. CAPABILITY (an active, non-suspended profile), not verification, is the
/// gate: DRAFT/PENDING_VERIFICATION/MORE_INFORMATION_REQUIRED/REJECTED/APPROVED all grant it —
/// only a genuinely absent profile (`null`) or an explicit SUSPENDED revokes it.
void main() {
  group('resolveActiveMode', () {
    test('no application (partnerStatus null) always resolves to RIDER', () {
      expect(resolveActiveMode(null, null), 'RIDER');
      expect(resolveActiveMode(null, 'PARTNER'), 'RIDER');
      expect(resolveActiveMode(null, 'RIDER'), 'RIDER');
    });

    test('DRAFT/PENDING_VERIFICATION/MORE_INFORMATION_REQUIRED/REJECTED/APPROVED all grant '
        'capability regardless of verification status', () {
      for (final status in [
        'DRAFT',
        'PENDING_VERIFICATION',
        'MORE_INFORMATION_REQUIRED',
        'REJECTED',
        'APPROVED',
      ]) {
        expect(resolveActiveMode(status, null), 'PARTNER', reason: status);
        expect(resolveActiveMode(status, 'PARTNER'), 'PARTNER', reason: status);
        expect(resolveActiveMode(status, 'RIDER'), 'RIDER', reason: '$status respects a stored RIDER preference');
      }
    });

    test('SUSPENDED demotes back to RIDER even with a stored PARTNER preference from before '
        'the suspension (the "next mode switch must fail" / auto-demotion requirement)', () {
      expect(resolveActiveMode('SUSPENDED', 'PARTNER'), 'RIDER');
      expect(resolveActiveMode('SUSPENDED', null), 'RIDER');
    });
  });
}
