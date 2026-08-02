import { NextResponse } from "next/server";
import { AdminService } from "@bikie/services";
import { adminExportQuerySchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";

export async function GET(request: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const url = new URL(request.url);
  const parsed = adminExportQuerySchema.safeParse({
    type: url.searchParams.get("type") ?? "users",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const exported = await AdminService.exportCsv(parsed.data.type);
  if (!exported) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  return new Response(exported.csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${exported.filename}"`,
    },
  });
}
