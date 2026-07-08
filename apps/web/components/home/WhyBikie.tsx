import { Reveal } from "@/components/shared/Reveal";

const points = [
  {
    title: "Curated, not crowded",
    body: "Every bike is verified for condition and reliability before it ever appears in search.",
  },
  {
    title: "Instant booking",
    body: "No back-and-forth with providers — reserve in a few taps and get pickup instructions right away.",
  },
  {
    title: "Built for road trips",
    body: "Destination guides, route tips, and nearby stops come with every booking.",
  },
];

export function WhyBikie() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <Reveal>
        <h2 className="text-3xl font-semibold md:text-4xl">Why BIKIE</h2>
      </Reveal>
      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
        {points.map((point, index) => (
          <Reveal key={point.title} delay={index * 0.08}>
            <div className="rounded-3xl bg-card p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
              <p className="text-lg font-semibold">{point.title}</p>
              <p className="mt-2 text-sm text-foreground/60">{point.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
