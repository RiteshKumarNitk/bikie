"use client";

import { useState, useEffect } from "react";
import { Button } from "@bikie/ui";
import { authClient } from "@/lib/auth-client";
import { SELECTED_ROLE_COOKIE, type SelectedRole } from "@/lib/role";
import { PhoneNumberInput, composePhoneNumber } from "@/components/auth/PhoneNumberInput";
import { OtpChannelToggle } from "@/components/auth/OtpChannelToggle";
import { useResendCountdown } from "@/lib/use-resend-countdown";
import { useMsg91Widget, type OtpChannel } from "@/lib/use-msg91-widget";
import { LogoMark } from "@/components/layout/LogoMark";
import Link from "next/link";

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30";

const NO_ACCOUNT = "NO_ACCOUNT";

function readSelectedRoleCookie(): SelectedRole {
  const match = document.cookie.match(new RegExp(`(?:^|; )${SELECTED_ROLE_COOKIE}=([^;]*)`));
  return match?.[1] === "SERVICE_PROVIDER" ? "SERVICE_PROVIDER" : "RIDER";
}

export default function LoginPage() {
  // "phone" covers riders/partners created via OTP (the normal path). "email" is a fallback
  // for accounts that predate phone login or were never given a phone number — the seeded
  // admin account in particular has no phoneNumber at all, so without this there'd be no way
  // to sign in as admin. Better Auth's emailAndPassword sign-in was never disabled server-side
  // (packages/auth/src/server.ts), this just restores a UI path to it.
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"phone" | "otp" | "mismatch">("phone");
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<SelectedRole>("RIDER");
  const [mismatch, setMismatch] = useState<{ currentType: SelectedRole; requestedType: SelectedRole } | null>(null);
  // Pre-auth mismatch (caught before any OTP is sent) has no session yet — "Continue as X" there
  // means "actually log me in as that type," not "redirect me, I'm already signed in." Post-verify
  // mismatch (defensive fallback, session already exists) means the opposite. ADR-053.
  const [mismatchHasSession, setMismatchHasSession] = useState(false);

  useEffect(() => {
    setSelectedRole(readSelectedRoleCookie());
  }, []);

  const [localNumber, setLocalNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  // ADR-057 — which channel the OTP goes out on. Read at send/resend time, not stored per
  // request: MSG91's widget has no channel choice on the very first send (see use-msg91-widget.ts),
  // so this also decides what `sendOtp`'s follow-up retry does when set to "whatsapp".
  const [otpChannel, setOtpChannel] = useState<OtpChannel>("sms");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const resendTimer = useResendCountdown(60);
  const widget = useMsg91Widget();

  /** The actual "text me a code" step, factored out so both the normal phone-entry submit and
   * the pre-auth mismatch screen's "Continue as X" button (which needs to resume login, not
   * redirect — there's no session yet at that point) can reach it without duplicating the
   * MSG91 call. */
  async function sendOtpTo(normalized: string) {
    setSendingOtp(true);
    try {
      await widget.sendOtp(normalized, otpChannel);
      setPhoneNumber(normalized);
      setStep("otp");
      resendTimer.start();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not send the verification code. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleSendCode() {
    setServerError(null);
    const normalized = composePhoneNumber(localNumber);
    if (!normalized) {
      setServerError("Enter a 10-digit phone number.");
      return;
    }
    setSendingOtp(true);
    let proceeded = false;
    try {
      // Check existence up front, before sending any OTP — since the backend
      // auto-creates an account on any successful OTP verification (ADR-013), a
      // login page shouldn't text a code to a number with no account at all.
      const existsRes = await fetch(`/api/auth-helpers/phone-exists?phone=${encodeURIComponent(normalized)}`);
      const existsData: { exists: boolean; hasRealName: boolean; accountType: SelectedRole | null } =
        await existsRes.json();
      if (!existsData.exists) {
        setServerError(NO_ACCOUNT);
        return;
      }
      // ADR-053 — same reasoning: don't text a code just to find out afterward that the
      // selected role doesn't match this account. Caught here, before any OTP is sent.
      if (existsData.accountType && existsData.accountType !== selectedRole) {
        setPhoneNumber(normalized);
        setMismatchHasSession(false);
        setMismatch({ currentType: existsData.accountType, requestedType: selectedRole });
        setStep("mismatch");
        return;
      }

      proceeded = true;
      await sendOtpTo(normalized);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not send the verification code. Please try again.");
    } finally {
      // sendOtpTo manages its own sendingOtp lifecycle once control passes to it — only reset
      // here for the paths that returned before reaching it (NO_ACCOUNT, mismatch, error).
      if (!proceeded) setSendingOtp(false);
    }
  }

  async function handleResend() {
    if (!resendTimer.canResend) return;
    setServerError(null);
    setSendingOtp(true);
    try {
      await widget.retryOtp(otpChannel);
      resendTimer.start();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not resend the verification code. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setVerifying(true);
    try {
      // The widget verifies the code directly against MSG91 in-browser and hands back an
      // opaque access token — our backend re-verifies that token server-side (never trusts the
      // client's mere claim of success) before Better Auth issues a session (ADR-034).
      const widgetResult = await widget.verifyOtp(otpCode);
      const { error } = await authClient.phoneNumber.verify({ phoneNumber, code: widgetResult.message });
      if (error) {
        setServerError(error.message ?? "Invalid or expired code. Please try again.");
        return;
      }

      // ADR-053: never sign the account back out here — its real accountType is whatever it
      // already is, this only decides which message/redirect to show. This is a defensive
      // fallback path now (the phone-exists check in handleSendCode already catches the mismatch
      // before an OTP is ever sent) — reachable only if accountType changed in the brief window
      // between that check and this verify.
      const { data: sessionData } = await authClient.getSession();
      
      const currentRole = sessionData?.user.role;
      const currentType: SelectedRole = sessionData?.user.accountType === "SERVICE_PROVIDER" ? "SERVICE_PROVIDER" : "RIDER";
      
      // ADMIN is not a Rider/Service Provider routing choice.
      // Always send an authenticated ADMIN directly to the admin dashboard.
      if (currentRole === "ADMIN") {
        const urlParams = new URLSearchParams(window.location.search);
        const nextUrl = urlParams.get("next");
        window.location.href = nextUrl || "/admin";
        return;
      }

      if (currentType !== selectedRole) {
        setMismatchHasSession(true);
        setMismatch({ currentType, requestedType: selectedRole });
        setStep("mismatch");
        return;
      }

      // Redirect to the originally requested page (if any) or the appropriate dashboard based on selected role
      const urlParams = new URLSearchParams(window.location.search);
      const nextUrl = urlParams.get("next");
      window.location.href = nextUrl || (currentType === "SERVICE_PROVIDER" ? "/partner" : "/dashboard");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Invalid or expired code. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function onEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSigningIn(true);
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        setServerError(error.message ?? "Invalid email or password.");
        return;
      }

      // ADR-053: never sign the account back out here — its real accountType is whatever it
      // already is, this only decides which message/redirect to show.
      const { data: sessionData } = await authClient.getSession();

      const currentRole = sessionData?.user.role;
      const currentType: SelectedRole = sessionData?.user.accountType === "SERVICE_PROVIDER" ? "SERVICE_PROVIDER" : "RIDER";
      
      // ADMIN is not a Rider/Service Provider routing choice.
      // Always send an authenticated ADMIN directly to the admin dashboard.
      if (currentRole === "ADMIN") {
        const urlParams = new URLSearchParams(window.location.search);
        const nextUrl = urlParams.get("next");
        window.location.href = nextUrl || "/admin";
        return;
      }

      if (currentType !== selectedRole) {
        setMismatch({ currentType, requestedType: selectedRole });
        setStep("mismatch");
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const nextUrl = urlParams.get("next");
      window.location.href = nextUrl || (currentType === "SERVICE_PROVIDER" ? "/partner" : "/dashboard");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <main className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-12 lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark size="md" />
          <span className="font-display text-xl font-semibold text-white">BIKIE</span>
        </Link>
        <div className="max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight text-white">
            {selectedRole === "SERVICE_PROVIDER" ? "Manage your business." : "Welcome back to the ride."}
          </h1>
          <p className="mt-4 text-lg text-white/60 leading-relaxed">
            {selectedRole === "SERVICE_PROVIDER"
              ? "Access your dashboard, manage your fleet, and oversee bookings — all from your partner account."
              : "Access your dashboard, manage bookings, or plan your next trip — all from one account."}
          </p>
          <div className="mt-8 flex gap-3">
            {(selectedRole === "SERVICE_PROVIDER" ? ["🔧", "📊", "🤝"] : ["🏍️", "🌄", "🛣️"]).map((emoji, i) => (
              <span key={i} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl backdrop-blur-sm">
                {emoji}
              </span>
            ))}
          </div>
        </div>
        <p className="text-sm text-white/30">© {new Date().getFullYear()} BIKIE</p>
      </div>

      <div className="relative flex w-full items-center justify-center px-6 lg:w-1/2">
        <Link
          href="/welcome"
          className="absolute right-8 top-8 rounded-full border border-foreground/10 bg-foreground/[0.02] px-4 py-2 text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
        >
          Change Role
        </Link>
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <LogoMark />
              <span className="font-display text-lg font-semibold">BIKIE</span>
            </Link>
          </div>

          {step !== "mismatch" && (
            <div className="mt-8 lg:mt-0">
              <h2 className="font-display text-2xl font-semibold">
                {selectedRole === "SERVICE_PROVIDER" ? "Sign in to Service Provider" : "Sign in to Rider"}
              </h2>
              <p className="mt-1 text-sm text-foreground/50">Log in to your account</p>
            </div>
          )}

          {mode === "phone" && step === "phone" && (
            <p className="mt-4">
              <button
                type="button"
                onClick={() => {
                  setMode("email");
                  setServerError(null);
                }}
                className="text-xs font-medium text-accent-text hover:text-accent-hover"
              >
                Admin or existing email account? Log in with email instead
              </button>
            </p>
          )}

          {mode === "email" && (
            <form onSubmit={onEmailSignIn} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClassName}
                />
              </div>

              {serverError && (
                <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {serverError}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={signingIn} size="lg">
                {signingIn ? "Signing in..." : "Sign in"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setMode("phone");
                  setServerError(null);
                }}
                className="w-full text-center text-xs font-medium text-accent-text hover:text-accent-hover"
              >
                Log in with phone instead
              </button>
            </form>
          )}

          {mode === "phone" && step === "phone" && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium" htmlFor="phoneNumber">
                  Phone number
                </label>
                <div className="mt-1.5">
                  <PhoneNumberInput
                    localNumber={localNumber}
                    onLocalNumberChange={setLocalNumber}
                  />
                </div>
              </div>

              <OtpChannelToggle value={otpChannel} onChange={setOtpChannel} disabled={sendingOtp} />

              {serverError === NO_ACCOUNT ? (
                <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  No account found for this number.{" "}
                  <Link href="/signup" className="font-medium underline hover:text-red-300">
                    Sign up instead
                  </Link>
                  .
                </div>
              ) : (
                serverError && (
                  <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {serverError}
                  </div>
                )
              )}

              <Button
                type="button"
                onClick={handleSendCode}
                className="w-full"
                disabled={sendingOtp}
                size="lg"
              >
                {sendingOtp ? "Sending code..." : "Send code"}
              </Button>
            </div>
          )}

          {step === "otp" && (
            <form onSubmit={onVerify} className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-foreground/10 bg-foreground/[0.02] px-4 py-2.5 text-sm">
                <span className="text-foreground/70">{phoneNumber}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtpCode("");
                    setServerError(null);
                  }}
                  className="text-xs font-medium text-accent-text hover:text-accent-hover"
                >
                  Change
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" htmlFor="otpCode">
                    Verification code
                  </label>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={sendingOtp || !resendTimer.canResend}
                    className="text-xs text-accent-text hover:text-accent-hover disabled:opacity-50"
                  >
                    {resendTimer.canResend ? "Resend" : `Resend in ${resendTimer.remaining}s`}
                  </button>
                </div>
                <div className="mt-2">
                  <OtpChannelToggle value={otpChannel} onChange={setOtpChannel} disabled={sendingOtp} />
                </div>
                <input
                  id="otpCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="6-digit code"
                  className={inputClassName}
                />
              </div>

              {serverError && (
                <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {serverError}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={verifying} size="lg">
                {verifying ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          )}

          {step === "mismatch" && mismatch && (
            <div className="mt-8 lg:mt-0 space-y-4">
              <h2 className="font-display text-2xl font-semibold">
                Already registered as {mismatch.currentType === "SERVICE_PROVIDER" ? "a Service Provider" : "a Rider"}
              </h2>
              <p className="text-sm text-foreground/60">
                This account is already registered with BIKIE as{" "}
                {mismatch.currentType === "SERVICE_PROVIDER" ? "a Service Provider" : "a Rider"}. Did you select{" "}
                {mismatch.requestedType === "SERVICE_PROVIDER" ? "Service Provider" : "Rider"} by mistake?
              </p>
              <div className="space-y-3 pt-2">
                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  disabled={sendingOtp}
                  onClick={() => {
                    if (mismatchHasSession) {
                      // Already logged in (defensive fallback path) — just go there.
                      const urlParams = new URLSearchParams(window.location.search);
                      const nextUrl = urlParams.get("next");
                      window.location.href =
                        nextUrl || (mismatch.currentType === "SERVICE_PROVIDER" ? "/partner" : "/dashboard");
                      return;
                    }
                    // Not logged in yet (the common path) — resume login as the account's real
                    // type instead of the one originally selected.
                    setSelectedRole(mismatch.currentType);
                    setMismatch(null);
                    setStep("phone");
                    void sendOtpTo(phoneNumber);
                  }}
                >
                  {sendingOtp
                    ? "Sending code..."
                    : `Continue as ${mismatch.currentType === "SERVICE_PROVIDER" ? "Service Provider" : "Rider"}`}
                </Button>
                <Link
                  href="/account-type-request"
                  className="block w-full rounded-full border border-foreground/15 px-5 py-2.5 text-center text-sm font-medium hover:bg-foreground/5 transition-colors"
                >
                  Contact Support to change account type
                </Link>
              </div>
            </div>
          )}

          {mode === "phone" && step !== "mismatch" && (
            <p className="mt-6 text-center text-sm text-foreground/50">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-accent-text hover:text-accent-hover">
                Create one
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
