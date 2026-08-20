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
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30";

function readSelectedRoleCookie(): SelectedRole {
  const match = document.cookie.match(new RegExp(`(?:^|; )${SELECTED_ROLE_COOKIE}=([^;]*)`));
  return match?.[1] === "SERVICE_PROVIDER" ? "SERVICE_PROVIDER" : "RIDER";
}

/** ADMIN -> /admin; else by the account's real, server-authoritative `accountType` (ADR-053).
 * Mirrors the local helper in apps/web/components/layout/Navbar.tsx (a client component, so not
 * directly importable). */
function dashboardHrefForRole(role: string | undefined, accountType: string | null | undefined) {
  if (role === "ADMIN") return "/admin";
  return accountType === "SERVICE_PROVIDER" ? "/partner" : "/";
}

export default function SignUpPage() {
  const [step, setStep] = useState<"phone" | "otp" | "mismatch">("phone");
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<SelectedRole>("RIDER");
  const [mismatch, setMismatch] = useState<{ currentType: SelectedRole; requestedType: SelectedRole } | null>(null);
  // See login/page.tsx's identical field — pre-auth mismatch (caught before any OTP is sent) has
  // no session yet, "Continue as X" there means "log me in as that type," not "redirect me."
  const [mismatchHasSession, setMismatchHasSession] = useState(false);

  const [localNumber, setLocalNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [exists, setExists] = useState<boolean | null>(null);
  const [referralCode, setReferralCode] = useState("");
  // ADR-057 — see login/page.tsx's identical field for why this is read at send/resend time
  // rather than fixed once: MSG91's widget has no channel choice on the first send at all.
  const [otpChannel, setOtpChannel] = useState<OtpChannel>("sms");

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const resendTimer = useResendCountdown(60);
  const widget = useMsg91Widget();
  const toast = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref);

    // `?role=partner` (e.g. from the "Apply Now" CTA on /partners) overrides
    // whatever the selectedRole cookie currently says, since that link
    // expresses explicit intent even if the visitor is mid-Rider-session.
    const roleParam = params.get("role");
    setSelectedRole(roleParam === "partner" ? "SERVICE_PROVIDER" : readSelectedRoleCookie());
  }, []);

  /** Factored out so both the normal phone-entry submit and the pre-auth mismatch screen's
   * "Continue as X" button can reach it without duplicating the MSG91 call — same split as
   * login/page.tsx's `sendOtpTo`. */
  async function sendOtpTo(normalized: string, knownExists: boolean) {
    setSendingOtp(true);
    try {
      await widget.sendOtp(normalized, otpChannel);
      setPhoneNumber(normalized);
      setExists(knownExists);
      setStep("otp");
      resendTimer.start();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send the verification code. Please try again.";
      setServerError(message);
      toast.error(message);
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
      // Checked before sending any OTP (ADR-053) — for an existing number, this also lets us
      // catch a Rider-vs-Service-Provider mismatch immediately instead of only after a full
      // verify, and for a brand-new number we skip straight to sending the code.
      const existsRes = await fetch(`/api/auth-helpers/phone-exists?phone=${encodeURIComponent(normalized)}`);
      const existsData: { exists: boolean; hasRealName: boolean; accountType: SelectedRole | null } =
        await existsRes.json();

      if (existsData.exists && existsData.accountType && existsData.accountType !== selectedRole) {
        setPhoneNumber(normalized);
        setMismatchHasSession(false);
        setMismatch({ currentType: existsData.accountType, requestedType: selectedRole });
        setStep("mismatch");
        return;
      }

      proceeded = true;
      await sendOtpTo(normalized, existsData.exists);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not send the verification code. Please try again.");
    } finally {
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
      toast.success("Verification code resent");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not resend the verification code. Please try again.";
      setServerError(message);
      toast.error(message);
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
      // opaque access token — our backend re-verifies that token server-side before Better Auth
      // issues a session (ADR-034).
      const widgetResult = await widget.verifyOtp(otpCode);
      const { error } = await authClient.phoneNumber.verify({ phoneNumber, code: widgetResult.message });
      if (error) {
        const message = error.message ?? "Invalid or expired code. Please try again.";
        setServerError(message);
        toast.error(message);
        return;
      }

      if (exists === false) {
        // Name isn't collected here — it's asked for on the onboarding/partner-onboarding
        // form right after this. Registration is the ONLY moment accountType is chosen freely —
        // once set, changing it later requires an admin-approved Account Type Change Request
        // (ADR-053), never a self-service switch.
        //
        // The response is checked, not fire-and-forget: if the accountType write fails
        // (e.g. the session cookie raced the just-created account), continuing to the
        // onboarding page would strand the user with a RIDER account and no way to fix it.
        const signupRes = await fetch("/api/user/complete-phone-signup", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountType: selectedRole }),
        });
        if (!signupRes.ok) {
          const data = (await signupRes.json().catch(() => ({}))) as { error?: string };
          const message = data.error ?? "Could not finish creating your account. Please try again.";
          setServerError(message);
          toast.error(message);
          setVerifying(false);
          return;
        }

        toast.success("Account created successfully");
        // Referral code is collected on the onboarding form itself now, not here —
        // forward it along as a query param so that step can prefill it.
        const nextPath = selectedRole === "SERVICE_PROVIDER" ? "/partner-onboarding" : "/onboarding";
        window.location.href = referralCode.trim()
          ? `${nextPath}?ref=${encodeURIComponent(referralCode.trim())}`
          : nextPath;
        return;
      }

      // This phone number already had an account — verify() just logged them into it. ADR-053:
      // never silently ignore a mismatch between what they picked here and their real account
      // type, and never sign them back out either — show the choice explicitly. Defensive
      // fallback now (handleSendCode's phone-exists check already catches this before an OTP is
      // ever sent) — reachable only if accountType changed in the brief window since that check.
      const { data: sessionData } = await authClient.getSession();
      const currentType: SelectedRole = sessionData?.user.accountType === "SERVICE_PROVIDER" ? "SERVICE_PROVIDER" : "RIDER";
      if (currentType !== selectedRole) {
        setMismatchHasSession(true);
        setMismatch({ currentType, requestedType: selectedRole });
        setStep("mismatch");
        return;
      }
      window.location.href = dashboardHrefForRole(sessionData?.user.role, currentType);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid or expired code. Please try again.";
      setServerError(message);
      toast.error(message);
    } finally {
      setVerifying(false);
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
            {selectedRole === "SERVICE_PROVIDER" ? "Grow your business." : "Start your journey."}
          </h1>
          <p className="mt-4 text-lg text-white/60 leading-relaxed">
            {selectedRole === "SERVICE_PROVIDER"
              ? "List your bikes, connect with riders, and build your business with BIKIE."
              : "Join the community, discover new places, and rent the perfect ride."}
          </p>
          <div className="mt-8 flex gap-3">
            {(selectedRole === "SERVICE_PROVIDER" ? ["🔧", "📈", "🤝"] : ["🏍️", "🌄", "🌍"]).map((emoji, i) => (
              <span key={i} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl backdrop-blur-sm">
                {emoji}
              </span>
            ))}
          </div>
        </div>
        <p className="text-sm text-white/30">© {new Date().getFullYear()} BIKIE</p>
      </div>

      <div className="relative flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
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
                {selectedRole === "SERVICE_PROVIDER" ? "Create your partner account" : "Create your rider account"}
              </h2>
              <p className="mt-1 text-sm text-foreground/50">
                {selectedRole === "SERVICE_PROVIDER"
                  ? "List your bikes, organize rides, and grow your business."
                  : "Join the community, book rides, and explore India."}
              </p>
            </div>
          )}

          {step === "phone" && (
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
                <p className="mt-1 text-xs text-foreground/40">
                  We&apos;ll text you a 6-digit code.
                </p>
              </div>

              <OtpChannelToggle value={otpChannel} onChange={setOtpChannel} disabled={sendingOtp} />

              {serverError && (
                <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {serverError}
                </div>
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
                <label className="text-sm font-medium" htmlFor="otpCode">
                  Verification code
                </label>
                <input
                  id="otpCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="6-digit code"
                  className={inputClassName}
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <OtpChannelToggle value={otpChannel} onChange={setOtpChannel} disabled={sendingOtp} />
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={sendingOtp || !resendTimer.canResend}
                    className="shrink-0 text-xs font-medium text-accent-text hover:text-accent-hover disabled:opacity-50"
                  >
                    {resendTimer.canResend ? "Resend code" : `Resend in ${resendTimer.remaining}s`}
                  </button>
                </div>
              </div>

              {serverError && (
                <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {serverError}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={verifying} size="lg">
                {verifying ? "Verifying..." : "Verify"}
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
                      window.location.href = dashboardHrefForRole(undefined, mismatch.currentType);
                      return;
                    }
                    // Not logged in yet (the common path) — resume as the account's real type.
                    setSelectedRole(mismatch.currentType);
                    setMismatch(null);
                    setStep("phone");
                    void sendOtpTo(phoneNumber, true);
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

          {step !== "mismatch" && (
            <p className="mt-6 text-center text-sm text-foreground/50">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-accent-text hover:text-accent-hover">
                Log in
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
