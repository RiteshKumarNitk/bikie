import { prisma } from "../client";
import { Prisma } from "../generated/prisma/client.js";
import type {
  CurrentLegalDocumentDTO,
  LegalAcceptanceDTO,
  LegalAcceptancePageDTO,
  LegalAcceptanceSourceDTO,
  LegalDocumentOverviewDTO,
  LegalDocumentTypeDTO,
  LegalVersionDetailDTO,
  LegalVersionSummaryDTO,
} from "@bikie/types";

// ADR-090 — versioned legal documents + immutable acceptance records. The invariants that matter
// for compliance (one PUBLISHED / one DRAFT per document, non-DRAFT content immutable, acceptance
// rows append-only) are enforced by the database itself — see the 20260928100000 migration — so
// the functions here can't violate them even if called incorrectly.

const VERSION_INCLUDE = {
  createdBy: { select: { name: true } },
  publishedBy: { select: { name: true } },
  _count: { select: { acceptances: true } },
} as const;

type VersionRow = Prisma.LegalDocumentVersionGetPayload<{ include: typeof VERSION_INCLUDE }>;

function toVersionSummary(v: VersionRow): LegalVersionSummaryDTO {
  return {
    id: v.id,
    documentId: v.legalDocumentId,
    type: v.documentType,
    versionNumber: v.versionNumber,
    status: v.status,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
    publishedAt: v.publishedAt?.toISOString() ?? null,
    archivedAt: v.archivedAt?.toISOString() ?? null,
    acceptanceCount: v._count.acceptances,
    createdByName: v.createdBy?.name ?? null,
    publishedByName: v.publishedBy?.name ?? null,
  };
}

/** Every document's currently PUBLISHED version — what a user must accept at signup. */
export async function findCurrentPublished(): Promise<CurrentLegalDocumentDTO[]> {
  const documents = await prisma.legalDocument.findMany({
    where: { currentVersion: { is: { status: "PUBLISHED" } } },
    include: { currentVersion: true },
    orderBy: { type: "asc" },
  });
  return documents.flatMap((d) =>
    d.currentVersion
      ? [
          {
            documentId: d.id,
            type: d.type,
            title: d.title,
            versionId: d.currentVersion.id,
            version: d.currentVersion.versionNumber,
            content: d.currentVersion.content,
            publishedAt: (d.currentVersion.publishedAt ?? d.currentVersion.createdAt).toISOString(),
          },
        ]
      : [],
  );
}

export async function findDocumentsOverview(): Promise<LegalDocumentOverviewDTO[]> {
  const documents = await prisma.legalDocument.findMany({
    orderBy: { type: "asc" },
    include: {
      versions: {
        where: { status: { in: ["PUBLISHED", "DRAFT"] } },
        include: VERSION_INCLUDE,
      },
      _count: { select: { versions: true } },
    },
  });
  const latestUpdates = await prisma.legalDocumentVersion.groupBy({
    by: ["legalDocumentId"],
    _max: { updatedAt: true },
  });
  const latestByDocument = new Map(latestUpdates.map((row) => [row.legalDocumentId, row._max.updatedAt]));

  return documents.map((d) => {
    const current = d.versions.find((v) => v.status === "PUBLISHED");
    const draft = d.versions.find((v) => v.status === "DRAFT");
    const latest = latestByDocument.get(d.id);
    return {
      id: d.id,
      type: d.type,
      title: d.title,
      currentVersion: current ? toVersionSummary(current) : null,
      draft: draft ? toVersionSummary(draft) : null,
      versionCount: d._count.versions,
      lastUpdatedAt: (latest && latest > d.updatedAt ? latest : d.updatedAt).toISOString(),
    };
  });
}

export async function findVersionsForType(type: LegalDocumentTypeDTO): Promise<LegalVersionSummaryDTO[]> {
  const versions = await prisma.legalDocumentVersion.findMany({
    where: { documentType: type },
    include: VERSION_INCLUDE,
    orderBy: { versionNumber: "desc" },
  });
  return versions.map(toVersionSummary);
}

export async function findVersionById(id: string): Promise<LegalVersionDetailDTO | null> {
  const version = await prisma.legalDocumentVersion.findUnique({
    where: { id },
    include: { ...VERSION_INCLUDE, legalDocument: { select: { title: true } } },
  });
  if (!version) return null;
  return { ...toVersionSummary(version), title: version.legalDocument.title, content: version.content };
}

export type CreateDraftResult =
  | { ok: true; version: LegalVersionDetailDTO }
  | { ok: false; reason: "DOCUMENT_NOT_FOUND" | "DRAFT_EXISTS"; draftId?: string };

/** Starts the next version of a document as a DRAFT. Version numbers are assigned here (latest +
 * 1) under a row lock on the parent document, and the one-draft-per-document partial index makes
 * a concurrent second draft fail rather than duplicate a number. */
