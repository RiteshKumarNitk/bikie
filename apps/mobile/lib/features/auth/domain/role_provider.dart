import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';

/// Mirrors the web's `SELECTED_ROLE_COOKIE` (`lib/role.ts`) — a pre-auth UI
/// preference set on `/welcome`, read by both `/login` and `/signup` to
/// decide which role's copy/fields to show. Values are the real `User.role` strings
/// ("RENTER"/"PARTNER"), not a separate UI enum — there's nothing to map.
final selectedRoleProvider = StateProvider<String>((ref) => 'RENTER');

/// ADR-046b — post-auth counterpart of [selectedRoleProvider]: which dashboard a
/// dual-capability account currently wants to see. Seeded from the persisted device
/// preference (`AppPreferences.activeMode`, mirrors web's cookie), `null` until a value has
/// ever been recorded. Never trusted for authorization by itself — see [resolveActiveMode].
final activeModeProvider = StateProvider<String?>((ref) => ref.watch(appPreferencesProvider).activeMode);

/// Derives the effective mode from the stored preference + server-verified capability — same
/// semantics as web's `resolveActiveMode()` in `apps/web/lib/role.ts`: defaults to `'PARTNER'`
/// only when the account is actually approved and no preference has been recorded yet; every
/// other case (including an approved account whose last recorded preference was `'RIDER'`)
/// respects the stored value or falls back to `'RIDER'`, the universal baseline.
String resolveActiveMode(String? partnerStatus, String? storedMode) {
  final isApprovedPartner = partnerStatus == 'APPROVED';
  if (storedMode == 'PARTNER' || storedMode == 'RIDER') {
    return isApprovedPartner ? storedMode! : 'RIDER';
  }
  return isApprovedPartner ? 'PARTNER' : 'RIDER';
}

/// The mode-switch action itself — updates the in-memory provider (so the router/shell react
/// immediately) and persists it (so it survives app restarts), mirroring web's
/// `switchActiveMode()` server action.
Future<void> switchActiveMode(WidgetRef ref, String mode) async {
  ref.read(activeModeProvider.notifier).state = mode;
  await ref.read(appPreferencesProvider).setActiveMode(mode);
}
