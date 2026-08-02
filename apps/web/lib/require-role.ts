import { NextResponse } from "next/server";
import {
  getIdentityAccessModule,
  type AccessDecision,
  type AccessDenialReason,
  type Permission,
  type SessionSnapshot,
} from "@bikie/services";
import { getServerSession } from "./get-session";

type SessionResult = Awaited<ReturnType<typeof getServerSession>>;

/**
 * Transport mapping only — the authorization policy itself lives in the identity-access
 * module (ADR-023). These status codes and bodies are part of the public API contract
 * consumed by the web app and the Flutter client, so they must not drift.
 */
function toResponse(reason: AccessDenialReason) {
  switch (reason) {
    case "UNAUTHENTICATED":
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    case "ACCOUNT_RESTRICTED":
      return NextResponse.json({ error: "ACCOUNT_RESTRICTED" }, { status: 403 });
    case "MEMBERSHIP_REQUIRED":
      return NextResponse.json(
        {
          error: "MEMBERSHIP_REQUIRED",
          message: "This is a BIKIE Membership perk. Join a plan to continue.",
        },
        { status: 403 },
      );
    case "FORBIDDEN":
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

function toSnapshot(session: NonNullable<SessionResult>): SessionSnapshot {
  return {
    userId: session.user.id,
    role: session.user.role,
    accountStatus: session.user.accountStatus,
    accountStatusExpiresAt: session.user.accountStatusExpiresAt,
  };
}

function denialResponse(decision: AccessDecision) {
  return decision.allowed ? null : toResponse(decision.reason);
}

/** Shared moderation fast-path — banned/suspended sessions must fail every gate. */
export function assertAccountActive(session: NonNullable<SessionResult>) {
  const decision = getIdentityAccessModule().access.evaluateSession(toSnapshot(session));
  return denialResponse(decision);
}

export async function requireSession() {
  const session = await getServerSession();
  const { access } = getIdentityAccessModule();
  const decision = access.evaluateSession(session ? toSnapshot(session) : null);

  if (!decision.allowed || !session) {
    return { session: null, error: toResponse(decision.allowed ? "UNAUTHENTICATED" : decision.reason) };
  }

  return { session, error: null };
}

export async function requireMembership() {
  const session = await getServerSession();
  const { access } = getIdentityAccessModule();
  const decision = await access.evaluateMembership(session ? toSnapshot(session) : null);

  if (decision.allowed && session) {
    return { session, error: null };
  }

  const error = toResponse(decision.allowed ? "UNAUTHENTICATED" : decision.reason);

  // MEMBERSHIP_REQUIRED still hands back the session — callers historically read it for
  // logging/upsell context even though they return the 403.
  if (session && !decision.allowed && decision.reason === "MEMBERSHIP_REQUIRED") {
    return { session, error };
  }

  return { session: null, error };
}

export async function requireRole(role: string | string[]) {
  const session = await getServerSession();
  const { access } = getIdentityAccessModule();
  const decision = access.evaluateRole(session ? toSnapshot(session) : null, role);

  if (!decision.allowed || !session) {
    return { session: null, error: toResponse(decision.allowed ? "UNAUTHENTICATED" : decision.reason) };
  }

  return { session, error: null };
}

/**
 * Permission gate for routes where a role name is not the intent being expressed.
 * Permissions are derived from the role (no schema/session change), so a permission
 * check can never be broader than the equivalent role check.
 */
export async function requirePermission(permission: Permission) {
  const session = await getServerSession();
  const { access } = getIdentityAccessModule();
  const decision = access.evaluatePermission(session ? toSnapshot(session) : null, permission);

  if (!decision.allowed || !session) {
    return { session: null, error: toResponse(decision.allowed ? "UNAUTHENTICATED" : decision.reason) };
  }

  return { session, error: null };
}
