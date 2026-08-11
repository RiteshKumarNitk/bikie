import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  accountTypeRequestRepository: {
    createRequest: vi.fn(),
    findOpenRequestForUser: vi.fn(),
    findRequestsForUser: vi.fn(),
    findAllRequests: vi.fn(),
    findRequestById: vi.fn(),
    reviewRequest: vi.fn(),
  },
}));

vi.mock("./notification.service", () => ({
  NotificationService: { notify: vi.fn(async () => undefined) },
}));

import { accountTypeRequestRepository } from "@bikie/database";
import { NotificationService } from "./notification.service";
import { AccountTypeRequestService } from "./account-type-request.service";

const mockedRepo = accountTypeRequestRepository as unknown as {
  createRequest: ReturnType<typeof vi.fn>;
  findOpenRequestForUser: ReturnType<typeof vi.fn>;
  findRequestsForUser: ReturnType<typeof vi.fn>;
  findAllRequests: ReturnType<typeof vi.fn>;
  findRequestById: ReturnType<typeof vi.fn>;
  reviewRequest: ReturnType<typeof vi.fn>;
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("AccountTypeRequestService.submitRequest (ADR-053)", () => {
  it("rejects when requestedType matches currentType — nothing to change", async () => {
    const result = await AccountTypeRequestService.submitRequest({
      userId: "user-1",
      currentType: "RIDER",
      requestedType: "RIDER",
      reason: "typo",
    });
    expect(result).toEqual({ ok: false, reason: "SAME_TYPE" });
    expect(mockedRepo.findOpenRequestForUser).not.toHaveBeenCalled();
    expect(mockedRepo.createRequest).not.toHaveBeenCalled();
  });

  it("rejects a second submission while one is already open — one open request per user", async () => {
    mockedRepo.findOpenRequestForUser.mockResolvedValueOnce({ id: "existing-request" });

    const result = await AccountTypeRequestService.submitRequest({
      userId: "user-1",
      currentType: "RIDER",
      requestedType: "SERVICE_PROVIDER",
      reason: "I am a mechanic",
    });

    expect(result).toEqual({ ok: false, reason: "ALREADY_OPEN" });
    expect(mockedRepo.createRequest).not.toHaveBeenCalled();
  });

  it("creates the request when no open request exists and the types differ", async () => {
    mockedRepo.findOpenRequestForUser.mockResolvedValueOnce(null);
    mockedRepo.createRequest.mockResolvedValueOnce({ id: "new-request", status: "PENDING" });

    const result = await AccountTypeRequestService.submitRequest({
      userId: "user-1",
      currentType: "RIDER",
      requestedType: "SERVICE_PROVIDER",
      reason: "I am a mechanic",
    });

    expect(result).toEqual({ ok: true, request: { id: "new-request", status: "PENDING" } });
    expect(mockedRepo.createRequest).toHaveBeenCalledWith({
      userId: "user-1",
      currentType: "RIDER",
      requestedType: "SERVICE_PROVIDER",
      reason: "I am a mechanic",
    });
  });
});

describe("AccountTypeRequestService.review (ADR-053)", () => {
  it("notifies the applicant with APPROVED copy and does not throw if notify fails", async () => {
    mockedRepo.reviewRequest.mockResolvedValueOnce({
      ok: true,
      userId: "user-1",
      requestedType: "SERVICE_PROVIDER",
      decision: "APPROVED",
    });
    (NotificationService.notify as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("push down"));

    const result = await AccountTypeRequestService.review("request-1", "APPROVED", { adminUserId: "admin-1" });

    expect(result).toEqual({
      ok: true,
      userId: "user-1",
      requestedType: "SERVICE_PROVIDER",
      decision: "APPROVED",
    });
    expect(NotificationService.notify).toHaveBeenCalledWith(
      "user-1",
      "ACCOUNT_TYPE_CHANGE_APPROVED",
      expect.any(String),
      expect.any(String),
      "AccountTypeChangeRequest",
      "request-1",
    );
  });

  it("does not notify when the review itself failed (not found / invalid transition)", async () => {
    mockedRepo.reviewRequest.mockResolvedValueOnce({ ok: false, reason: "NOT_FOUND" });

    const result = await AccountTypeRequestService.review("missing", "REJECTED", {
      adminUserId: "admin-1",
      adminRemarks: "no such request",
    });

    expect(result).toEqual({ ok: false, reason: "NOT_FOUND" });
    expect(NotificationService.notify).not.toHaveBeenCalled();
  });

  it("passes adminRemarks through to both the repository call and the notification body", async () => {
    mockedRepo.reviewRequest.mockResolvedValueOnce({
      ok: true,
      userId: "user-2",
      requestedType: "RIDER",
      decision: "REJECTED",
    });

    await AccountTypeRequestService.review("request-2", "REJECTED", {
      adminUserId: "admin-1",
      adminRemarks: "Insufficient supporting information",
    });

    expect(mockedRepo.reviewRequest).toHaveBeenCalledWith("request-2", "REJECTED", {
      adminUserId: "admin-1",
      adminRemarks: "Insufficient supporting information",
    });
    expect(NotificationService.notify).toHaveBeenCalledWith(
      "user-2",
      "ACCOUNT_TYPE_CHANGE_REJECTED",
      expect.any(String),
      "Insufficient supporting information",
      "AccountTypeChangeRequest",
      "request-2",
    );
  });
});
