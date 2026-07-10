"use client";

import React, { forwardRef } from "react";
import Image from "next/image";

export interface StickyScrollProps {
  images: string[];
}

const StickyScroll = forwardRef<HTMLElement, StickyScrollProps>(({ images }, ref) => {
  // Pad the array to ensure we have enough images for the 3 columns (5, 3, 5 = 13 total)
  const paddedImages = [...images];
  while (paddedImages.length < 13) {
    paddedImages.push(...images);
  }
  const displayImages = paddedImages.slice(0, 13);

  const leftImages = displayImages.slice(0, 5);
  const middleImages = displayImages.slice(5, 8);
  const rightImages = displayImages.slice(8, 13);

  return (
    <main className="bg-background" ref={ref}>
      <div className="wrapper">
        <section className="text-foreground h-[80vh] w-full bg-background grid place-content-center sticky top-[10vh]">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          <h1 className="2xl:text-7xl text-5xl px-8 font-semibold text-center tracking-tight leading-[120%] relative z-10">
            Ride Your Style
            <br />
            Explore the Community <br />
            <span className="text-3xl mt-4 inline-block text-foreground/60">Scroll down! 👇</span>
          </h1>
        </section>
      </div>

      <section className="text-foreground w-full bg-background relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 pb-24">
          <div className="grid gap-4 md:col-span-4">
            {leftImages.map((src, idx) => (
              <figure key={`left-${idx}`} className="w-full relative h-72 md:h-96">
                <Image
                  src={src}
                  alt="Community ride"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  fill
                  className="transition-all duration-300 w-full h-full align-bottom object-cover rounded-3xl"
                />
              </figure>
            ))}
          </div>
          <div className="hidden md:grid sticky top-24 h-[calc(100vh-8rem)] w-full col-span-4 gap-4 grid-rows-3">
            {middleImages.map((src, idx) => (
              <figure key={`mid-${idx}`} className="w-full h-full relative">
                <Image
                  src={src}
                  alt="Community ride"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  fill
                  className="transition-all duration-300 h-full w-full align-bottom object-cover rounded-3xl shadow-2xl"
                />
              </figure>
            ))}
          </div>
          <div className="grid gap-4 md:col-span-4 mt-4 md:mt-0">
            {rightImages.map((src, idx) => (
              <figure key={`right-${idx}`} className="w-full relative h-72 md:h-96">
                <Image
                  src={src}
                  alt="Community ride"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  fill
                  className="transition-all duration-300 w-full h-full align-bottom object-cover rounded-3xl"
                />
              </figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
});

StickyScroll.displayName = "StickyScroll";

export default StickyScroll;
