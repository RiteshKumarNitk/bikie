import { NextResponse } from "next/server";
import { LegalService } from "@bikie/services";
import { updateLegalDraftSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

const notDraft = () =>
  NextResponse.json(
    {
      error: "NOT_DRAFT",
      message: "Published and archived versions are immutable. Create a new version to change the text.",
    },
    { status: 409 },
  );

/** ADR-090 — one version in full (any status): content, timestamps, who created/published it,
 * and how many users accepted it. Historical versions stay viewable forever. */
export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const version = await LegalService.getVersion((await params).id);
  if (!version) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(version);
}

/** ADR-090 — edit a DRAFT's content. Anything already published is immutable (409). */
export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const parsed = updateLegalDraftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const id = (await params).id;
  const result = await LegalService.updateDraft(id, parsed.data.content);
  if (!result.ok) {
    if (result.reason === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return notDraft();
  }
  return NextResponse.json(await LegalService.getVersion(id));
}

/** ADR-090 — discard an unpublished DRAFT. Published/archived versions can never be deleted. */
export async function DELETE(_request: Request, { params }: Params) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const id = (await params).id;
  const result = await LegalService.discardDraft(id);
  if (!result.ok) {
    if (result.reason === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return notDraft();
  }

  await logAdminAction({
    userId: session.user.id,
    action: "LEGAL_DRAFT_DISCARDED",
    entity: "LegalDocumentVersion",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}