export async function createDraft(data: {
  type: LegalDocumentTypeDTO;
  content: string;
  createdById: string;
}): Promise<CreateDraftResult> {
  try {
    const result = await prisma.$transaction(async (tx): Promise<Exclude<CreateDraftResult, { ok: true }> | { ok: true; id: string }> => {
      const document = await tx.legalDocument.findUnique({ where: { type: data.type }, select: { id: true } });
      if (!document) return { ok: false, reason: "DOCUMENT_NOT_FOUND" };
      await tx.$queryRaw`SELECT id FROM "legal_document" WHERE id = ${document.id} FOR UPDATE`;

      const existingDraft = await tx.legalDocumentVersion.findFirst({
        where: { legalDocumentId: document.id, status: "DRAFT" },
        select: { id: true },
      });
      if (existingDraft) return { ok: false, reason: "DRAFT_EXISTS", draftId: existingDraft.id };

      const latest = await tx.legalDocumentVersion.aggregate({
        where: { legalDocumentId: document.id },
        _max: { versionNumber: true },
      });
      const created = await tx.legalDocumentVersion.create({
        data: {
          legalDocumentId: document.id,
          documentType: data.type,
          versionNumber: (latest._max.versionNumber ?? 0) + 1,
          content: data.content,
          status: "DRAFT",
          createdById: data.createdById,
        },
        select: { id: true },
      });
      return { ok: true, id: created.id };
    });
    if (!result.ok) return result;
    const version = await findVersionById(result.id);
    return { ok: true, version: version! };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, reason: "DRAFT_EXISTS" };
    }
    throw err;
  }
}

export type DraftMutationResult = { ok: true } | { ok: false; reason: "NOT_FOUND" | "NOT_DRAFT" };

async function draftMissReason(id: string): Promise<"NOT_FOUND" | "NOT_DRAFT"> {
  const exists = await prisma.legalDocumentVersion.findUnique({ where: { id }, select: { id: true } });
  return exists ? "NOT_DRAFT" : "NOT_FOUND";
}

/** Only a DRAFT is editable — the `status: "DRAFT"` filter makes that atomic, and the DB trigger
 * rejects any content change to a published/archived row regardless. */
export async function updateDraft(id: string, content: string): Promise<DraftMutationResult> {
  const { count } = await prisma.legalDocumentVersion.updateMany({ where: { id, status: "DRAFT" }, data: { content } });
  return count === 1 ? { ok: true } : { ok: false, reason: await draftMissReason(id) };
}

/** Discards an unpublished draft. Published/archived versions can never be deleted. */
export async function deleteDraft(id: string): Promise<DraftMutationResult> {
  const { count } = await prisma.legalDocumentVersion.deleteMany({ where: { id, status: "DRAFT" } });
  return count === 1 ? { ok: true } : { ok: false, reason: await draftMissReason(id) };
}

export type PublishResult =
  | { ok: true; version: LegalVersionDetailDTO; archivedVersionId: string | null }
  | { ok: false; reason: "NOT_FOUND" | "NOT_DRAFT" | "EMPTY_CONTENT" | "CONFLICT" };

/**
 * Publishes a draft as the document's new current version, all-or-nothing:
 * lock document → archive the previous PUBLISHED version → publish the draft → move
 * `currentVersionId`. A concurrent publish of the same document either waits on the row lock or,
 * failing that, trips the one-published-per-document unique index and rolls back (`CONFLICT`).
 */
export async function publishDraft(id: string, publishedById: string): Promise<PublishResult> {
  try {
    const result = await prisma.$transaction(
      async (tx): Promise<Exclude<PublishResult, { ok: true }> | { ok: true; archivedVersionId: string | null }> => {
        const draft = await tx.legalDocumentVersion.findUnique({
          where: { id },
          select: { legalDocumentId: true },
        });
        if (!draft) return { ok: false, reason: "NOT_FOUND" };
        await tx.$queryRaw`SELECT id FROM "legal_document" WHERE id = ${draft.legalDocumentId} FOR UPDATE`;

        // Re-read under the lock — another admin may have published or discarded it meanwhile.
        const locked = await tx.legalDocumentVersion.findUnique({
          where: { id },
          select: { status: true, content: true },
        });
        if (!locked) return { ok: false, reason: "NOT_FOUND" };
        if (locked.status !== "DRAFT") return { ok: false, reason: "NOT_DRAFT" };
        if (!locked.content.trim()) return { ok: false, reason: "EMPTY_CONTENT" };

        const now = new Date();
        const previous = await tx.legalDocumentVersion.findFirst({
          where: { legalDocumentId: draft.legalDocumentId, status: "PUBLISHED" },
          select: { id: true },
        });
        if (previous) {
          await tx.legalDocumentVersion.update({
            where: { id: previous.id },
            data: { status: "ARCHIVED", archivedAt: now },
          });
        }
        await tx.legalDocumentVersion.update({
          where: { id },
          data: { status: "PUBLISHED", publishedAt: now, publishedById },
        });
        await tx.legalDocument.update({
          where: { id: draft.legalDocumentId },
          data: { currentVersionId: id },
        });
        return { ok: true, archivedVersionId: previous?.id ?? null };
      },
    );
    if (!result.ok) return result;
    const version = await findVersionById(id);
    return { ok: true, version: version!, archivedVersionId: result.archivedVersionId };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, reason: "CONFLICT" };
    }
    throw err;
  }
}

