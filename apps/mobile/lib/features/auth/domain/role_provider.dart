import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../partner_membership/data/partner_membership_repository.dart';
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

/// Derives the effective mode from the stored preference + server-verified CAPABILITY — same
/// semantics as web's `resolveActiveMode()` in `apps/web/lib/role.ts`. ADR-049: capability is
/// decoupled from verification — defaults to `'PARTNER'` only when a Service Provider profile
/// exists at all and hasn't been admin-suspended (verification status doesn't matter: `DRAFT`/
/// `PENDING_VERIFICATION`/`MORE_INFORMATION_REQUIRED`/`REJECTED`/`APPROVED` all count) and no
/// preference has been recorded yet; every other case (including a capable account whose last
/// recorded preference was `'RIDER'`) respects the stored value or falls back to `'RIDER'`, the
/// universal baseline. Also what silently demotes a since-suspended account back to Rider tabs
/// the next time `partnerStatus` gets refreshed (app resume, [switchActiveMode] itself, etc.) —
/// this function never trusts `storedMode` alone. Deliberately no membership check here (cheap,
/// session-only — evaluated on every rebuild); membership is enforced in [switchActiveMode]
/// itself and by every actual `/api/partner/**` call server-side.
String resolveActiveMode(String? partnerStatus, String? storedMode) {
  final hasCapability = partnerStatus != null && partnerStatus != 'SUSPENDED';
  if (storedMode == 'PARTNER' || storedMode == 'RIDER') {
    return hasCapability ? storedMode! : 'RIDER';
  }
  return hasCapability ? 'PARTNER' : 'RIDER';
}

/// Outcome of a [switchActiveMode] attempt — the caller uses this to decide what to show; the
/// mode/tab set only ever actually changes on `success`.
enum SwitchModeResult { success, notCapable, membershipRequired, networkError }

/// The mode-switch action itself (tightened to match web's `switchActiveMode()` server action —
/// see DECISIONS.md ADR-046b's mode-switch follow-up, corrected for capability-vs-verification by
/// ADR-049). Switching TO Partner mode never trusts the locally-cached `partnerStatus` — it
/// re-verifies against the server first, via the same `GET /api/auth/get-session` Better Auth
/// endpoint web's `getServerSession()` reads (`AuthController.refreshSession()`, already the
/// app's one "get me the authoritative current user" call), then checks active membership (the
/// one mode-routing path allowed that extra round-trip — it only runs on a deliberate button
/// press, not every rebuild). Switching back to Rider mode needs no such check — every account
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
    if (freshPartnerStatus == null || freshPartnerStatus == 'SUSPENDED') {
      return SwitchModeResult.notCapable;
    }

    try {
      // ADR-051 — a Service Provider's own membership, not the Rider one.
      final membership = await ref.read(partnerMembershipRepositoryProvider).getActive();
      if (membership == null) {
        return SwitchModeResult.membershipRequired;
      }
    } catch (_) {
      return SwitchModeResult.networkError;
    }
  }

  ref.read(activeModeProvider.notifier).state = mode;
  await ref.read(appPreferencesProvider).setActiveMode(mode);
  return SwitchModeResult.success;
}
