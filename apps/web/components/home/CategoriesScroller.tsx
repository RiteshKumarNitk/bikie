"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import type { CategoryDTO } from "@bikie/types";

export function CategoriesScroller({ categories }: { categories: CategoryDTO[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="overflow-hidden">
      <motion.div
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0.1}
        className="flex cursor-grab gap-4 active:cursor-grabbing"
      >
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex w-40 shrink-0 flex-col items-center gap-3 rounded-3xl bg-card p-5 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-full">
              <Image src={category.imageUrl} alt={category.name} fill className="object-cover" />
            </div>
            <p className="text-sm font-medium">{category.name}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
