import type { Role } from "./roles";

/**
 * Permission catalog for the places where `User.role` alone is too coarse to express
 * intent at the route edge. Roles remain the source of truth — permissions are derived,
 * never stored, so no schema or session change is required.
 */
export type Permission =
  | "audit:read"
  | "booking:manage:any"
  | "catalog:manage"
  | "fleet:manage"
  | "moderation:manage"
  | "ride:create"
  | "sos:create"
  | "sos:respond"
  | "sos:view:any"
  | "user:manage";

const RENTER_PERMISSIONS: Permission[] = ["ride:create", "sos:create", "sos:respond"];

const PARTNER_PERMISSIONS: Permission[] = [...RENTER_PERMISSIONS, "fleet:manage"];

const ADMIN_PERMISSIONS: Permission[] = [
  ...PARTNER_PERMISSIONS,
  "audit:read",
  "booking:manage:any",
  "catalog:manage",
  "moderation:manage",
  "sos:view:any",
  "user:manage",
];

const PERMISSIONS_BY_ROLE: Record<Role, Permission[]> = {
  RENTER: RENTER_PERMISSIONS,
  PARTNER: PARTNER_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
};

export function permissionsForRole(role: string | null | undefined): Permission[] {
  return PERMISSIONS_BY_ROLE[role as Role] ?? [];
}

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}
