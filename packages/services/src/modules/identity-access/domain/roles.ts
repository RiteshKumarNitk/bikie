export const ROLES = ["RENTER", "PARTNER", "ADMIN"] as const;

export type Role = (typeof ROLES)[number];

export function hasRole(role: string | null | undefined, allowed: string | string[]): boolean {
  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];
  return allowedRoles.includes(role as string);
}

export function isAdmin(role: string | null | undefined): boolean {
  return role === "ADMIN";
}
