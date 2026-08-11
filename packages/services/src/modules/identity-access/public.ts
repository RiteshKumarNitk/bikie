import { createAccessApplication } from "./application/access.application";
import { createAccountTypeApplication } from "./application/account-type.application";
import { createOtpSendApplication } from "./application/otp-send.application";
import { createOtpVerifyApplication } from "./application/otp-verify.application";
import { createMembershipAdapter } from "./infrastructure/membership.adapter";
import { createPartnerMembershipAdapter } from "./infrastructure/partner-membership.adapter";
import { createOtpEchoAdapter } from "./infrastructure/otp-echo.adapter";
import { createMsg91NativeOtpAdapter } from "./infrastructure/msg91-native-otp.adapter";
import { createMsg91WidgetVerifyAdapter } from "./infrastructure/msg91-widget-verify.adapter";
import type { IdentityAccessPorts } from "./ports";

export type IdentityAccessModule = {
  ports: IdentityAccessPorts;
  access: ReturnType<typeof createAccessApplication>;
  otp: ReturnType<typeof createOtpSendApplication> & ReturnType<typeof createOtpVerifyApplication>;
  accountType: ReturnType<typeof createAccountTypeApplication>;
};

export type IdentityAccessDeps = Partial<IdentityAccessPorts>;

/** Composition root for identity-access — membership lookup, OTP send/verify (ADR-034), dev echo,
 * accountType mismatch detection (ADR-053). `accountType` itself is only ever written by an
 * admin-approved Account Type Change Request (see the `account-type-requests` service) — this
 * module deliberately has no self-service switch/write path. */
export function createIdentityAccessModule(overrides: IdentityAccessDeps = {}): IdentityAccessModule {
  const ports: IdentityAccessPorts = {
    membership: overrides.membership ?? createMembershipAdapter(),
    partnerMembership: overrides.partnerMembership ?? createPartnerMembershipAdapter(),
    otpEcho: overrides.otpEcho ?? createOtpEchoAdapter(),
    msg91NativeOtp: overrides.msg91NativeOtp ?? createMsg91NativeOtpAdapter(),
    msg91WidgetVerify: overrides.msg91WidgetVerify ?? createMsg91WidgetVerifyAdapter(),
  };

  return {
    ports,
    access: createAccessApplication(ports),
    otp: { ...createOtpSendApplication(ports), ...createOtpVerifyApplication(ports) },
    accountType: createAccountTypeApplication(),
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

export type {
  IdentityAccessPorts,
  MembershipPort,
  PartnerMembershipPort,
  OtpEchoStorePort,
  Msg91NativeOtpPort,
  Msg91WidgetVerifyPort,
  SessionSnapshot,
} from "./ports";
export type { AccessDecision, AccessDenialReason } from "./domain/access-decision";
export type { Permission } from "./domain/permissions";
export type { Role } from "./domain/roles";
export type { AccountType } from "./domain/account-type";
export type { AccountTypeMismatch } from "./application/account-type.application";
export { hasPermission, permissionsForRole } from "./domain/permissions";
export { hasRole, isAdmin, ROLES } from "./domain/roles";
export { isAccountRestricted } from "./domain/account-status";
export { isServiceProviderAccountType, ACCOUNT_TYPES } from "./domain/account-type";
