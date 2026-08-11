import { NextResponse } from "next/server";
import { AccountTypeRequestService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";

/** ADR-053 — admin's "Account Type Requests" queue. `?status=` filters (PENDING by default is
 * left to the client — this returns everything so the UI can offer an "All" tab too). */
export async function GET(request: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  const requests = await AccountTypeRequestService.getAll(status);
  return NextResponse.json({ requests });
}
