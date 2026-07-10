import { NextResponse } from "next/server";
import { ReportService } from "@bikie/services";
import { reportSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = reportSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const report = await ReportService.create(session.user.id, parsed.data);
  return NextResponse.json({ report });
}
