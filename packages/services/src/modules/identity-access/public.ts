import { getCommunicationsPorts, type CommunicationsPorts } from "../communications/public";
import { createAccessApplication } from "./application/access.application";
import { createOtpApplication } from "./application/otp.application";
import { createMembershipAdapter } from "./infrastructure/membership.adapter";
import { createOtpEchoAdapter } from "./infrastructure/otp-echo.adapter";
import type { IdentityAccessPorts } from "./ports";

export type IdentityAccessModule = {
  ports: IdentityAccessPorts;
  access: ReturnType<typeof createAccessApplication>;
  otp: ReturnType<typeof createOtpApplication>;
};

export type IdentityAccessDeps = Partial<IdentityAccessPorts> & {
  communications?: CommunicationsPorts;
};

/** Composition root for identity-access — membership lookup, OTP delivery, dev echo. */
export function createIdentityAccessModule(overrides: IdentityAccessDeps = {}): IdentityAccessModule {
  const ports: IdentityAccessPorts = {
    membership: overrides.membership ?? createMembershipAdapter(),
    otpEcho: overrides.otpEcho ?? createOtpEchoAdapter(),
    sms: overrides.sms ?? overrides.communications?.sms ?? getCommunicationsPorts().sms,
  };

  return {
    ports,
    access: createAccessApplication(ports),
    otp: createOtpApplication(ports),
  };
}

let defaultModule: IdentityAccessModule | null = null;

/** Lazy singleton used by the web auth gates and the Better Auth OTP hook. */
export function getIdentityAccessModule(): IdentityAccessModule {
  if (!defaultModule) defaultModule = createIdentityAccessModule();
  return defaultModule;
}

/** Test-only: replace the default module composition. */
export function setIdentityAccessModuleForTests(module: IdentityAccessModule | null): void {
  defaultModule = module;
}

export type { IdentityAccessPorts, MembershipPort, OtpEchoStorePort, SessionSnapshot } from "./ports";
export type { AccessDecision, AccessDenialReason } from "./domain/access-decision";
export type { Permission } from "./domain/permissions";
export type { Role } from "./domain/roles";
export { hasPermission, permissionsForRole } from "./domain/permissions";
export { hasRole, isAdmin, ROLES } from "./domain/roles";
export { isAccountRestricted } from "./domain/account-status";
export { buildOtpMessage } from "./domain/otp-message";
