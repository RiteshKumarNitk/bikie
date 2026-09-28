import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  legalRepository: {
    findCurrentPublished: vi.fn(),
    recordAcceptances: vi.fn(),
    deleteUserWithoutConsent: vi.fn(),
    findAcceptedVersionIds: vi.fn(),
    findLatestAcceptancesForUser: vi.fn(),
    createDraft: vi.fn(),
    publishDraft: vi.fn(),
    deleteDraft: vi.fn(),
  },
}));

import { legalRepository } from "@bikie/database";
import { LegalService, parseLegalConsentHeaders } from "./legal.service";

const repo = legalRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;

const doc = (type: string, versionId: string, version: number) => ({
  documentId: `doc-${type}`,
  type,
  title: type,
  versionId,
  version,
  content: "text",
  publishedAt: "2026-09-28T00:00:00.000Z",
});

const CURRENT = [
  doc("TERMS_AND_CONDITIONS", "terms-v3", 3),
  doc("PRIVACY_POLICY", "privacy-v2", 2),
  doc("USER_AGREEMENT", "agreement-v1", 1),
];

afterEach(() => {
  vi.clearAllMocks();
});

describe("parseLegalConsentHeaders", () => {
  it("splits, trims and de-duplicates version ids", () => {
    const headers = new Headers({ "x-legal-consent-versions": " a, b ,a,, c", "x-legal-consent-account-type": "SERVICE_PROVIDER" });
    expect(parseLegalConsentHeaders(headers)).toEqual({ versionIds: ["a", "b", "c"], accountType: "SERVICE_PROVIDER" });
  });

  it("treats missing headers as no consent and defaults the account type to RIDER", () => {
    expect(parseLegalConsentHeaders(new Headers())).toEqual({ versionIds: [], accountType: "RIDER" });
    expect(parseLegalConsentHeaders(null)).toEqual({ versionIds: [], accountType: "RIDER" });
  });

  it("never lets an arbitrary value through as the account type", () => {
    const headers = new Headers({ "x-legal-consent-account-type": "ADMIN" });
    expect(parseLegalConsentHeaders(headers).accountType).toBe("RIDER");
  });
});

describe("LegalService.validateSignupConsent (ADR-090 backend gate)", () => {
  it("rejects a signup that sends no consent at all", async () => {
    repo.findCurrentPublished.mockResolvedValueOnce(CURRENT);
    const result = await LegalService.validateSignupConsent([]);
    expect(result).toMatchObject({ ok: false, code: "LEGAL_CONSENT_REQUIRED", status: 400 });
  });

  it("accepts exactly the current published versions", async () => {
    repo.findCurrentPublished.mockResolvedValueOnce(CURRENT);
    const result = await LegalService.validateSignupConsent(["agreement-v1", "terms-v3", "privacy-v2"]);
    expect(result).toEqual({ ok: true, versionIds: ["terms-v3", "privacy-v2", "agreement-v1"] });
  });

  it("rejects consent to an older version as outdated", async () => {
    repo.findCurrentPublished.mockResolvedValueOnce(CURRENT);
    const result = await LegalService.validateSignupConsent(["terms-v2", "privacy-v2", "agreement-v1"]);
    expect(result).toMatchObject({ ok: false, code: "LEGAL_VERSION_OUTDATED", status: 409 });
  });

  it("rejects consent that covers only some documents", async () => {
    repo.findCurrentPublished.mockResolvedValueOnce(CURRENT);
    const result = await LegalService.validateSignupConsent(["terms-v3"]);
    expect(result).toMatchObject({ ok: false, code: "LEGAL_VERSION_OUTDATED" });
  });

  it("rejects consent that adds an unrelated id to the current set", async () => {
    repo.findCurrentPublished.mockResolvedValueOnce(CURRENT);
    const result = await LegalService.validateSignupConsent(["terms-v3", "privacy-v2", "agreement-v1", "bogus"]);
    expect(result).toMatchObject({ ok: false, code: "LEGAL_VERSION_OUTDATED" });
  });

  it("allows signup when nothing is published (nothing to accept)", async () => {
    repo.findCurrentPublished.mockResolvedValueOnce([]);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(await LegalService.validateSignupConsent([])).toEqual({ ok: true, versionIds: [] });
    warn.mockRestore();
  });
});

