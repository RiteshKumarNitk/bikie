"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SearchBar } from "./SearchBar";

export function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline()
        .from("[data-hero-eyebrow]", { opacity: 0, y: 16, duration: 0.6, ease: "power3.out" })
        .from(
          "[data-hero-title]",
          { opacity: 0, y: 32, duration: 0.8, ease: "power3.out" },
          "-=0.3",
        )
        .from(
          "[data-hero-subtitle]",
          { opacity: 0, y: 20, duration: 0.6, ease: "power3.out" },
          "-=0.5",
        )
        .from("[data-hero-search]", { opacity: 0, y: 24, duration: 0.6, ease: "power3.out" }, "-=0.4");

      gsap.to("[data-hero-bg]", {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      <div
        data-hero-bg
        className="absolute inset-0 -z-10 scale-110 bg-[url('https://picsum.photos/seed/bikie-hero/1920/1080')] bg-cover bg-center"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 text-center text-white">
        <span
          data-hero-eyebrow
          className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest backdrop-blur"
        >
          Find your next ride
        </span>
        <h1 data-hero-title className="text-4xl font-semibold leading-tight md:text-6xl">
          Explore India on Two Wheels
        </h1>
        <p data-hero-subtitle className="max-w-xl text-base text-white/80 md:text-lg">
          Rent premium motorcycles anywhere — adventure bikes, cruisers, and scooters, ready for
          your next road trip.
        </p>
        <div data-hero-search className="w-full">
          <SearchBar />
        </div>
      </div>
    </section>
  );
}
