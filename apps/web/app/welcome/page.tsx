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
    <div className="relative flex min-h-screen flex-col md:flex-row">
      <form action={chooseRider} className="group relative flex-1">
        <button type="submit" className="relative block h-full min-h-[50vh] w-full text-left md:min-h-screen">
          <Image
            src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=1600&auto=format&fit=crop"
            alt=""
            fill
            priority
            sizes="(max-width: 767px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 transition-colors duration-500 group-hover:from-black/90" />
          <div className="relative flex h-full min-h-[50vh] flex-col justify-end p-8 md:min-h-screen md:p-16">
            <div className="glass w-fit rounded-2xl px-4 py-2 text-3xl">🏍️</div>
            <h2 className="mt-6 font-display text-3xl font-bold text-white md:text-5xl">Continue as Rider</h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/70 md:text-lg">
              Join India&apos;s motorcycle riding community. Discover rides, connect with fellow
              riders, create adventures, and explore destinations.
            </p>
            <span className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-transform duration-300 group-hover:translate-x-1">
              Continue as Rider
              <span aria-hidden="true">→</span>
            </span>
          </div>
        </button>
      </form>

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-xs font-semibold uppercase tracking-wide text-white/70 backdrop-blur-md md:flex">
        or
      </div>

      <form action={choosePartner} className="group relative flex-1">
        <button type="submit" className="relative block h-full min-h-[50vh] w-full text-left md:min-h-screen">
          <Image
            src="https://images.unsplash.com/photo-1777499697680-b5072cf11247?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt=""
            fill
            priority
            sizes="(max-width: 767px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 transition-colors duration-500 group-hover:from-black/90" />
          <div className="relative flex h-full min-h-[50vh] flex-col justify-end p-8 md:min-h-screen md:p-16">
            <div className="glass w-fit rounded-2xl px-4 py-2 text-3xl">🛠️</div>
            <h2 className="mt-6 font-display text-3xl font-bold text-white md:text-5xl">
              Continue as Service Provider
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/70 md:text-lg">
              Manage your motorcycle business, organize rides, connect with riders, and grow
              your community.
            </p>
            <span className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-transform duration-300 group-hover:translate-x-1">
              Continue as Service Provider
              <span aria-hidden="true">→</span>
            </span>
          </div>
        </button>
      </form>

      <div className="pointer-events-none absolute inset-x-0 top-6 z-10 flex justify-center">
        <p className="pointer-events-auto rounded-full bg-black/40 px-5 py-2 text-sm text-white/70 backdrop-blur-md">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-white hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
