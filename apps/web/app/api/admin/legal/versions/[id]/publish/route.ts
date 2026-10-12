import { NextResponse } from "next/server";
import { LegalService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

const FAILURES = {
  NOT_FOUND: { status: 404, message: "Version not found." },
  NOT_DRAFT: { status: 409, message: "Only a draft can be published — this version is already published or archived." },
  EMPTY_CONTENT: { status: 400, message: "A version with no content can't be published." },
  CONFLICT: { status: 409, message: "Another publish of this document happened at the same time. Reload and try again." },
} as const;

/** ADR-090 — publishes a DRAFT as the document's new current version in one transaction: the
 * previous PUBLISHED version is ARCHIVED, the draft becomes PUBLISHED, and the document's current
 * pointer moves. Users who accepted the old version keep that record; they are not marked as
 * accepting this one. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const id = (await params).id;
  const result = await LegalService.publish(id, session.user.id);
  if (!result.ok) {
    const failure = FAILURES[result.reason];
    return NextResponse.json({ error: result.reason, message: failure.message }, { status: failure.status });
  }

  await logAdminAction({
    userId: session.user.id,
    action: "LEGAL_VERSION_PUBLISHED",
    entity: "LegalDocumentVersion",
    entityId: id,
    metadata: {
      type: result.version.type,
      versionNumber: result.version.versionNumber,
      archivedVersionId: result.archivedVersionId,
    },
  });
  return NextResponse.json(result.version);
}
