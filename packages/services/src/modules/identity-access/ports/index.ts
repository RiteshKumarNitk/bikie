import type { SmsPort } from "../../communications/ports";

/** Session facts the policy needs — deliberately not Better Auth's session type. */
export type SessionSnapshot = {
  userId: string;
  role?: string | null;
  accountStatus?: string | null;
  accountStatusExpiresAt?: string | Date | null;
};

export interface MembershipPort {
  hasActiveMembership(userId: string): Promise<boolean>;
}

/** Opt-in dev echo so the OTP can be surfaced in the UI instead of the server console. */
export interface OtpEchoStorePort {
  remember(phoneNumber: string, code: string, ttlSeconds: number): Promise<void>;
}

export interface IdentityAccessPorts {
  membership: MembershipPort;
  otpEcho: OtpEchoStorePort;
  sms: SmsPort;
}

export type { SmsPort };
