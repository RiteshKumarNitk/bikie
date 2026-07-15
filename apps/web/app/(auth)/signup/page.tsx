"use client";

import { useState, useEffect } from "react";
import { Button } from "@bikie/ui";
import { authClient } from "@/lib/auth-client";
import { SELECTED_ROLE_COOKIE, selectedRoleToDbRole } from "@/lib/role";
import {
  PartnerBusinessFields,
  emptyPartnerBusinessDetails,
  type PartnerBusinessDetails,
} from "@/components/auth/PartnerBusinessFields";
import { PhoneNumberInput, DEFAULT_COUNTRY_CODE, composePhoneNumber } from "@/components/auth/PhoneNumberInput";
import Link from "next/link";

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30";

function readSelectedRoleCookie(): "RIDER" | "PARTNER" {
  const match = document.cookie.match(new RegExp(`(?:^|; )${SELECTED_ROLE_COOKIE}=([^;]*)`));
  return match?.[1] === "PARTNER" ? "PARTNER" : "RIDER";
}

/** ADMIN -> /admin, PARTNER -> /partner, else "/" — mirrors the local helper in
 * apps/web/components/layout/Navbar.tsx (a client component, so not directly importable). */
function dashboardHrefForRole(role: string | undefined) {
  if (role === "ADMIN") return "/admin";
  if (role === "PARTNER") return "/partner";
  return "/";
}

