import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How BIKIE collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />

      <div className="mx-auto max-w-3xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-foreground/50">Last updated: January 2026</p>

        <div className="mt-8 space-y-6 text-foreground/70">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p className="mt-2">
              We collect information you provide directly — name, email, and password at signup;
              booking details when you rent a bike; and payment information when processing a
              transaction (handled by our payment partner, never stored on our servers).
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">2. How We Use Information</h2>
            <p className="mt-2">
              To operate bookings, communicate with you about your trips, improve our platform, and
              — with consent — send offers and updates.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Sharing</h2>
            <p className="mt-2">
              We share booking details with the relevant rental partner to fulfill your reservation.
              We do not sell personal data to third parties.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Your Rights</h2>
            <p className="mt-2">
              You may request a copy of your data or account deletion at any time by contacting{" "}
              <a href="mailto:privacy@bikie.app" className="text-accent-text">
                privacy@bikie.app
              </a>
              .
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Cookies</h2>
            <p className="mt-2">
              See our{" "}
              <a href="/cookie-policy" className="text-accent-text">
                Cookie Policy
              </a>{" "}
              for details on how we use cookies.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
