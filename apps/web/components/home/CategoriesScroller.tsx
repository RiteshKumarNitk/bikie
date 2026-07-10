"use client";

import { useRef } from "react";
import Image from "next/image";
import type { CategoryDTO } from "@bikie/types";

export function CategoriesScroller({ categories }: { categories: CategoryDTO[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Duplicate the categories array to create a seamless infinite marquee effect
  const marqueeItems = [...categories, ...categories];

  return (
    <div ref={containerRef} className="overflow-hidden">
      <div className="flex w-max gap-4 animate-marquee">
        {marqueeItems.map((category, index) => (
          <div
            key={`${category.id}-${index}`}
            className="flex w-40 shrink-0 flex-col items-center gap-3 rounded-3xl bg-card p-5 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] transition-transform hover:scale-105"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-full">
              <Image sizes="64px" src={category.imageUrl} alt={category.name} fill className="object-cover" />
            </div>
            <p className="text-sm font-medium">{category.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
