import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { selectRole } from "@/lib/actions/role-actions";
import { isSafeNext } from "@/lib/role";

export const metadata: Metadata = {
  title: "Welcome",
  description: "Are you here to ride, or to grow your motorcycle business?",
};

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: rawNext } = await searchParams;
  const next = isSafeNext(rawNext) ? rawNext : undefined;

  async function chooseRider() {
    "use server";
    await selectRole("RIDER", next);
  }

  async function choosePartner() {
    "use server";
    await selectRole("PARTNER", next);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <Image
        src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000&auto=format&fit=crop"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-background/80" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, color-mix(in srgb, var(--color-accent) 30%, transparent), transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full bg-accent"
            style={{ boxShadow: "0 0 60px color-mix(in srgb, var(--color-accent) 55%, transparent)" }}
          >
            <span className="font-display text-5xl font-bold leading-none text-white">B</span>
          </div>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            BIKIE
          </h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-foreground/50">
            Anytime anywhere — your only companion
          </p>
          <p className="mt-6 text-base text-foreground/70">
            Welcome! How would you like to join BIKIE?
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <form action={chooseRider} className="h-full">
            <button
              type="submit"
              className="glass group flex h-full w-full flex-col items-start rounded-3xl p-6 text-left transition-transform duration-300 hover:-translate-y-1 md:p-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-2xl">
                🏍️
              </div>
              <h2 className="mt-5 font-display text-xl font-semibold text-foreground md:text-2xl">
                I&apos;m a Biker
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                Rent a motorbike, create group trips, connect with riders, and access the
                BIKIE safety panic network.
              </p>
              <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-transform duration-300 group-hover:translate-x-1">
                Join as Rider
                <span aria-hidden="true">→</span>
              </span>
            </button>
          </form>

          <form action={choosePartner} className="h-full">
            <button
              type="submit"
              className="glass group flex h-full w-full flex-col items-start rounded-3xl p-6 text-left transition-transform duration-300 hover:-translate-y-1 md:p-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-2xl">
                🔧
              </div>
              <h2 className="mt-5 font-display text-xl font-semibold text-foreground md:text-2xl">
                Service Provider
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                List bikes for rent, offer roadside assistance, create curated trips, and
                grow your business with BIKIE.
              </p>
              <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-transform duration-300 group-hover:translate-x-1">
                Join as Provider
                <span aria-hidden="true">→</span>
              </span>
            </button>
          </form>
        </div>

        <p className="mt-10 text-center text-sm text-foreground/60">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent-text hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
