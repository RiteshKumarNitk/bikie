import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the team building India's premium motorcycle travel platform.",
};

const openings = [
  { title: "Senior Full-Stack Engineer", team: "Engineering", location: "Remote / Jaipur" },
  { title: "Product Designer", team: "Design", location: "Remote" },
  { title: "Partner Success Manager", team: "Operations", location: "Bangalore" },
  { title: "Growth Marketer", team: "Marketing", location: "Remote" },
];

export default function CareersPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Careers" }]} />

      <div className="mx-auto max-w-4xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Careers at BIKIE</h1>
        <p className="mt-2 max-w-xl text-foreground/60">
          We&apos;re a small team building a large ambition — India&apos;s definitive motorcycle
          travel platform. If that excites you, we&apos;d love to hear from you.
        </p>

        <div className="mt-10 space-y-4">
          {openings.map((role) => (
            <div key={role.title} className="flex items-center justify-between rounded-2xl bg-card p-5">
              <div>
                <p className="font-medium">{role.title}</p>
                <p className="text-sm text-foreground/60">
                  {role.team} · {role.location}
                </p>
              </div>
              <a href="mailto:careers@bikie.app" className="text-sm font-medium text-accent">
                Apply →
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
