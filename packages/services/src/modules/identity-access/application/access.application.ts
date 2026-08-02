import { isAccountRestricted } from "../domain/account-status";
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
