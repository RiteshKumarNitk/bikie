import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { partnerSuccessStories } from "@/lib/partner-content";

export const metadata: Metadata = {
  title: "Success Stories",
  description: "How rental fleets, mechanics, and tour guides have grown their business with BIKIE.",
};

export default function PartnerSuccessStoriesPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/partners" }, { label: "Success Stories" }]} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Partners who&apos;ve grown with BIKIE</h1>
        <p className="mt-3 max-w-2xl text-foreground/60">
          Real businesses, real results — from single-fleet operators to multi-city tour guides.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {partnerSuccessStories.map((story) => (
            <div key={story.name} className="rounded-3xl bg-card p-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent-text">{story.stat}</p>
              <p className="mt-4 text-foreground/80">&ldquo;{story.quote}&rdquo;</p>
              <p className="mt-6 font-semibold">{story.name}</p>
              <p className="text-sm text-foreground/50">{story.location}</p>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <Link
            href="/signup?role=partner"
            className="inline-flex rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent/90"
          >
            Register Business
          </Link>
        </div>
      </div>
    </div>
  );
}
