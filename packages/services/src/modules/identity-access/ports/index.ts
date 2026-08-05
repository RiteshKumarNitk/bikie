import type { ChannelResult } from "../../communications/ports";

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

/**
 * Opt-in dev echo so the OTP can be surfaced in the UI instead of the server console
 * (SHOW_OTP_TOAST, never in production). Also doubles as the dev-mode bypass for the MSG91
 * OTP flow (ADR-034) — `recall` lets `verifyLoginOtp` accept a locally-generated code without
 * ever calling MSG91 when running outside production.
 */
export interface OtpEchoStorePort {
  remember(phoneNumber: string, code: string, ttlSeconds: number): Promise<void>;
  recall(phoneNumber: string): Promise<string | null>;
}

/** MSG91's native server-to-server OTP API (ADR-034) — used by the Flutter/mobile send path. */
export interface Msg91NativeOtpPort {
  send(phoneNumber: string, options: { otpLength: number; expirySeconds: number }): Promise<ChannelResult>;
  verify(phoneNumber: string, code: string): Promise<boolean>;
}

/**
 * MSG91's Widget SDK access-token verification (ADR-034) — the widget itself handles OTP
 * generation/verification client-side in the browser; this confirms server-side that a token
 * the client claims is genuine actually came from MSG91, rather than trusting the client's
 * claim alone.
 */
export interface Msg91WidgetVerifyPort {
  verifyAccessToken(accessToken: string): Promise<{ verified: boolean; phoneNumber: string | null }>;
}

export interface IdentityAccessPorts {
  membership: MembershipPort;
  otpEcho: OtpEchoStorePort;
  msg91NativeOtp: Msg91NativeOtpPort;
  msg91WidgetVerify: Msg91WidgetVerifyPort;
}
