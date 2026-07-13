import { NextResponse } from "next/server";
import { MembershipService } from "@bikie/services";
import { getServerSession } from "./get-session";

export async function requireSession() {
  const session = await getServerSession();
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const status = session.user.accountStatus;
  const expiresAt = session.user.accountStatusExpiresAt;
  const isExpired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;
  if (status === "BANNED" || (status === "SUSPENDED" && !isExpired)) {
    return {
      session: null,
      error: NextResponse.json({ error: "ACCOUNT_RESTRICTED" }, { status: 403 }),
    };
  }

  return { session, error: null };
}

export async function requireMembership() {
  const session = await getServerSession();
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role === "ADMIN") {
    return { session, error: null };
  }
  const membership = await MembershipService.getActiveMembership(session.user.id);
  if (!membership) {
    return {
      session,
      error: NextResponse.json(
        {
          error: "MEMBERSHIP_REQUIRED",
          message: "This is a BIKIE Membership perk. Join a plan to continue.",
        },
        { status: 403 },
      ),
    };
  }
  return { session, error: null };
}

export async function requireRole(role: string | string[]) {
  const session = await getServerSession();
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(session.user.role as string)) {
    return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, error: null };
}
