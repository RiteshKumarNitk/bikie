import { NextResponse } from "next/server";
import { getSafetyLocationModule } from "@bikie/services";

/** The staged-escalation ticker (ADR-033) — widens radius / advances tier for any ACTIVE,
 * unassigned alert whose nextEscalationAt has passed. Same cron-bearer pattern as
 * GET /api/cron/sos-resolve; schedule both together. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || (request.headers.get("authorization") ?? "") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const module = getSafetyLocationModule();
  const due = await module.ports.sosAlerts.findAlertsDueForEscalation(new Date());

  const results = await Promise.allSettled(due.map((alert) => module.escalation.tickEscalation(alert)));
  const failed = results.filter((r) => r.status === "rejected").length;
  for (const r of results) {
    if (r.status === "rejected") console.error("[SOS][ESCALATE][ERROR]", r.reason);
  }

  return NextResponse.json({ processed: due.length, failed });
}
