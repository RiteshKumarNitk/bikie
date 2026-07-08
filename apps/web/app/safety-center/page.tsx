import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "Safety Center",
  description: "Riding tips, safety gear guidance, insurance info, emergency contacts, and first aid basics for BIKIE riders.",
};

const topics = [
  { title: "Riding Tips", desc: "Maintain a safe following distance, avoid riding after dark on unfamiliar mountain roads, and check tyre pressure before every trip." },
  { title: "Safety Gear", desc: "A DOT/ISI-certified helmet, riding jacket, gloves, and boots are strongly recommended on every booking." },
  { title: "Helmet Guide", desc: "Full-face helmets are required for highway and mountain routes; open-face is acceptable for short city rides only." },
  { title: "Insurance", desc: "Every booking includes basic third-party insurance. Extended coverage can be added at checkout." },
  { title: "Emergency Contacts", desc: "Dial 112 for national emergency services, or use the in-app Roadside Assistance button for BIKIE support." },
  { title: "Weather Tips", desc: "Check regional forecasts before mountain routes — passes like Khardung La can close with little notice." },
  { title: "First Aid", desc: "Carry a basic first-aid kit; our partner hubs in major destinations stock emergency supplies." },
];

export default function SafetyCenterPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Safety Center" }]} />

      <div className="mx-auto max-w-4xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Safety Center</h1>
        <p className="mt-2 text-foreground/60">Ride prepared. Everything you need to know before you set off.</p>

        <div className="mt-10 space-y-6">
          {topics.map((topic) => (
            <div key={topic.title} className="rounded-3xl bg-card p-6">
              <p className="font-semibold">{topic.title}</p>
              <p className="mt-2 text-sm text-foreground/70">{topic.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl bg-secondary p-6 text-white">
          <p className="font-semibold">Need help right now?</p>
          <p className="mt-2 text-sm text-white/70">Our Roadside Assistance team is available 24/7.</p>
          <a href="/roadside-assistance" className="mt-4 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90">
            Get Roadside Assistance
          </a>
        </div>
      </div>
    </div>
  );
}
