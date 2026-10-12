import { NextResponse } from "next/server";
import { LegalService } from "@bikie/services";

/** ADR-090 — public. The currently published version of every legal document: what the web and
 * mobile signup screens show, and exactly the `versionIds` signup must send back as consent.
 * Never cached — a stale copy would make signups fail as "outdated" right after a publish. */
export const dynamic = "force-dynamic";

export async function GET() {
  const current = await LegalService.getCurrent();
  return NextResponse.json(current, { headers: { "Cache-Control": "no-store" } });
}
