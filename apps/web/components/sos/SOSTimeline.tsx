"use client";

export interface TimelineEvent {
  id: string;
  type: string;
  actorName: string | null;
  createdAt: string;
}

const STEP_LABEL: Record<string, string> = {
  SOS_CREATED: "SOS Created",
  RADIUS_EXPANDED: "Search radius expanded",
  ESCALATED_SERVICE_PROVIDERS: "Escalated to service providers",
  ESCALATED_ADMIN: "Escalated to admins",
  HELPER_OFFERED: "Helper offered to assist",
  HELPER_WITHDRAWN: "Helper withdrew offer",
  HELPER_ACCEPTED: "Helper accepted",
  HELPER_REJECTED: "Offer declined",
  NAVIGATION_STARTED: "Navigation started",
  HELPER_ARRIVED: "Helper arrived",
  ASSISTANCE_STARTED: "Assistance started",
  ASSISTANCE_COMPLETED: "Assistance completed",
  SOS_RESOLVED: "SOS resolved",
  SOS_CANCELLED: "Cancelled",
  RATING_SUBMITTED: "Rating submitted",
};

/** Vertical stepper over an alert's SOSTimelineEvent[] (ADR-033) — the audited history of an
 * SOS from creation through resolution. */
export function SOSTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-foreground/40">No timeline events yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((event, idx) => (
        <li key={event.id} className="relative flex gap-3 pl-1">
          <div className="flex flex-col items-center">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                idx === events.length - 1 ? "bg-accent" : "bg-foreground/25"
              }`}
            />
            {idx < events.length - 1 && <span className="mt-1 w-px flex-1 bg-foreground/10" />}
          </div>
          <div className="pb-4">
            <p className="text-sm font-medium">{STEP_LABEL[event.type] ?? event.type}</p>
            <p className="mt-0.5 text-xs text-foreground/40">
              {event.actorName ? `${event.actorName} · ` : ""}
              {new Date(event.createdAt).toLocaleString("en-IN")}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
