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
          
          <div className="my-8 border-t border-foreground/10" />

          <h2 className="text-xl font-semibold md:text-2xl text-foreground">Community & Group Rides</h2>
          
          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Organizer Responsibilities</h2>
            <p className="mt-2">
              By creating and organizing a group ride, you agree that you are solely responsible for managing the itinerary, ensuring safety protocols, and communicating effectively with participants. BIKIE acts strictly as a platform to facilitate community connections and does not organize or sponsor these rides.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Rider Conduct</h2>
            <p className="mt-2">
              All participants in community rides must adhere to local traffic laws, wear appropriate safety gear (including helmets), and ride responsibly. Organizers reserve the right to remove any rider from a trip for unsafe behavior.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Financial Contributions</h2>
            <p className="mt-2">
              Any estimated costs or prices listed for community rides are handled directly between the organizer and the participants. BIKIE does not currently process payments for community group rides, and any financial disputes must be resolved among the involved parties.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
