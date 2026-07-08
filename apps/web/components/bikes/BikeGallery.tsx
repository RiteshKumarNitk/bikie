"use client";

import { useState } from "react";
import Image from "next/image";

export function BikeGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const gallery = images.length > 0 ? images : ["https://picsum.photos/seed/bike-placeholder/800/600"];

  return (
    <div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-3xl">
        <Image src={gallery[active]} alt={alt} fill priority sizes="100vw" className="object-cover" />
      </div>
      {gallery.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {gallery.map((src, index) => (
            <button
              key={src + index}
              type="button"
              onClick={() => setActive(index)}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 ${
                active === index ? "border-accent" : "border-transparent"
              }`}
            >
              <Image src={src} alt={`${alt} ${index + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
