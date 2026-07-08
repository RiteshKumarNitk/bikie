import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { FAQAccordion } from "@/components/home/FAQAccordion";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Answers about bookings, payments, refunds, membership, emergencies, trips, partners, and your account.",
};

const categories = [
  "Bookings",
  "Payments",
  "Refunds",
  "Membership",
  "Emergency",
  "Trips",
  "Partners",
  "Account",
];

export default function FAQPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Help Center" }]} />

      <div className="mx-auto max-w-3xl px-6 pt-6">
        <h1 className="text-center text-3xl font-semibold md:text-4xl">Help Center</h1>
        <p className="mt-2 text-center text-foreground/60">
          Find answers by category, or reach our{" "}
          <a href="/contact" className="text-accent">
            support team
          </a>{" "}
          directly.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <span key={category} className="rounded-full bg-card px-4 py-2 text-sm font-medium">
              {category}
            </span>
          ))}
        </div>

        <div className="mt-10">
          <FAQAccordion />
        </div>
      </div>
    </div>
  );
}
