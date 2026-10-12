import { NextResponse } from "next/server";
import { LegalService } from "@bikie/services";
import { createLegalDraftSchema, legalDocumentTypeSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

type Params = { params: Promise<{ type: string }> };

/** ADR-090 — full version history of one document type (newest first), with acceptance counts. */
export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const type = legalDocumentTypeSchema.safeParse((await params).type);
  if (!type.success) return NextResponse.json({ error: "Unknown document type" }, { status: 404 });

  const versions = await LegalService.getVersions(type.data);
  return NextResponse.json({ versions });
}

/** ADR-090 — "Create New Version": starts the next version number as a DRAFT (pre-filled from the
 * current published text unless `content` is given). One open draft per document — a second
 * request returns 409 with the existing `draftId` so the UI can open it instead. */
export async function POST(request: Request, { params }: Params) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const type = legalDocumentTypeSchema.safeParse((await params).type);
  if (!type.success) return NextResponse.json({ error: "Unknown document type" }, { status: 404 });

  const parsed = createLegalDraftSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await LegalService.createDraft({
    type: type.data,
    content: parsed.data.content,
    adminUserId: session.user.id,
  });
  if (!result.ok) {
    if (result.reason === "DOCUMENT_NOT_FOUND") {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "DRAFT_EXISTS", message: "This document already has a draft in progress.", draftId: result.draftId },
      { status: 409 },
    );
  }

  await logAdminAction({
    userId: session.user.id,
    action: "LEGAL_DRAFT_CREATED",
    entity: "LegalDocumentVersion",
    entityId: result.version.id,
    metadata: { type: type.data, versionNumber: result.version.versionNumber },
  });
  return NextResponse.json(result.version, { status: 201 });
}
