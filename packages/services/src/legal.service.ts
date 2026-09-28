import { legalRepository } from "@bikie/database";
import type {
  CurrentLegalDocumentDTO,
  CurrentLegalDocumentsResponse,
  LegalConsentStatusDTO,
  LegalDocumentTypeDTO,
} from "@bikie/types";

/**
 * ADR-090 — how a client declares legal consent when creating an account. Sent as request
 * headers on the account-creating call (`POST /api/auth/phone-number/verify`) rather than in the
 * body, because Better Auth validates and strips that endpoint's body; the server-side
 * `user.create` hook (packages/auth) reads them from the live request.
 */
export const LEGAL_CONSENT_VERSIONS_HEADER = "x-legal-consent-versions";
export const LEGAL_CONSENT_ACCOUNT_TYPE_HEADER = "x-legal-consent-account-type";

export type LegalConsentErrorCode = "LEGAL_CONSENT_REQUIRED" | "LEGAL_VERSION_OUTDATED";

export type LegalConsentCheck =
  | { ok: true; versionIds: string[] }
  | { ok: false; code: LegalConsentErrorCode; status: 400 | 409; message: string };

export type AccountTypeValue = "RIDER" | "SERVICE_PROVIDER";

const CONSENT_REQUIRED_MESSAGE =
  "Please accept the Terms & Conditions, Privacy Policy and Legal Terms to continue.";
const VERSION_OUTDATED_MESSAGE =
  "Our legal terms were updated while you were signing up. Please review and accept the latest version.";

const RESPONSE_KEYS: Record<LegalDocumentTypeDTO, "terms" | "privacy" | "userAgreement"> = {
  TERMS_AND_CONDITIONS: "terms",
  PRIVACY_POLICY: "privacy",
  USER_AGREEMENT: "userAgreement",
};

/** Parses the consent headers. Unknown/missing account type falls back to RIDER (the schema
 * default every new account starts as) — it only labels the acceptance snapshot, it never
 * authorizes anything. */
export function parseLegalConsentHeaders(headers: Headers | null | undefined): {
  versionIds: string[];
  accountType: AccountTypeValue;
} {
  const raw = headers?.get(LEGAL_CONSENT_VERSIONS_HEADER) ?? "";
  const versionIds = [...new Set(raw.split(",").map((id) => id.trim()).filter(Boolean))].slice(0, 10);
  const declared = headers?.get(LEGAL_CONSENT_ACCOUNT_TYPE_HEADER);
  return { versionIds, accountType: declared === "SERVICE_PROVIDER" ? "SERVICE_PROVIDER" : "RIDER" };
}

/** Consent is valid only if it names exactly the currently published version of every document —
 * no more, no fewer. Anything else means the user saw something other than what is current. */
function checkAgainstCurrent(current: CurrentLegalDocumentDTO[], versionIds: string[]): LegalConsentCheck {
  const required = new Set(current.map((d) => d.versionId));
  if (required.size === 0) return { ok: true, versionIds: [] };
  if (versionIds.length === 0) {
    return { ok: false, code: "LEGAL_CONSENT_REQUIRED", status: 400, message: CONSENT_REQUIRED_MESSAGE };
  }
  const provided = new Set(versionIds);
  const matches = provided.size === required.size && [...required].every((id) => provided.has(id));
  if (!matches) {
    return { ok: false, code: "LEGAL_VERSION_OUTDATED", status: 409, message: VERSION_OUTDATED_MESSAGE };
  }
  return { ok: true, versionIds: [...required] };
}

