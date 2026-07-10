import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "Gift Cards",
  description: "Give the gift of a road trip — BIKIE gift cards from ₹500 to ₹5000.",
};

const amounts = [500, 1000, 2000, 5000];

export default function GiftCardsPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Gift Cards" }]} />

      <div className="mx-auto max-w-4xl px-6 pt-6 text-center">
        <h1 className="text-3xl font-semibold md:text-4xl">Gift Cards</h1>
        <p className="mx-auto mt-3 max-w-xl text-foreground/60">
          Give someone their next road trip. Redeemable on any bike or trip on BIKIE.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {amounts.map((amount) => (
            <div key={amount} className="rounded-3xl bg-card p-8">
              <p className="text-2xl font-semibold">₹{amount}</p>
              <button
                type="button"
                className="mt-4 w-full rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
              >
                Buy
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
