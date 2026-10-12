import { NextResponse } from "next/server";
import { LegalService } from "@bikie/services";
import { legalAcceptanceQuerySchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";

/** ADR-090 — compliance audit: who accepted which exact legal version, and when. Filterable by
 * user (name / phone / email / id), account type at acceptance, document, version and date range. */
export async function GET(request: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const parsed = legalAcceptanceQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });

  const { version, from, to, ...rest } = parsed.data;
  // `to` is a calendar date — include the whole day.
  const toEndOfDay = to ? new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1) : undefined;
  const page = await LegalService.getAcceptances({ ...rest, versionNumber: version, from, to: toEndOfDay });
  return NextResponse.json(page);
}
