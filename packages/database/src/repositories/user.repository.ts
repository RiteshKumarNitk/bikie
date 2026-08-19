import { prisma } from "../client";

/** Used by the phone-auth UI to decide, before an OTP is even sent, whether this number
 * belongs to an existing account (show a plain login) or a brand-new one (show the
 * name/role-specific signup fields alongside the OTP step). */
export async function findUserByPhoneNumber(phoneNumber: string) {
  return prisma.user.findUnique({
    where: { phoneNumber },
    select: { id: true, name: true, role: true, accountType: true },
  });
}

/** ADR-046b — keeps the denormalized `User.partnerStatus` (exposed on the Better Auth session)
 * in sync with `Partner.verificationStatus` whenever the latter changes. Never mutates `role` —
 * Partner capability is fully decoupled from the RENTER/ADMIN account-tier field now. */
export async function syncPartnerStatus(userId: string, status: string | null) {
  await prisma.user.update({ where: { id: userId }, data: { partnerStatus: status as any } });
}

/** ADR-053 — the one write path for `User.accountType`. Synchronizes `role` to match
 * (SERVICE_PROVIDER -> PARTNER, RIDER -> RENTER) while preserving ADMIN role. */
export async function setAccountType(userId: string, accountType: "RIDER" | "SERVICE_PROVIDER") {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const role = existing?.role === "ADMIN" ? "ADMIN" : accountType === "SERVICE_PROVIDER" ? "PARTNER" : "RENTER";
  await prisma.user.update({
    where: { id: userId },
    data: {
      accountType,
      role,
    },
  });
}

export async function findById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, phoneNumber: true, role: true, accountType: true, createdAt: true },
  });
}

export async function updateName(userId: string, name: string) {
  await prisma.user.update({ where: { id: userId }, data: { name } });
}

export async function updatePhone(userId: string, phone: string | null) {
  await prisma.user.update({ where: { id: userId }, data: { phone } });
}

export async function touchLastActiveAt(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  });
}

/** Fields used for SOS profile-completeness warnings. */
export async function findSosContactFields(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, name: true },
  });
}

/** Escalation targets for an SOS that resolved to zero recipients (ADR-030). */
export async function findAdminContacts(take = 5) {
  return prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true, phone: true },
    orderBy: { createdAt: "asc" },
    take,
  });
}
