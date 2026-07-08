import Image from "next/image";
import { Reveal } from "@/components/shared/Reveal";

const moments = [
  "https://picsum.photos/seed/community-1/600/700",
  "https://picsum.photos/seed/community-2/600/700",
  "https://picsum.photos/seed/community-3/600/700",
  "https://picsum.photos/seed/community-4/600/700",
];

export function Community() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <Reveal>
        <h2 className="text-3xl font-semibold md:text-4xl">Community Experiences</h2>
        <p className="mt-2 text-foreground/60">Real riders, real roads, real stories.</p>
      </Reveal>
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {moments.map((src, index) => (
          <Reveal key={src} delay={index * 0.05}>
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl">
              <Image src={src} alt="Rider moment" fill className="object-cover" />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
