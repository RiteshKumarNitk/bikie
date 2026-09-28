// ADR-090 — versioned legal terms + consent.

export type LegalDocumentTypeDTO = "TERMS_AND_CONDITIONS" | "PRIVACY_POLICY" | "USER_AGREEMENT";
export type LegalVersionStatusDTO = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type LegalAcceptanceSourceDTO = "SIGNUP" | "RECONSENT";

/** One currently-published legal document, as shown to a user before they accept it. */
export interface CurrentLegalDocumentDTO {
  documentId: string;
  type: LegalDocumentTypeDTO;
  title: string;
  /** The exact version id a client must send back as consent. */
  versionId: string;
  version: number;
  /** Plain text. Lines starting with `# ` / `## ` are headings; blank lines separate paragraphs. */
  content: string;
  /** ISO 8601 */
  publishedAt: string;
}

/** `GET /api/legal/current`. */
export interface CurrentLegalDocumentsResponse {
  documents: CurrentLegalDocumentDTO[];
  terms: CurrentLegalDocumentDTO | null;
  privacy: CurrentLegalDocumentDTO | null;
  userAgreement: CurrentLegalDocumentDTO | null;
  /** Every id in `documents` — exactly what signup must send as consent. */
  versionIds: string[];
}

export interface LegalVersionSummaryDTO {
  id: string;
  documentId: string;
  type: LegalDocumentTypeDTO;
  versionNumber: number;
  status: LegalVersionStatusDTO;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
  acceptanceCount: number;
  createdByName: string | null;
  publishedByName: string | null;
}

export interface LegalVersionDetailDTO extends LegalVersionSummaryDTO {
  title: string;
  content: string;
}

export interface LegalDocumentOverviewDTO {
  id: string;
  type: LegalDocumentTypeDTO;
  title: string;
  currentVersion: LegalVersionSummaryDTO | null;
  draft: LegalVersionSummaryDTO | null;
  versionCount: number;
  lastUpdatedAt: string;
}

export interface LegalAcceptanceDTO {
  id: string;
  userId: string;
  userName: string;
  userPhone: string | null;
  /** Account type at the moment of acceptance (snapshot, not the live value). */
  accountType: "RIDER" | "SERVICE_PROVIDER";
  documentType: LegalDocumentTypeDTO;
  versionId: string;
  versionNumber: number;
  source: LegalAcceptanceSourceDTO;
  acceptedAt: string;
}

export interface LegalAcceptancePageDTO {
  acceptances: LegalAcceptanceDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** `GET /api/legal/status` — whether the signed-in user must (re-)accept anything. */
export interface LegalConsentStatusDTO {
  requiresConsent: boolean;
  /** Current published versions this user has not accepted yet. */
  pending: CurrentLegalDocumentDTO[];
  /** Latest accepted version per document type. */
  accepted: { type: LegalDocumentTypeDTO; versionId: string; versionNumber: number; acceptedAt: string }[];
}