export const LegalService = {
  /** `GET /api/legal/current` — public; the versions a new user must accept. */
  async getCurrent(): Promise<CurrentLegalDocumentsResponse> {
    const documents = await legalRepository.findCurrentPublished();
    const byKey = { terms: null, privacy: null, userAgreement: null } as Record<
      "terms" | "privacy" | "userAgreement",
      CurrentLegalDocumentDTO | null
    >;
    for (const doc of documents) byKey[RESPONSE_KEYS[doc.type]] = doc;
    return { documents, ...byKey, versionIds: documents.map((d) => d.versionId) };
  },

  /** Called by the `user.create.before` auth hook — the backend's authoritative gate on account
   * creation. If nothing is published at all there is nothing to accept (logged loudly). */
  async validateSignupConsent(versionIds: string[]): Promise<LegalConsentCheck> {
    const current = await legalRepository.findCurrentPublished();
    if (current.length === 0) {
      console.warn("[LEGAL][CONSENT] no published legal documents — signup allowed without consent");
    }
    return checkAgainstCurrent(current, versionIds);
  },

  /** Called by the `user.create.after` auth hook, once the user row exists. The user row and the
   * acceptance rows can't share a transaction (Better Auth owns the user insert), so if recording
   * fails the just-created account is deleted again — an account never survives without its
   * consent record. Returns `ok: false` so the hook can fail the signup request. */
  async recordSignupConsent(input: {
    userId: string;
    versionIds: string[];
    accountType: AccountTypeValue;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<{ ok: true; recorded: number } | { ok: false }> {
    if (input.versionIds.length === 0) return { ok: true, recorded: 0 };
    try {
      const result = await legalRepository.recordAcceptances({ ...input, source: "SIGNUP" });
      if (result.ok) return result;
      console.error(`[LEGAL][CONSENT][RECORD_FAILED] user=${input.userId} reason=${result.reason}`);
    } catch (err) {
      console.error(`[LEGAL][CONSENT][RECORD_FAILED] user=${input.userId}`, err);
    }
    const deleted = await legalRepository.deleteUserWithoutConsent(input.userId).catch((err) => {
      console.error(`[LEGAL][CONSENT][ROLLBACK_FAILED] user=${input.userId}`, err);
      return false;
    });
    console.error(`[LEGAL][CONSENT][ROLLBACK] user=${input.userId} deleted=${deleted}`);
    return { ok: false };
  },

  /** Does this user need to accept a newer version of anything? Compares each current published
   * version against what the user has actually accepted — never infers acceptance. */
  async getConsentStatus(userId: string): Promise<LegalConsentStatusDTO> {
    const current = await legalRepository.findCurrentPublished();
    const [acceptedIds, accepted] = await Promise.all([
      legalRepository.findAcceptedVersionIds(
        userId,
        current.map((d) => d.versionId),
      ),
      legalRepository.findLatestAcceptancesForUser(userId),
    ]);
    const pending = current.filter((d) => !acceptedIds.has(d.versionId));
    return { requiresConsent: pending.length > 0, pending, accepted };
  },

  /** `POST /api/legal/accept` — an existing user explicitly accepts newly published versions.
   * Each id must be a *current* published version; a stale one means the client showed old text. */
  async acceptCurrent(input: {
    userId: string;
    versionIds: string[];
    accountType: AccountTypeValue;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<{ ok: true; recorded: number } | { ok: false; code: LegalConsentErrorCode; message: string }> {
    const current = new Set((await legalRepository.findCurrentPublished()).map((d) => d.versionId));
    if (input.versionIds.some((id) => !current.has(id))) {
      return { ok: false, code: "LEGAL_VERSION_OUTDATED", message: VERSION_OUTDATED_MESSAGE };
    }
    const result = await legalRepository.recordAcceptances({ ...input, source: "RECONSENT" });
    if (!result.ok) return { ok: false, code: "LEGAL_VERSION_OUTDATED", message: VERSION_OUTDATED_MESSAGE };
    return result;
  },

  // --- Admin (web dashboard only) ---

  getOverview: () => legalRepository.findDocumentsOverview(),
  getVersions: (type: LegalDocumentTypeDTO) => legalRepository.findVersionsForType(type),
  getVersion: (id: string) => legalRepository.findVersionById(id),
  getAcceptances: (query: Parameters<typeof legalRepository.findAcceptances>[0]) =>
    legalRepository.findAcceptances(query),

  /** Starts the next version. Without explicit content it copies the current published text, so
   * an admin edits from what users see today rather than from a blank page. */
  async createDraft(input: { type: LegalDocumentTypeDTO; content?: string; adminUserId: string }) {
    let content = input.content;
    if (content === undefined) {
      const current = await legalRepository.findCurrentPublished();
      content = current.find((d) => d.type === input.type)?.content ?? "";
    }
    return legalRepository.createDraft({ type: input.type, content, createdById: input.adminUserId });
  },

  updateDraft: (id: string, content: string) => legalRepository.updateDraft(id, content),
  discardDraft: (id: string) => legalRepository.deleteDraft(id),
  publish: (id: string, adminUserId: string) => legalRepository.publishDraft(id, adminUserId),
};
