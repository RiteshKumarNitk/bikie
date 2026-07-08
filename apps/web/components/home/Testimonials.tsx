import type { TestimonialDTO } from "@bikie/types";
import { Reveal } from "@/components/shared/Reveal";
import { TestimonialsCarousel } from "./TestimonialsCarousel";

export function Testimonials({ testimonials }: { testimonials: TestimonialDTO[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <Reveal>
        <h2 className="text-3xl font-semibold md:text-4xl">What Riders Say</h2>
      </Reveal>
      <div className="mt-10">
        <TestimonialsCarousel testimonials={testimonials} />
      </div>
    </section>
  );
}
