import { prisma } from "../client";

/** Used by the phone-auth UI to decide, before an OTP is even sent, whether this number
 * belongs to an existing account (show a plain login) or a brand-new one (show the
 * name/role-specific signup fields alongside the OTP step). */
export async function findUserByPhoneNumber(phoneNumber: string) {
  return prisma.user.findUnique({
    where: { phoneNumber },
    select: { id: true, name: true, role: true },
  });
}

/** Self-service role change — only ever called for the RENTER -> PARTNER upgrade path
 * (see ADR-013), guarded by the caller checking the user's current role first. Not a
 * general-purpose role setter; admin role changes go through `adminRepository.updateUserRole`. */
export async function upgradeToPartnerRole(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { role: "PARTNER" } });
}

export async function findById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, phoneNumber: true, role: true },
  });
}

export async function updateName(userId: string, name: string) {
  await prisma.user.update({ where: { id: userId }, data: { name } });
}
