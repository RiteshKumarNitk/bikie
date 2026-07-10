import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms governing your use of the BIKIE platform.",
};

export default function TermsPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Terms & Conditions" }]} />

      <div className="mx-auto max-w-3xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-foreground/50">Last updated: January 2026</p>

        <div className="mt-8 space-y-6 text-foreground/70">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Eligibility</h2>
            <p className="mt-2">
              You must be at least 18 years old and hold a valid driving license to book a motorcycle
              on BIKIE.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Bookings</h2>
            <p className="mt-2">
              A booking is confirmed once payment is processed. Pickup requires a valid license and
              government ID matching the account holder.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Cancellations</h2>
            <p className="mt-2">
              Free cancellation up to 48 hours before pickup. See individual bike listings for exact
              cancellation terms.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Liability</h2>
            <p className="mt-2">
              Renters are responsible for damage beyond normal wear, traffic violations incurred
              during the rental period, and any loss of accessories provided.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Partner Obligations</h2>
            <p className="mt-2">
              Partners must maintain listed vehicles in roadworthy condition and honor confirmed
              bookings at the agreed price.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
