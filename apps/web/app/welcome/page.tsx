import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { selectRole } from "@/lib/actions/role-actions";
import { isSafeNext } from "@/lib/role";
import styles from "./welcome.module.css";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bikie - Welcome",
  description: "Are you here to ride or to grow your motorcycle business...?",
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
    await selectRole("SERVICE_PROVIDER", next);
  }

  return (
    <div className={`relative flex h-screen items-center justify-center overflow-hidden px-4 py-3 sm:px-6 sm:py-4 ${styles.splash}`}>
      <Image
        src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000&auto=format&fit=crop"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover mix-blend-overlay opacity-40"
      />

      <div className="relative w-full max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <div className={`relative flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20 md:h-24 md:w-24 ${styles.logoWrap}`}>
            <div className={`flex h-full w-full items-center justify-center rounded-full ${styles.logoCircle}`}>
              <svg viewBox="0 0 100 100" className="h-9 w-9 sm:h-11 sm:w-11 md:h-14 md:w-14" aria-hidden="true">
                <text
                  x="50"
                  y="80"
                  textAnchor="middle"
                  className={bebasNeue.className}
                  style={{ fontSize: "90px", fill: "#fff" }}
                >
                  B
                </text>
              </svg>
            </div>
          </div>
          <h1 className="mt-1.5 font-display text-xl font-bold tracking-tight text-white sm:mt-2 sm:text-2xl md:text-3xl">
            BIKIE
          </h1>
          <p className="mt-1 text-[0.55rem] font-medium uppercase tracking-[0.15em] text-white/60 sm:text-[0.6rem] sm:tracking-[0.2em] md:text-[0.65rem]">
            Anytime anywhere --- your only companion
          </p>
          <p className="mt-1.5 text-xs text-white/70 sm:mt-3 sm:text-sm">
            Welcome! How would you like to join BIKIE?
          </p>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-3 md:mt-5">
          <form action={chooseRider} className="h-full">
            <button
              type="submit"
              className={`group flex h-full w-full flex-col items-start rounded-2xl p-3 text-left transition-transform duration-300 hover:-translate-y-1 sm:rounded-3xl sm:p-5 md:p-7 ${styles.card}`}
            >
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm sm:h-9 sm:w-9 sm:rounded-xl sm:text-lg md:h-11 md:w-11 md:rounded-2xl md:text-xl ${styles.iconBiker}`}>
                🏍️
              </div>
              <h2 className="mt-1.5 font-display text-sm font-semibold text-white sm:mt-3 sm:text-base md:mt-4 md:text-lg lg:text-xl">
                I&apos;m a Biker
              </h2>
              <p className="mt-1 line-clamp-2 text-[0.7rem] leading-relaxed text-white/70 sm:text-xs md:line-clamp-none md:text-sm">
                Rent a motorbike, create group trips, connect with riders, and access the
                BIKIE safety panic network.
              </p>
              <span
                className={`mt-2 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.7rem] font-semibold text-white transition-transform duration-300 group-hover:translate-x-1 sm:mt-3 sm:gap-2 sm:px-4 sm:py-2 sm:text-xs md:mt-4 md:px-5 md:py-2.5 md:text-sm ${styles.tagBiker}`}
              >
                Join as Rider
                <span aria-hidden="true">→</span>
              </span>
            </button>
          </form>

          <form action={choosePartner} className="h-full">
            <button
              type="submit"
              className={`group flex h-full w-full flex-col items-start rounded-2xl p-3 text-left transition-transform duration-300 hover:-translate-y-1 sm:rounded-3xl sm:p-5 md:p-7 ${styles.card}`}
            >
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm sm:h-9 sm:w-9 sm:rounded-xl sm:text-lg md:h-11 md:w-11 md:rounded-2xl md:text-xl ${styles.iconProvider}`}>
                🔧
              </div>
              <h2 className="mt-1.5 font-display text-sm font-semibold text-white sm:mt-3 sm:text-base md:mt-4 md:text-lg lg:text-xl">
                Service Provider
              </h2>
              <p className="mt-1 line-clamp-2 text-[0.7rem] leading-relaxed text-white/70 sm:text-xs md:line-clamp-none md:text-sm">
                List bikes for rent, offer roadside assistance, create curated trips, and
                grow your business with BIKIE.
              </p>
              <span
                className={`mt-2 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.7rem] font-semibold text-white transition-transform duration-300 group-hover:translate-x-1 sm:mt-3 sm:gap-2 sm:px-4 sm:py-2 sm:text-xs md:mt-4 md:px-5 md:py-2.5 md:text-sm ${styles.tagProvider}`}
              >
                Join as Provider
                <span aria-hidden="true">→</span>
              </span>
            </button>
          </form>
        </div>

        <p className="mt-2 text-center text-[0.7rem] text-white/60 sm:mt-4 sm:text-xs">
          Already have an account?{" "}
          <Link href="/login" className={`font-medium hover:underline ${styles.loginLink}`}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
