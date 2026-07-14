"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TripDetailDTO } from "@bikie/types";

export default function ManageTabs({ trip }: { trip: TripDetailDTO }) {
  const pathname = usePathname();

  const tabs = [
    { name: "Overview", href: `/trips/${trip.slug}/manage` },
    { name: `Members (${trip.seatsTotal - trip.seatsLeft + 1})`, href: `/trips/${trip.slug}/manage/members` },
    { name: "Requests", href: `/trips/${trip.slug}/manage/requests` },
    { name: "Chat", href: `/trips/${trip.slug}/manage/chat` },
    { name: "Timeline", href: `/trips/${trip.slug}/manage/timeline` },
    { name: "Settings", href: `/trips/${trip.slug}/edit` },
  ];

  return (
    <div className="mt-8 border-b border-foreground/10 pb-0 flex overflow-x-auto gap-6 hide-scrollbar">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`pb-3 whitespace-nowrap text-sm font-medium border-b-2 ${
              isActive
                ? "border-accent text-accent-text"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
