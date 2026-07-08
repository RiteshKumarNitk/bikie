import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How BIKIE uses cookies and similar technologies.",
};

export default function CookiePolicyPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cookie Policy" }]} />

      <div className="mx-auto max-w-3xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Cookie Policy</h1>
        <p className="mt-2 text-sm text-foreground/50">Last updated: January 2026</p>

        <div className="mt-8 space-y-6 text-foreground/70">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Essential Cookies</h2>
            <p className="mt-2">
              Used to keep you signed in and remember your theme preference. These cannot be
              disabled without affecting core functionality.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Analytics Cookies</h2>
            <p className="mt-2">
              Help us understand how riders use BIKIE so we can improve search and booking flows.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Managing Cookies</h2>
            <p className="mt-2">
              You can clear cookies at any time through your browser settings. Doing so will sign you
              out and reset your theme preference.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
