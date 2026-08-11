"use client";

import { useState, useEffect } from "react";
import { Button } from "@bikie/ui";
import { authClient } from "@/lib/auth-client";
import { SELECTED_ROLE_COOKIE } from "@/lib/role";
import { PhoneNumberInput, composePhoneNumber } from "@/components/auth/PhoneNumberInput";
import { useResendCountdown } from "@/lib/use-resend-countdown";
import { useMsg91Widget } from "@/lib/use-msg91-widget";
import { LogoMark } from "@/components/layout/LogoMark";
import Link from "next/link";

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30";

const NO_ACCOUNT = "NO_ACCOUNT";

function readSelectedRoleCookie(): "RIDER" | "PARTNER" {
  const match = document.cookie.match(new RegExp(`(?:^|; )${SELECTED_ROLE_COOKIE}=([^;]*)`));
  return match?.[1] === "PARTNER" ? "PARTNER" : "RIDER";
}

export default function LoginPage() {
  // "phone" covers riders/partners created via OTP (the normal path). "email" is a fallback
  // for accounts that predate phone login or were never given a phone number — the seeded
  // admin account in particular has no phoneNumber at all, so without this there'd be no way
  // to sign in as admin. Better Auth's emailAndPassword sign-in was never disabled server-side
  // (packages/auth/src/server.ts), this just restores a UI path to it.
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<"RIDER" | "PARTNER">("RIDER");

  useEffect(() => {
    setSelectedRole(readSelectedRoleCookie());
  }, []);

  const [localNumber, setLocalNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const resendTimer = useResendCountdown(60);
  const widget = useMsg91Widget();

  async function handleSendCode() {
    setServerError(null);
    const normalized = composePhoneNumber(localNumber);
    if (!normalized) {
      setServerError("Enter a 10-digit phone number.");
      return;
    }
    setSendingOtp(true);
    try {
      // Check existence up front, before sending any OTP — since the backend
      // auto-creates an account on any successful OTP verification (ADR-013), a
      // login page shouldn't text a code to a number with no account at all.
      const existsRes = await fetch(`/api/auth-helpers/phone-exists?phone=${encodeURIComponent(normalized)}`);
      const existsData: { exists: boolean; hasRealName: boolean } = await existsRes.json();
      if (!existsData.exists) {
        setServerError(NO_ACCOUNT);
        return;
      }

      await widget.sendOtp(normalized);
      setPhoneNumber(normalized);
      setStep("otp");
      resendTimer.start();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not send the verification code. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleResend() {
    if (!resendTimer.canResend) return;
    setServerError(null);
    setSendingOtp(true);
    try {
      await widget.retryOtp();
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

      const { data: sessionData } = await authClient.getSession();
      if (selectedRole === "PARTNER") {
        const partnerStatus = (sessionData?.user as any)?.partnerStatus;
        if (partnerStatus == null || partnerStatus === "SUSPENDED") {
          await authClient.signOut();
          setServerError("You are a rider. Login as a rider. Change the role.");
          return;
        }
      }

      // Redirect to the originally requested page (if any) or the appropriate dashboard based on selected role
      const urlParams = new URLSearchParams(window.location.search);
      const nextUrl = urlParams.get("next");
      window.location.href = nextUrl || (selectedRole === "PARTNER" ? "/partner" : "/dashboard");
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

      const { data: sessionData } = await authClient.getSession();
      if (selectedRole === "PARTNER") {
        const partnerStatus = (sessionData?.user as any)?.partnerStatus;
        if (partnerStatus == null || partnerStatus === "SUSPENDED") {
          await authClient.signOut();
          setServerError("You are a rider. Login as a rider. Change the role.");
          return;
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      const nextUrl = urlParams.get("next");
      window.location.href = nextUrl || (selectedRole === "PARTNER" ? "/partner" : "/dashboard");
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
            {selectedRole === "PARTNER" ? "Manage your business." : "Welcome back to the ride."}
          </h1>
          <p className="mt-4 text-lg text-white/60 leading-relaxed">
            {selectedRole === "PARTNER"
              ? "Access your dashboard, manage your fleet, and oversee bookings — all from your partner account."
              : "Access your dashboard, manage bookings, or plan your next trip — all from one account."}
          </p>
          <div className="mt-8 flex gap-3">
            {(selectedRole === "PARTNER" ? ["🔧", "📊", "🤝"] : ["🏍️", "🌄", "🛣️"]).map((emoji, i) => (
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

          <div className="mt-8 lg:mt-0">
            <h2 className="font-display text-2xl font-semibold">
              {selectedRole === "PARTNER" ? "Sign in to Service Provider" : "Sign in to Rider"}
            </h2>
            <p className="mt-1 text-sm text-foreground/50">Log in to your account</p>
          </div>

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

          {mode === "phone" && (
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
