import { Reveal } from "@/components/shared/Reveal";
import { FAQAccordion } from "./FAQAccordion";

export function FAQ() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <Reveal>
        <h2 className="text-center text-3xl font-semibold md:text-4xl">
          Frequently Asked Questions
        </h2>
      </Reveal>
      <div className="mt-10">
        <FAQAccordion />
      </div>
    </section>
  );
}