export default function SignUpPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<"RIDER" | "PARTNER">("RIDER");

  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [localNumber, setLocalNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [exists, setExists] = useState<boolean | null>(null);
  const [fullName, setFullName] = useState("");
  const [partnerDetails, setPartnerDetails] = useState<PartnerBusinessDetails>(
    emptyPartnerBusinessDetails,
  );
  const [referralCode, setReferralCode] = useState("");

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Dev-only convenience: no SMS vendor is configured yet (ADR-013), so the OTP normally only
  // shows up in the server console. /api/dev/otp is a 404 in production, so this silently
  // stays empty there — nothing to gate here beyond that.
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  async function fetchDevOtp(phone: string) {
    try {
      const res = await fetch(`/api/dev/otp?phone=${encodeURIComponent(phone)}`);
      const data: { code?: string | null } = await res.json();
      if (data.code) {
        console.log("Dev OTP Code:", data.code);
      }
      setDevOtpCode(data.code ?? null);
    } catch {
      setDevOtpCode(null);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref);

    // `?role=partner` (e.g. from the "Apply Now" CTA on /partners) overrides
    // whatever the selectedRole cookie currently says, since that link
    // expresses explicit intent even if the visitor is mid-Rider-session.
    const roleParam = params.get("role");
    setSelectedRole(roleParam === "partner" ? "PARTNER" : readSelectedRoleCookie());
  }, []);

  const dbRole = selectedRoleToDbRole(selectedRole);

  async function handleSendCode() {
    setServerError(null);
    const normalized = composePhoneNumber(countryCode, localNumber);
    if (!normalized) {
      setServerError("Enter a 10-digit phone number.");
      return;
    }
    setSendingOtp(true);
    try {
      const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber: normalized });
      if (error) {
        setServerError(error.message ?? "Could not send the verification code. Please try again.");
        return;
      }
      const existsRes = await fetch(`/api/auth-helpers/phone-exists?phone=${encodeURIComponent(normalized)}`);
      const existsData: { exists: boolean; hasRealName: boolean } = await existsRes.json();
      setPhoneNumber(normalized);
      setExists(existsData.exists);
      setStep("otp");
      fetchDevOtp(normalized);
    } catch {
      setServerError("Could not send the verification code. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleResend() {
    setServerError(null);
    setSendingOtp(true);
    try {
      const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber });
      if (error) {
        setServerError(error.message ?? "Could not resend the verification code. Please try again.");
        return;
      }
      fetchDevOtp(phoneNumber);
    } finally {
      setSendingOtp(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (exists === false && !fullName.trim()) {
      setServerError("Enter your full name.");
      return;
    }

    setVerifying(true);
    try {
      const { error } = await authClient.phoneNumber.verify({ phoneNumber, code: otpCode });
      if (error) {
        setServerError(error.message ?? "Invalid or expired code. Please try again.");
        return;
      }

      if (exists === false) {
        const completeRes = await fetch("/api/user/complete-phone-signup", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: fullName.trim(), role: dbRole }),
        });
        const completeData: { success: boolean; becamePartner: boolean } = await completeRes.json();

        if (completeData.becamePartner) {
          await fetch("/api/partner/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessName: partnerDetails.businessName,
              type: partnerDetails.type,
              city: partnerDetails.city,
              aadhaarNumber: partnerDetails.aadhaarNumber.trim() || undefined,
              contactPerson1Name: partnerDetails.contactPerson1Name.trim() || undefined,
              contactPerson1Mobile: partnerDetails.contactPerson1Mobile.trim() || undefined,
              contactPerson2Name: partnerDetails.contactPerson2Name.trim() || undefined,
              contactPerson2Mobile: partnerDetails.contactPerson2Mobile.trim() || undefined,
            }),
          });
        }

        if (referralCode.trim()) {
          await fetch("/api/referrals/link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: referralCode.trim() }),
          }).catch(() => {});
        }

        window.location.href = selectedRole === "PARTNER" ? "/partner" : "/onboarding";
        return;
      }

      // This phone number already had an account — verify() just logged them into it.
      const { data: sessionData } = await authClient.getSession();
      window.location.href = dashboardHrefForRole(sessionData?.user.role);
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-12 lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white">
            B
          </div>
          <span className="font-display text-xl font-semibold text-white">BIKIE</span>
        </Link>
        <div className="max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight text-white">
            Start your journey.
          </h1>
          <p className="mt-4 text-lg text-white/60 leading-relaxed">
            Whether you&apos;re a rider looking for adventure or a partner ready to grow your business — BIKIE is your platform.
          </p>
          <div className="mt-8 flex gap-3">
            {["🏍️", "🔧", "🤝"].map((emoji, i) => (
              <span key={i} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl backdrop-blur-sm">
                {emoji}
              </span>
            ))}
          </div>
        </div>
        <p className="text-sm text-white/30">© {new Date().getFullYear()} BIKIE</p>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
                B
              </div>
              <span className="font-display text-lg font-semibold">BIKIE</span>
            </Link>
          </div>

          <div className="mt-8 lg:mt-0">
            <h2 className="font-display text-2xl font-semibold">
              {selectedRole === "PARTNER" ? "Create your partner account" : "Create your rider account"}
            </h2>
            <p className="mt-1 text-sm text-foreground/50">
              {selectedRole === "PARTNER"
                ? "List your bikes, organize rides, and grow your business."
                : "Join the community, book rides, and explore India."}
            </p>
          </div>

          {step === "phone" && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium" htmlFor="phoneNumber">
                  Phone number
                </label>
                <div className="mt-1.5">
                  <PhoneNumberInput
                    countryCode={countryCode}
                    onCountryCodeChange={setCountryCode}
                    localNumber={localNumber}
                    onLocalNumberChange={setLocalNumber}
                  />
                </div>
                <p className="mt-1 text-xs text-foreground/40">
                  We&apos;ll text you a 6-digit code.
                </p>
              </div>

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
                    setDevOtpCode(null);
                  }}
                  className="text-xs font-medium text-accent-text hover:text-accent-hover"
                >
                  Change
                </button>
              </div>

              {devOtpCode && (
                <div className="rounded-xl border border-dashed border-accent/30 bg-accent/5 px-4 py-2.5 text-sm text-accent-text">
                  Dev mode (no SMS provider configured): code is <span className="font-mono font-semibold">{devOtpCode}</span>
                </div>
              )}

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
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={sendingOtp}
                  className="mt-1.5 text-xs font-medium text-accent-text hover:text-accent-hover disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>

              {exists === false && (
                <>
                  <div>
                    <label className="text-sm font-medium" htmlFor="fullName">
                      Full name
                    </label>
                    <input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium" htmlFor="referralCode">
                      Referral code <span className="font-normal text-foreground/40">(optional)</span>
                    </label>
                    <input
                      id="referralCode"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="e.g. RID4F2A9"
                      className={`${inputClassName} uppercase`}
                    />
                  </div>

                  {selectedRole === "PARTNER" && (
                    <div className="space-y-4 rounded-xl border border-accent/20 bg-accent/[0.02] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Partner details</p>
                      <PartnerBusinessFields
                        value={partnerDetails}
                        onChange={setPartnerDetails}
                        idPrefix="signup-partner"
                        showDescription={false}
                      />
                      <p className="text-xs text-foreground/40">
                        Your application will be reviewed by our team after signup.
                      </p>
                    </div>
                  )}
                </>
              )}

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

          <p className="mt-6 text-center text-sm text-foreground/50">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent-text hover:text-accent-hover">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
