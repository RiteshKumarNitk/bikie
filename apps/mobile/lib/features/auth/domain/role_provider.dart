import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import 'auth_controller.dart';

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
/// respects the stored value or falls back to `'RIDER'`, the universal baseline. Also what
/// silently demotes a since-suspended/rejected account back to Rider tabs the next time
/// `partnerStatus` gets refreshed (app resume, [switchActiveMode] itself, etc.) — this function
/// never trusts `storedMode` alone.
String resolveActiveMode(String? partnerStatus, String? storedMode) {
  final isApprovedPartner = partnerStatus == 'APPROVED';
  if (storedMode == 'PARTNER' || storedMode == 'RIDER') {
    return isApprovedPartner ? storedMode! : 'RIDER';
  }
  return isApprovedPartner ? 'PARTNER' : 'RIDER';
}

/// Outcome of a [switchActiveMode] attempt — the caller uses this to decide what to show; the
/// mode/tab set only ever actually changes on `success`.
enum SwitchModeResult { success, notApproved, networkError }

/// The mode-switch action itself (tightened to match web's `switchActiveMode()` server action —
/// see DECISIONS.md ADR-046b's mode-switch follow-up). Switching TO Partner mode never trusts
/// the locally-cached `partnerStatus` — it re-verifies against the server first, via the same
/// `GET /api/auth/get-session` Better Auth endpoint web's `getServerSession()` reads
/// (`AuthController.refreshSession()`, already the app's one "get me the authoritative current
/// user" call). That single field is sufficient to prove authenticated + has a Partner profile +
/// APPROVED + not suspended/rejected — `partnerStatus` can only ever be `'APPROVED'` if all of
/// those are simultaneously true (see `admin.repository.ts`'s `transitionPartnerVerification`,
/// which is the only writer). Switching back to Rider mode needs no such check — every account
/// already has baseline Rider capability, and every actual Partner-only API call re-checks
/// capability server-side regardless of what this local mode says either way.
Future<SwitchModeResult> switchActiveMode(WidgetRef ref, String mode) async {
  if (mode == 'PARTNER') {
    try {
      await ref.read(authControllerProvider.notifier).refreshSession();
    } catch (_) {
      // Network/API failure — never fall through to a mode change on an unverified guess.
      return SwitchModeResult.networkError;
    }
    final freshPartnerStatus = ref.read(authControllerProvider).user?.partnerStatus;
    if (freshPartnerStatus != 'APPROVED') {
      return SwitchModeResult.notApproved;
    }
  }

  ref.read(activeModeProvider.notifier).state = mode;
  await ref.read(appPreferencesProvider).setActiveMode(mode);
  return SwitchModeResult.success;
}