/** Snapshot of the versions a consent refers to, used both to validate and to record it. */
export async function findVersionsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return prisma.legalDocumentVersion.findMany({
    where: { id: { in: ids } },
    select: { id: true, documentType: true, versionNumber: true, status: true },
  });
}

/**
 * Appends one immutable acceptance row per version. Idempotent per user + exact version (unique
 * index + `skipDuplicates`), so a retried request never duplicates or rewrites history. Only
 * non-DRAFT versions can be accepted — a draft was never shown to anyone.
 */
export async function recordAcceptances(data: {
  userId: string;
  versionIds: string[];
  accountType: "RIDER" | "SERVICE_PROVIDER";
  source: LegalAcceptanceSourceDTO;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<{ ok: true; recorded: number } | { ok: false; reason: "UNKNOWN_VERSION" }> {
  const versions = await findVersionsByIds(data.versionIds);
  if (versions.length !== new Set(data.versionIds).size || versions.some((v) => v.status === "DRAFT")) {
    return { ok: false, reason: "UNKNOWN_VERSION" };
  }
  const { count } = await prisma.legalAcceptance.createMany({
    data: versions.map((v) => ({
      userId: data.userId,
      legalDocumentVersionId: v.id,
      documentType: v.documentType,
      versionNumber: v.versionNumber,
      accountType: data.accountType,
      source: data.source,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
    })),
    skipDuplicates: true,
  });
  return { ok: true, recorded: count };
}

/** Compensating rollback for a signup whose consent could not be recorded: removes the brand-new
 * user row (sessions/accounts cascade) so no account exists without its acceptance record. Guarded
 * to accounts with no acceptances at all, so it can never touch a user with consent history. */
export async function deleteUserWithoutConsent(userId: string): Promise<boolean> {
  const { count } = await prisma.user.deleteMany({ where: { id: userId, legalAcceptances: { none: {} } } });
  return count === 1;
}

/** Latest acceptance per document type for one user (their accepted version, not the current). */
export async function findLatestAcceptancesForUser(userId: string) {
  const rows = await prisma.legalAcceptance.findMany({
    where: { userId },
    orderBy: [{ versionNumber: "desc" }, { acceptedAt: "desc" }],
    select: { documentType: true, legalDocumentVersionId: true, versionNumber: true, acceptedAt: true },
  });
  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) if (!latest.has(row.documentType)) latest.set(row.documentType, row);
  return [...latest.values()].map((row) => ({
    type: row.documentType,
    versionId: row.legalDocumentVersionId,
    versionNumber: row.versionNumber,
    acceptedAt: row.acceptedAt.toISOString(),
  }));
}

export async function findAcceptedVersionIds(userId: string, versionIds: string[]): Promise<Set<string>> {
  if (versionIds.length === 0) return new Set();
  const rows = await prisma.legalAcceptance.findMany({
    where: { userId, legalDocumentVersionId: { in: versionIds } },
    select: { legalDocumentVersionId: true },
  });
  return new Set(rows.map((r) => r.legalDocumentVersionId));
}

export type AcceptanceQuery = {
  search?: string;
  accountType?: "RIDER" | "SERVICE_PROVIDER";
  documentType?: LegalDocumentTypeDTO;
  versionNumber?: number;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
};

/** Admin compliance view — every acceptance, newest first, filterable. */
export async function findAcceptances(query: AcceptanceQuery): Promise<LegalAcceptancePageDTO> {
  const search = query.search?.trim();
  const where: Prisma.LegalAcceptanceWhereInput = {
    ...(query.accountType ? { accountType: query.accountType } : {}),
    ...(query.documentType ? { documentType: query.documentType } : {}),
    ...(query.versionNumber ? { versionNumber: query.versionNumber } : {}),
    ...(query.from || query.to
      ? { acceptedAt: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } }
      : {}),
    ...(search
      ? {
          OR: [
            { userId: search },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { phoneNumber: { contains: search } } },
            { user: { phone: { contains: search } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.legalAcceptance.count({ where }),
    prisma.legalAcceptance.findMany({
      where,
      orderBy: { acceptedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { user: { select: { name: true, phoneNumber: true, phone: true } } },
    }),
  ]);

  const acceptances: LegalAcceptanceDTO[] = rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    userName: row.user.name,
    userPhone: row.user.phoneNumber ?? row.user.phone,
    accountType: row.accountType,
    documentType: row.documentType,
    versionId: row.legalDocumentVersionId,
    versionNumber: row.versionNumber,
    source: row.source,
    acceptedAt: row.acceptedAt.toISOString(),
  }));

  return {
    acceptances,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}
