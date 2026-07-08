"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { formatCurrency } from "@bikie/utils";
import type { BikeSummaryDTO } from "@bikie/types";

export function BikeCard({ bike }: { bike: BikeSummaryDTO }) {
  return (
    <Link href={`/bikes/${bike.slug}`}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="overflow-hidden rounded-3xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]"
      >
        <div className="relative aspect-[4/3]">
          <Image
            src={bike.imageUrl}
            alt={bike.name}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover"
          />
          {bike.instantBooking && (
            <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-black">
              Instant Booking
            </span>
          )}
        </div>
        <div className="space-y-1 p-5">
          <div className="flex items-center justify-between">
            <p className="font-medium">{bike.name}</p>
            <span className="flex items-center gap-1 text-sm">★ {bike.ratingAvg.toFixed(1)}</span>
          </div>
          <p className="text-sm text-foreground/60">
            {bike.brand} · {bike.city}
          </p>
          <p className="pt-2 text-sm font-semibold">
            {formatCurrency(bike.pricePerDay)}{" "}
            <span className="font-normal text-foreground/60">/ day</span>
          </p>
        </div>
      </motion.div>
    </Link>
  );
}
