import { z } from "zod";

// ADR-090 — versioned legal terms + consent.

export const legalDocumentTypeSchema = z.enum(["TERMS_AND_CONDITIONS", "PRIVACY_POLICY", "USER_AGREEMENT"]);

/** Generous cap — legal documents are long, but this is still one text column. */
const legalContentSchema = z.string().max(200_000);

/** `POST /api/admin/legal/[type]/versions` — start the next version as a DRAFT. Omitting
 * `content` pre-fills it from the current published version. */
export const createLegalDraftSchema = z.object({
  content: legalContentSchema.optional(),
});

/** `PATCH /api/admin/legal/versions/[id]` — edit a DRAFT's content (published versions are
 * immutable). */
export const updateLegalDraftSchema = z.object({
  content: legalContentSchema,
});

/** `POST /api/legal/accept` — the signed-in user accepts current versions (re-consent). */
export const acceptLegalVersionsSchema = z.object({
  versionIds: z.array(z.string().min(1).max(64)).min(1).max(10),
});

const blankToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

/** `GET /api/admin/legal/acceptances` — compliance search. Same conventions as
 * `adminTransactionsQuerySchema` (blank query params are ignored). */
export const legalAcceptanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.preprocess(blankToUndefined, z.string().trim().min(1).max(120).optional()),
  accountType: z.preprocess(blankToUndefined, z.enum(["RIDER", "SERVICE_PROVIDER"]).optional()),
  documentType: z.preprocess(blankToUndefined, legalDocumentTypeSchema.optional()),
  version: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).optional()),
  from: z.preprocess(blankToUndefined, z.coerce.date().optional()),
  to: z.preprocess(blankToUndefined, z.coerce.date().optional()),
});

export type LegalAcceptanceQueryInput = z.infer<typeof legalAcceptanceQuerySchema>;
