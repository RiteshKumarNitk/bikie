"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SearchBar } from "./SearchBar";
import { LandingAccordionItem } from "@/components/ui/interactive-image-accordion";

export function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline()
        .from("[data-hero-title]", { opacity: 0, y: 32, duration: 0.8, ease: "power3.out" })
        .from(
          "[data-hero-subtitle]",
          { opacity: 0, y: 20, duration: 0.6, ease: "power3.out" },
          "-=0.5",
        )
        .from("[data-hero-accordion]", { opacity: 0, x: 32, duration: 0.8, ease: "power3.out" }, "-=0.6")
        .from("[data-hero-search]", { opacity: 0, y: 24, duration: 0.6, ease: "power3.out" }, "-=0.4");
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-center overflow-hidden py-12 md:py-24"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6">
        <div className="flex flex-col items-center justify-between gap-12 md:flex-row">
          {/* Left Side: Text Content */}
          <div className="w-full text-center md:w-1/2 md:text-left">
            <h1 data-hero-title className="text-4xl font-bold leading-tight tracking-tighter text-foreground md:text-6xl">
              Join Group Road Trips Across India
            </h1>
            <p data-hero-subtitle className="mx-auto mt-6 max-w-xl text-lg text-foreground/70 md:mx-0">
              Connect with fellow riders, form a group, and explore India's most beautiful destinations together. Ride safe with our community and SOS support.
            </p>
          </div>

          {/* Right Side: Image Accordion */}
          <div className="w-full md:w-1/2" data-hero-accordion>
            <LandingAccordionItem />
          </div>
        </div>

        {/* Search Bar at the bottom */}
        {/* <div data-hero-search className="mx-auto w-full max-w-5xl">
          <SearchBar />
        </div> */}
      </div>
    </section>
  );
}
