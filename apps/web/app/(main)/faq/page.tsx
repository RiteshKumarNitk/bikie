import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { FAQAccordion, type FAQItem } from "@/components/home/FAQAccordion";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Answers about bookings, payments, refunds, membership, emergencies, trips, partners, and your account.",
};

const categories: { name: string; faqs: FAQItem[] }[] = [
  {
    name: "Bookings",
    faqs: [
      {
        question: "How does instant booking work?",
        answer:
          "Once you find a bike, reserve it directly through the platform — no waiting for a provider to confirm.",
      },
      {
        question: "What documents do I need to rent a bike?",
        answer: "A valid driving license and a government ID are required at pickup.",
      },
      {
        question: "Can I modify or cancel a booking?",
        answer: "Yes — manage upcoming bookings from your dashboard up until the pickup window begins.",
      },
    ],
  },
  {
    name: "Payments",
    faqs: [
      {
        question: "What payment methods are accepted?",
        answer: "Cards, UPI, and net banking are all supported at checkout.",
      },
      {
        question: "When am I charged?",
        answer: "Payment is captured when your booking is confirmed, not before.",
      },
    ],
  },
  {
    name: "Refunds",
    faqs: [
      {
        question: "How do refunds work?",
        answer: "Eligible cancellations are refunded to your original payment method within 5-7 business days.",
      },
    ],
  },
  {
    name: "Membership",
    faqs: [
      {
        question: "What is BIKIE Membership?",
        answer: "A paid plan that unlocks perks like organizing community rides and priority support.",
      },
      {
        question: "Can I cancel my membership anytime?",
        answer: "Yes — cancel from your account settings and it stays active until the current billing period ends.",
      },
    ],
  },
  {
    name: "Emergency",
    faqs: [
      {
        question: "What happens if I have an issue mid-ride?",
        answer: "Use the SOS button in the app to alert our support team and share your live location instantly.",
      },
    ],
  },
  {
    name: "Trips",
    faqs: [
      {
        question: "How do I join a community ride?",
        answer: "Browse rides, request to join, and the organizer will approve or decline your request.",
      },
      {
        question: "Can I organize my own ride?",
        answer: "Yes — enable an active BIKIE membership, then create a ride from the Rides page.",
      },
    ],
  },
  {
    name: "Partners",
    faqs: [
      {
        question: "Can I list my own bike?",
        answer: "Yes — enable Partner Mode from your account to list bikes and manage bookings.",
      },
      {
        question: "How do partner payouts work?",
        answer: "Payouts are calculated after each completed booking and settled to your linked bank account.",
      },
    ],
  },
  {
    name: "Account",
    faqs: [
      {
        question: "Is insurance included?",
        answer: "Every booking includes basic insurance coverage; extended coverage is available.",
      },
      {
        question: "How do I update my profile details?",
        answer: "Head to Dashboard → Settings to update your name, phone number, and documents.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Help Center" }]} />

      <div className="mx-auto max-w-3xl px-6 pt-6">
        <h1 className="text-center text-3xl font-semibold md:text-4xl">Help Center</h1>
        <p className="mt-2 text-center text-foreground/60">
          Find answers by category, or reach our{" "}
          <a href="/contact" className="text-accent-text">
            support team
          </a>{" "}
          directly.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <a
              key={category.name}
              href={`#${category.name.toLowerCase()}`}
              className="rounded-full bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/15 hover:text-accent-text"
            >
              {category.name}
            </a>
          ))}
        </div>

        <div className="mt-10 space-y-12">
          {categories.map((category) => (
            <section key={category.name} id={category.name.toLowerCase()} className="scroll-mt-24">
              <h2 className="mb-4 text-lg font-semibold">{category.name}</h2>
              <FAQAccordion faqs={category.faqs} idPrefix={`${category.name}-`} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
