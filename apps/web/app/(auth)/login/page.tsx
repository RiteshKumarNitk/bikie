"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInInput } from "@bikie/validation";
import { Button } from "@bikie/ui";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

const roles = [
  { value: "RENTER", label: "Rider", description: "Rent bikes & join trips" },
  { value: "PARTNER", label: "Partner", description: "List bikes & manage fleet" },
  { value: "ADMIN", label: "Admin", description: "Platform management" },
];

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("RENTER");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  async function onSubmit(values: SignInInput) {
    setServerError(null);
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setServerError(error.message ?? "Invalid email or password.");
      return;
    }
    window.location.href = "/";
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
            Welcome back to the ride.
          </h1>
          <p className="mt-4 text-lg text-white/60 leading-relaxed">
            Access your dashboard, manage bookings, or oversee your fleet — all from one account.
          </p>
          <div className="mt-8 flex gap-3">
            {["🏍️", "🌄", "🛣️"].map((emoji, i) => (
              <span key={i} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl backdrop-blur-sm">
                {emoji}
              </span>
            ))}
          </div>
        </div>
        <p className="text-sm text-white/30">© {new Date().getFullYear()} BIKIE</p>
      </div>

      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
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
            <h2 className="font-display text-2xl font-semibold">Sign in</h2>
            <p className="mt-1 text-sm text-foreground/50">Log in to your account</p>
          </div>

          <div className="mt-6 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-foreground/40">I am a</p>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                    selectedRole === role.value
                      ? "border-accent bg-accent/10 ring-1 ring-accent"
                      : "border-foreground/10 hover:border-foreground/20"
                  }`}
                >
                  <p className="text-sm font-medium">{role.label}</p>
                  <p className="mt-0.5 text-[10px] text-foreground/40">{role.description}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <button type="button" className="text-xs text-accent-text hover:text-accent-hover">
                  Forgot?
                </button>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
              {isSubmitting ? "Signing in..." : `Continue as ${roles.find((r) => r.value === selectedRole)?.label}`}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/50">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-accent-text hover:text-accent-hover">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
