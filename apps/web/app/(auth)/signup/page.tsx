"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpInput } from "@bikie/validation";
import { Button } from "@bikie/ui";
import { authClient } from "@/lib/auth-client";
import { SELECTED_ROLE_COOKIE, selectedRoleToDbRole } from "@/lib/role";
import Link from "next/link";

const partnerTypes = [
  "RENTAL", "MECHANIC", "TOUR_GUIDE", "HOTEL", "CAMPING", "ACCESSORIES", "PHOTOGRAPHY",
];

function readSelectedRoleCookie(): "RIDER" | "PARTNER" {
  const match = document.cookie.match(new RegExp(`(?:^|; )${SELECTED_ROLE_COOKIE}=([^;]*)`));
  return match?.[1] === "PARTNER" ? "PARTNER" : "RIDER";
}

export default function SignUpPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<"RIDER" | "PARTNER">("RIDER");
  const [partnerType, setPartnerType] = useState("RENTAL");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

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

  async function onSubmit(values: SignUpInput) {
    setServerError(null);
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      role: dbRole,
    });
    if (error) {
      setServerError(error.message ?? "Something went wrong. Please try again.");
      return;
    }
    if (selectedRole === "PARTNER") {
      await fetch("/api/partner/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, type: partnerType, city }),
      });
    }
    if (referralCode.trim()) {
      await fetch("/api/referrals/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: referralCode.trim() }),
      }).catch(() => {});
    }
    window.location.href = selectedRole === "PARTNER" ? "/partner" : "/";
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

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                className="mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
                {...register("name")}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
                {...register("email")}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
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
                className="mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm uppercase outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
              />
            </div>

            {selectedRole === "PARTNER" && (
              <div className="space-y-4 rounded-xl border border-accent/20 bg-accent/[0.02] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">Partner details</p>
                <div>
                  <label className="text-sm font-medium" htmlFor="businessName">
                    Business name
                  </label>
                  <input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Goa Moto Rentals"
                    className="mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="partnerType">
                    Service type
                  </label>
                  <select
                    id="partnerType"
                    value={partnerType}
                    onChange={(e) => setPartnerType(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
                  >
                    {partnerTypes.map((type) => (
                      <option key={type} value={type} className="bg-card">
                        {type.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="city">
                    City
                  </label>
                  <input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Goa"
                    className="mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
                  />
                </div>
                <p className="text-xs text-foreground/40">
                  Your application will be reviewed by our team after signup.
                </p>
              </div>
            )}

            {serverError && (
              <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
              {isSubmitting
                ? "Creating account..."
                : `Create ${selectedRole === "PARTNER" ? "partner" : ""} account`}
            </Button>
          </form>

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
