import { Reveal } from "@/components/shared/Reveal";

const points = [
  {
    title: "Verified Community",
    body: "Ride with confidence. Every member is verified to ensure a safe and friendly group trip experience.",
  },
  {
    title: "Seamless Planning",
    body: "No hassle planning. Join an existing itinerary or create your own route and invite others.",
  },
  {
    title: "Built for Safety",
    body: "Travel together, stay safe together. Built-in SOS features and roadside assistance on every trip.",
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