describe("LegalService.recordSignupConsent", () => {
  const input = { userId: "user-1", versionIds: ["terms-v3"], accountType: "RIDER" as const };

  it("records SIGNUP acceptances for the exact versions", async () => {
    repo.recordAcceptances.mockResolvedValueOnce({ ok: true, recorded: 1 });
    expect(await LegalService.recordSignupConsent(input)).toEqual({ ok: true, recorded: 1 });
    expect(repo.recordAcceptances).toHaveBeenCalledWith({ ...input, source: "SIGNUP" });
    expect(repo.deleteUserWithoutConsent).not.toHaveBeenCalled();
  });

  it("deletes the just-created account when the acceptance write throws", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    repo.recordAcceptances.mockRejectedValueOnce(new Error("db down"));
    repo.deleteUserWithoutConsent.mockResolvedValueOnce(true);
    expect(await LegalService.recordSignupConsent(input)).toEqual({ ok: false });
    expect(repo.deleteUserWithoutConsent).toHaveBeenCalledWith("user-1");
    error.mockRestore();
  });

  it("deletes the just-created account when a version id is unknown", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    repo.recordAcceptances.mockResolvedValueOnce({ ok: false, reason: "UNKNOWN_VERSION" });
    repo.deleteUserWithoutConsent.mockResolvedValueOnce(true);
    expect(await LegalService.recordSignupConsent(input)).toEqual({ ok: false });
    expect(repo.deleteUserWithoutConsent).toHaveBeenCalledWith("user-1");
    error.mockRestore();
  });
});

describe("LegalService.getConsentStatus (re-consent detection)", () => {
  it("reports every current version the user has not accepted as pending", async () => {
    repo.findCurrentPublished.mockResolvedValueOnce(CURRENT);
    // Accepted terms v2 earlier (not current v3) and the current privacy v2.
    repo.findAcceptedVersionIds.mockResolvedValueOnce(new Set(["privacy-v2"]));
    repo.findLatestAcceptancesForUser.mockResolvedValueOnce([
      { type: "TERMS_AND_CONDITIONS", versionId: "terms-v2", versionNumber: 2, acceptedAt: "2026-09-01T00:00:00.000Z" },
    ]);

    const status = await LegalService.getConsentStatus("user-1");

    expect(status.requiresConsent).toBe(true);
    expect(status.pending.map((d) => d.versionId)).toEqual(["terms-v3", "agreement-v1"]);
    expect(status.accepted[0]).toMatchObject({ versionNumber: 2 });
  });

  it("is satisfied once every current version is accepted", async () => {
    repo.findCurrentPublished.mockResolvedValueOnce(CURRENT);
    repo.findAcceptedVersionIds.mockResolvedValueOnce(new Set(["terms-v3", "privacy-v2", "agreement-v1"]));
    repo.findLatestAcceptancesForUser.mockResolvedValueOnce([]);
    expect((await LegalService.getConsentStatus("user-1")).requiresConsent).toBe(false);
  });
});

describe("LegalService.acceptCurrent (re-consent)", () => {
  it("records RECONSENT acceptances for current versions", async () => {
    repo.findCurrentPublished.mockResolvedValueOnce(CURRENT);
    repo.recordAcceptances.mockResolvedValueOnce({ ok: true, recorded: 1 });
    const input = { userId: "user-1", versionIds: ["terms-v3"], accountType: "SERVICE_PROVIDER" as const };
    expect(await LegalService.acceptCurrent(input)).toEqual({ ok: true, recorded: 1 });
    expect(repo.recordAcceptances).toHaveBeenCalledWith({ ...input, source: "RECONSENT" });
  });

  it("refuses to record acceptance of a version that is no longer current", async () => {
    repo.findCurrentPublished.mockResolvedValueOnce(CURRENT);
    const result = await LegalService.acceptCurrent({ userId: "user-1", versionIds: ["terms-v2"], accountType: "RIDER" });
    expect(result).toMatchObject({ ok: false, code: "LEGAL_VERSION_OUTDATED" });
    expect(repo.recordAcceptances).not.toHaveBeenCalled();
  });
});

describe("LegalService admin actions", () => {
  it("pre-fills a new draft from the current published content", async () => {
    repo.findCurrentPublished.mockResolvedValueOnce(CURRENT);
    repo.createDraft.mockResolvedValueOnce({ ok: true, version: { id: "terms-v4", versionNumber: 4 } });
    await LegalService.createDraft({ type: "TERMS_AND_CONDITIONS", adminUserId: "admin-1" });
    expect(repo.createDraft).toHaveBeenCalledWith({ type: "TERMS_AND_CONDITIONS", content: "text", createdById: "admin-1" });
  });

  it("publishes through the transactional repository call with the acting admin", async () => {
    repo.publishDraft.mockResolvedValueOnce({ ok: false, reason: "NOT_DRAFT" });
    expect(await LegalService.publish("terms-v3", "admin-1")).toEqual({ ok: false, reason: "NOT_DRAFT" });
    expect(repo.publishDraft).toHaveBeenCalledWith("terms-v3", "admin-1");
  });
});
