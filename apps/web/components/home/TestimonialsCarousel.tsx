"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import type { TestimonialDTO } from "@bikie/types";

export function TestimonialsCarousel({ testimonials }: { testimonials: TestimonialDTO[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="overflow-hidden">
      <motion.div
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0.1}
        className="flex cursor-grab gap-6 active:cursor-grabbing"
      >
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="w-80 shrink-0 rounded-3xl bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]"
          >
            <div className="flex items-center gap-3">
              {testimonial.authorAvatarUrl && (
                <div className="relative h-11 w-11 overflow-hidden rounded-full">
                  <Image
                    src={testimonial.authorAvatarUrl}
                    alt={testimonial.authorName}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{testimonial.authorName}</p>
                <p className="text-xs text-foreground/60">{testimonial.authorLocation}</p>
              </div>
            </div>
            <p className="mt-1 text-sm text-accent">{"★".repeat(testimonial.rating)}</p>
            <p className="mt-3 text-sm text-foreground/80">{testimonial.quote}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
