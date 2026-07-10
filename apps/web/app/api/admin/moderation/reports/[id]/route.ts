import { NextResponse } from "next/server";
import { ReportService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  if (!["PENDING", "REVIEWING", "RESOLVED", "DISMISSED"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const report = await ReportService.updateStatus(id, session.user.id, body.status, body.resolutionNote);
  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await logAdminAction({
    userId: session.user.id,
    action: "UPDATE_REPORT_STATUS",
    entity: "Report",
    entityId: id,
    metadata: { status: body.status },
  });

  return NextResponse.json({ report });
}
