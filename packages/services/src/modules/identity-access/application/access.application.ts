import { isAccountRestricted } from "../domain/account-status";
import { isServiceProviderAccountType } from "../domain/account-type";
import { ALLOWED, denied, type AccessDecision } from "../domain/access-decision";
import { hasPermission, type Permission } from "../domain/permissions";
import { hasRole, isAdmin } from "../domain/roles";
import type { IdentityAccessPorts, SessionSnapshot } from "../ports";

/**
 * Single source of truth for "may this session do this?". Every gate starts from the same
 * session check, so a banned or suspended account fails role, membership, and permission
 * gates identically.
 */
export function createAccessApplication(ports: IdentityAccessPorts) {
  function evaluateSession(session: SessionSnapshot | null | undefined): AccessDecision {
    if (!session) return denied("UNAUTHENTICATED");
    if (
      isAccountRestricted({
        status: session.accountStatus,
        expiresAt: session.accountStatusExpiresAt,
      })
    ) {
      return denied("ACCOUNT_RESTRICTED");
    }
    return ALLOWED;
  }

  return {
    evaluateSession,

    evaluateRole(
      session: SessionSnapshot | null | undefined,
      role: string | string[],
    ): AccessDecision {
      const sessionDecision = evaluateSession(session);
      if (!sessionDecision.allowed) return sessionDecision;
      return hasRole(session!.role, role) ? ALLOWED : denied("FORBIDDEN");
    },

    evaluatePermission(
      session: SessionSnapshot | null | undefined,
      permission: Permission,
    ): AccessDecision {
      const sessionDecision = evaluateSession(session);
      if (!sessionDecision.allowed) return sessionDecision;
      return hasPermission(session!.role, permission) ? ALLOWED : denied("FORBIDDEN");
    },

    /**
     * ADR-049/053 — Service Provider CAPABILITY, decoupled from both `role` (ADR-046b) and from
     * verification/`APPROVED` status. Three independent conditions, all required: (1) `accountType`
     * is `SERVICE_PROVIDER` (ADR-053 — a Rider account, even one with a historical `Partner` row
     * from a prior stint, must not operate as a provider; switching account type is the only way
     * back in, never a bare API call); (2) an active profile exists and isn't admin-`SUSPENDED`
     * (`DRAFT`/`PENDING_VERIFICATION`/`MORE_INFORMATION_REQUIRED`/`REJECTED`/`APPROVED` all keep
     * full capability — verification stays a separately-displayed trust status, never a blanket
     * blocker); (3) active membership. The SOS `requireAvailableAndCapacity` gate reads capability
     * the same way, so an unverified-but-capable provider can still accept assistance requests.
     *
     * ADR-051 — the membership check reads the Partner's own `PartnerMembershipPort`, not the
     * Rider `MembershipPort` (`evaluateMembership` below still uses that one, unchanged) — Riders
     * and Service Providers are different roles with different membership plans/pricing, not one
     * shared subscription.
     */
    async evaluatePartnerCapability(
      session: SessionSnapshot | null | undefined,
    ): Promise<AccessDecision> {
      const sessionDecision = evaluateSession(session);
      if (!sessionDecision.allowed) return sessionDecision;
      if (!isServiceProviderAccountType(session)) {
        return denied("WRONG_ACCOUNT_TYPE");
      }
      if (session!.partnerStatus == null || session!.partnerStatus === "SUSPENDED") {
        return denied("PARTNER_NOT_APPROVED");
      }
      const activeMembership = await ports.partnerMembership.hasActivePartnerMembership(session!.userId);
      return activeMembership ? ALLOWED : denied("MEMBERSHIP_REQUIRED");
    },

    /**
     * Cheap, session-only capability check (no membership DB call) — for UI mode-routing paths
     * evaluated on every render/request (middleware, tab bar, mode resolvers), where an extra
     * query per request isn't warranted. Mirrors the identical precedent Rider membership already
     * sets: reaching `/dashboard` never checks membership either, only specific actions do.
     * `evaluatePartnerCapability` above (async, membership-checked) is what actually gates every
     * `/api/partner/**` route and the deliberate account-type-switch action.
     */
    hasPartnerCapabilitySync(session: SessionSnapshot | null | undefined): boolean {
      if (!session) return false;
      if (isAccountRestricted({ status: session.accountStatus, expiresAt: session.accountStatusExpiresAt })) {
        return false;
      }
      return (
        isServiceProviderAccountType(session) &&
        session.partnerStatus != null &&
        session.partnerStatus !== "SUSPENDED"
      );
    },

    /** Admins bypass membership — they monitor the network without buying a plan. */
    async evaluateMembership(session: SessionSnapshot | null | undefined): Promise<AccessDecision> {
      const sessionDecision = evaluateSession(session);
      if (!sessionDecision.allowed) return sessionDecision;
      if (isAdmin(session!.role)) return ALLOWED;
      const active = await ports.membership.hasActiveMembership(session!.userId);
      return active ? ALLOWED : denied("MEMBERSHIP_REQUIRED");
    },
  };
}

export type AccessApplication = ReturnType<typeof createAccessApplication>;
