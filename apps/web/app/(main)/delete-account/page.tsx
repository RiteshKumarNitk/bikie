import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "Delete Your BIKIE Account",
  description: "Learn how to request deletion of your BIKIE account and what happens to your data.",
};

export default function DeleteAccountPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Delete Account" }]} />

      <div className="mx-auto max-w-3xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Delete Your BIKIE Account</h1>
        <p className="mt-4 text-foreground/80 leading-relaxed">
          If you no longer wish to use BIKIE, you can request the deletion of your account and associated data.
        </p>

        <div className="mt-10 space-y-12">
          <section>
            <h2 className="text-2xl font-semibold">How to Request Account Deletion</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-card p-6 border border-border/50">
                <h3 className="font-medium text-lg text-foreground">Step 1: Contact Support</h3>
                <p className="mt-2 text-foreground/80">
                  Send an email to our support team at <a href="mailto:support@bikie.app" className="text-primary hover:underline font-medium">support@bikie.app</a>.
                </p>
              </div>
              <div className="rounded-3xl bg-card p-6 border border-border/50">
                <h3 className="font-medium text-lg text-foreground">Step 2: Provide Account Details</h3>
                <p className="mt-2 text-foreground/80">
                  Please email us from the address associated with your account, and include the mobile number linked to your BIKIE profile to help us verify your identity.
                </p>
              </div>
              <div className="rounded-3xl bg-card p-6 border border-border/50">
                <h3 className="font-medium text-lg text-foreground">Step 3: Processing</h3>
                <p className="mt-2 text-foreground/80">
                  Our team will verify your request and process the deletion according to our data retention policies. We will notify you once the process is complete.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">What Happens to Your Data?</h2>
            <div className="mt-4 space-y-4 text-foreground/80 leading-relaxed">
              <p>
                When your account deletion request is processed, the outcome depends on whether you have an active history on the platform:
              </p>
              <ul className="list-disc pl-5 space-y-3">
                <li>
                  <strong className="text-foreground">Accounts Without History:</strong> If you have no history (no bookings, reviews, or organized rides), your account and all associated data (sessions, push subscriptions, wishlist, memberships) will be permanently and completely deleted.
                </li>
                <li>
                  <strong className="text-foreground">Accounts With History:</strong> If your account has authored records that other users depend on (such as bookings or reviews), your data will be <strong>anonymized</strong> to preserve the integrity of the platform for others.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Data Anonymization & Retention</h2>
            <div className="mt-4 space-y-4 text-foreground/80 leading-relaxed">
              <p>
                If your account is anonymized due to having an active history:
              </p>
              <ul className="list-disc pl-5 space-y-3">
                <li>
                  <strong className="text-foreground">Data Deleted / Anonymized:</strong> All Personally Identifiable Information (PII) is stripped. Your name becomes "Deleted User", and your email address, phone number, and profile image are permanently erased. Your active sessions, connected accounts, push subscriptions, and memberships are completely removed.
                </li>
                <li>
                  <strong className="text-foreground">Data Retained & Retention Period:</strong> The anonymous shell of your account remains indefinitely, solely to serve as an attribution for past history (e.g., a "Deleted User" booking or review). This retention is required for safety, audit history, and to prevent corruption of other users' records.
                </li>
                <li>
                  <strong className="text-foreground">Access:</strong> The account is permanently banned, meaning it can never be authenticated or accessed again.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Contact Us</h2>
            <p className="mt-4 text-foreground/80 leading-relaxed">
              If you have any questions regarding the account deletion process or our data retention practices, please reach out to us at <a href="mailto:support@bikie.app" className="text-primary hover:underline font-medium">support@bikie.app</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
