import { describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  adminRepository: {},
}));

import {
  buildCsv,
  createAdministrationModule,
  MAX_ADMIN_CSV_ROWS,
  sanitizeCsvCell,
} from "./public";

describe("csv formula injection sanitization", () => {
  it("prefixes dangerous leading characters", () => {
    expect(sanitizeCsvCell("=1+1")).toBe("'=1+1");
    expect(sanitizeCsvCell("+cmd")).toBe("'+cmd");
    expect(sanitizeCsvCell("-2")).toBe("'-2");
    expect(sanitizeCsvCell("@SUM")).toBe("'@SUM");
    expect(sanitizeCsvCell("\tTAB")).toBe("'\tTAB");
  });

  it("leaves safe values alone", () => {
    expect(sanitizeCsvCell("hello")).toBe("hello");
    expect(sanitizeCsvCell(42)).toBe("42");
    expect(sanitizeCsvCell(null)).toBe("");
  });

  it("builds escaped CSV with a header row", () => {
    const csv = buildCsv([
      { name: "Ada", note: '=HYPERLINK("x")' },
      { name: 'O"Brien', note: "ok" },
    ]);
    expect(csv).toBe(
      `"name","note"\n"Ada","'=HYPERLINK(""x"")"\n"O""Brien","ok"`,
    );
  });

  it("returns empty string for zero rows", () => {
    expect(buildCsv([])).toBe("");
  });
});

describe("exportCsv application", () => {
  it("caps rows and returns filename", async () => {
    const exportUsersCsvRows = vi.fn(async (take: number) => {
      expect(take).toBe(MAX_ADMIN_CSV_ROWS);
      return [{ id: "1", name: "=hack" }];
    });

    const module = createAdministrationModule({
      admin: {
        getAdminOverviewStats: vi.fn(),
        findAllUsers: vi.fn(),
        updateUserRole: vi.fn(),
        updateUserAccountType: vi.fn(),
        deleteUser: vi.fn(),
        findAllPartners: vi.fn(),
        getAdminPartnerStats: vi.fn(),
        findPartnerDetailById: vi.fn(),
        transitionPartnerVerification: vi.fn(),
        deletePartner: vi.fn(),
        updatePartnerType: vi.fn(),
        findAllBookingsAdmin: vi.fn(),
        updateBookingStatus: vi.fn(),
        deleteBooking: vi.fn(),
        createBike: vi.fn(),
        updateBike: vi.fn(),
        deleteBike: vi.fn(),
        findAllTestimonials: vi.fn(),
        createTestimonial: vi.fn(),
        updateTestimonial: vi.fn(),
        deleteTestimonial: vi.fn(),
        findAllAuditLogs: vi.fn(),
        findAllPlansAdmin: vi.fn(),
        createMembershipPlan: vi.fn(),
        updateMembershipPlan: vi.fn(),
        deleteMembershipPlan: vi.fn(),
        findAllPartnerPlansAdmin: vi.fn(),
        createPartnerMembershipPlan: vi.fn(),
        updatePartnerMembershipPlan: vi.fn(),
        deletePartnerMembershipPlan: vi.fn(),
        findAllReferrals: vi.fn(),
        findAllTripsAdmin: vi.fn(),
        updateTripAdmin: vi.fn(),
        deleteTripAdmin: vi.fn(),
        findAllGroupsAdmin: vi.fn(),
        createGroupAdmin: vi.fn(),
        updateGroupAdmin: vi.fn(),
        deleteGroupAdmin: vi.fn(),
        exportUsersCsvRows,
        exportBookingsCsvRows: vi.fn(),
        exportPartnersCsvRows: vi.fn(),
        findUserIdsByAudience: vi.fn(),
        findNotificationHistory: vi.fn(),
      },
    });

    const result = await module.admin.exportCsv("users");
    expect(result).toEqual({
      filename: "users.csv",
      csv: `"id","name"\n"1","'=hack"`,
    });
  });
});

describe("Partner (Service Provider) membership plan CRUD (ADR-051)", () => {
  function moduleWith(overrides: Partial<Record<string, ReturnType<typeof vi.fn>>>) {
    return createAdministrationModule({
      admin: {
        getAdminOverviewStats: vi.fn(),
        findAllUsers: vi.fn(),
        updateUserRole: vi.fn(),
        updateUserAccountType: vi.fn(),
        deleteUser: vi.fn(),
        findAllPartners: vi.fn(),
        getAdminPartnerStats: vi.fn(),
        findPartnerDetailById: vi.fn(),
        transitionPartnerVerification: vi.fn(),
        deletePartner: vi.fn(),
        updatePartnerType: vi.fn(),
        findAllBookingsAdmin: vi.fn(),
        updateBookingStatus: vi.fn(),
        deleteBooking: vi.fn(),
        createBike: vi.fn(),
        updateBike: vi.fn(),
        deleteBike: vi.fn(),
        findAllTestimonials: vi.fn(),
        createTestimonial: vi.fn(),
        updateTestimonial: vi.fn(),
        deleteTestimonial: vi.fn(),
        findAllAuditLogs: vi.fn(),
        findAllPlansAdmin: vi.fn(),
        createMembershipPlan: vi.fn(),
        updateMembershipPlan: vi.fn(),
        deleteMembershipPlan: vi.fn(),
        findAllPartnerPlansAdmin: vi.fn(),
        createPartnerMembershipPlan: vi.fn(),
        updatePartnerMembershipPlan: vi.fn(),
        deletePartnerMembershipPlan: vi.fn(),
        findAllReferrals: vi.fn(),
        findAllTripsAdmin: vi.fn(),
        updateTripAdmin: vi.fn(),
        deleteTripAdmin: vi.fn(),
        findAllGroupsAdmin: vi.fn(),
        createGroupAdmin: vi.fn(),
        updateGroupAdmin: vi.fn(),
        deleteGroupAdmin: vi.fn(),
        exportUsersCsvRows: vi.fn(),
        exportBookingsCsvRows: vi.fn(),
        exportPartnersCsvRows: vi.fn(),
        findUserIdsByAudience: vi.fn(),
        findNotificationHistory: vi.fn(),
        ...overrides,
      },
    });
  }

  it("getAllPartnerMembershipPlans reads the separate Partner plan table, not the Rider one", async () => {
    const findAllPartnerPlansAdmin = vi.fn(async () => [{ id: "p1" }]);
    const findAllPlansAdmin = vi.fn();
    const module = moduleWith({ findAllPartnerPlansAdmin, findAllPlansAdmin });

    await expect(module.admin.getAllPartnerMembershipPlans()).resolves.toEqual([{ id: "p1" }]);
    expect(findAllPlansAdmin).not.toHaveBeenCalled();
  });

  it("createPartnerMembershipPlan accepts a free (price 0) plan and forwards it as-is", async () => {
    const createPartnerMembershipPlan = vi.fn(async (data) => ({ id: "p1", ...data }));
    const module = moduleWith({ createPartnerMembershipPlan });

    const data = { name: "Standard", description: "Free tier", price: 0, durationDays: 365, benefits: [] };
    await expect(module.admin.createPartnerMembershipPlan(data)).resolves.toEqual({ id: "p1", ...data });
    expect(createPartnerMembershipPlan).toHaveBeenCalledWith(data);
  });

  it("updatePartnerMembershipPlan/deletePartnerMembershipPlan delegate to the Partner-specific port methods", async () => {
    const updatePartnerMembershipPlan = vi.fn(async () => ({ id: "p1", isActive: false }));
    const deletePartnerMembershipPlan = vi.fn(async () => undefined);
    const module = moduleWith({ updatePartnerMembershipPlan, deletePartnerMembershipPlan });

    await module.admin.updatePartnerMembershipPlan("p1", { isActive: false });
    expect(updatePartnerMembershipPlan).toHaveBeenCalledWith("p1", { isActive: false });

    await module.admin.deletePartnerMembershipPlan("p1");
    expect(deletePartnerMembershipPlan).toHaveBeenCalledWith("p1");
  });
});

describe("Admin → Notifications broadcast", () => {
  function moduleWithNotify(overrides: {
    findUserIdsByAudience?: ReturnType<typeof vi.fn>;
    findNotificationHistory?: ReturnType<typeof vi.fn>;
    notifyMany?: ReturnType<typeof vi.fn>;
  }) {
    return createAdministrationModule({
      admin: {
        getAdminOverviewStats: vi.fn(),
        findAllUsers: vi.fn(),
        updateUserRole: vi.fn(),
        updateUserAccountType: vi.fn(),
        deleteUser: vi.fn(),
        findAllPartners: vi.fn(),
        getAdminPartnerStats: vi.fn(),
        findPartnerDetailById: vi.fn(),
        transitionPartnerVerification: vi.fn(),
        deletePartner: vi.fn(),
        updatePartnerType: vi.fn(),
        findAllBookingsAdmin: vi.fn(),
        updateBookingStatus: vi.fn(),
        deleteBooking: vi.fn(),
        createBike: vi.fn(),
        updateBike: vi.fn(),
        deleteBike: vi.fn(),
        findAllTestimonials: vi.fn(),
        createTestimonial: vi.fn(),
        updateTestimonial: vi.fn(),
        deleteTestimonial: vi.fn(),
        findAllAuditLogs: vi.fn(),
        findAllPlansAdmin: vi.fn(),
        createMembershipPlan: vi.fn(),
        updateMembershipPlan: vi.fn(),
        deleteMembershipPlan: vi.fn(),
        findAllPartnerPlansAdmin: vi.fn(),
        createPartnerMembershipPlan: vi.fn(),
        updatePartnerMembershipPlan: vi.fn(),
        deletePartnerMembershipPlan: vi.fn(),
        findAllReferrals: vi.fn(),
        findAllTripsAdmin: vi.fn(),
        updateTripAdmin: vi.fn(),
        deleteTripAdmin: vi.fn(),
        findAllGroupsAdmin: vi.fn(),
        createGroupAdmin: vi.fn(),
        updateGroupAdmin: vi.fn(),
        deleteGroupAdmin: vi.fn(),
        exportUsersCsvRows: vi.fn(),
        exportBookingsCsvRows: vi.fn(),
        exportPartnersCsvRows: vi.fn(),
        findUserIdsByAudience: overrides.findUserIdsByAudience ?? vi.fn(async () => []),
        findNotificationHistory: overrides.findNotificationHistory ?? vi.fn(async () => []),
      },
      notifications: {
        notify: vi.fn(),
        notifyMany: overrides.notifyMany ?? vi.fn(async () => undefined),
      },
    });
  }

  it("ALL audience resolves via findUserIdsByAudience and fans out through the existing notifyMany send path", async () => {
    const findUserIdsByAudience = vi.fn(async () => ["u1", "u2", "u3"]);
    const notifyMany = vi.fn(async () => undefined);
    const module = moduleWithNotify({ findUserIdsByAudience, notifyMany });

    const result = await module.admin.sendNotification({
      adminUserId: "admin-1",
      audience: "ALL",
      title: "Important announcement from BIKIE",
      body: "We've updated our terms.",
    });

    expect(findUserIdsByAudience).toHaveBeenCalledWith("ALL");
    expect(notifyMany).toHaveBeenCalledWith(
      ["u1", "u2", "u3"],
      "SYSTEM",
      "Important announcement from BIKIE",
      "We've updated our terms.",
    );
    expect(result).toEqual({ recipientCount: 3 });
  });

  it("RIDER / SERVICE_PROVIDER audiences resolve through the same accountType-based lookup — no second targeting system", async () => {
    const findUserIdsByAudience = vi.fn(async (audience: string) => (audience === "RIDER" ? ["r1", "r2"] : ["sp1"]));
    const notifyMany = vi.fn(async () => undefined);
    const module = moduleWithNotify({ findUserIdsByAudience, notifyMany });

    await module.admin.sendNotification({ adminUserId: "admin-1", audience: "RIDER", title: "t", body: "b" });
    expect(findUserIdsByAudience).toHaveBeenCalledWith("RIDER");
    expect(notifyMany).toHaveBeenCalledWith(["r1", "r2"], "SYSTEM", "t", "b");

    await module.admin.sendNotification({ adminUserId: "admin-1", audience: "SERVICE_PROVIDER", title: "t2", body: "b2" });
    expect(findUserIdsByAudience).toHaveBeenCalledWith("SERVICE_PROVIDER");
    expect(notifyMany).toHaveBeenCalledWith(["sp1"], "SYSTEM", "t2", "b2");
  });

  it("USER audience targets exactly the given userId, bypassing findUserIdsByAudience entirely", async () => {
    const findUserIdsByAudience = vi.fn();
    const notifyMany = vi.fn(async () => undefined);
    const module = moduleWithNotify({ findUserIdsByAudience, notifyMany });

    const result = await module.admin.sendNotification({
      adminUserId: "admin-1",
      audience: "USER",
      userId: "u-42",
      title: "t",
      body: "b",
    });

    expect(findUserIdsByAudience).not.toHaveBeenCalled();
    expect(notifyMany).toHaveBeenCalledWith(["u-42"], "SYSTEM", "t", "b");
    expect(result).toEqual({ recipientCount: 1 });
  });

  it("USER audience with no userId sends to nobody rather than guessing a recipient", async () => {
    const notifyMany = vi.fn(async () => undefined);
    const module = moduleWithNotify({ notifyMany });

    const result = await module.admin.sendNotification({ adminUserId: "admin-1", audience: "USER", title: "t", body: "b" });

    expect(notifyMany).not.toHaveBeenCalled();
    expect(result).toEqual({ recipientCount: 0 });
  });

  it("an empty audience (e.g. zero Service Providers) never calls notifyMany", async () => {
    const findUserIdsByAudience = vi.fn(async () => []);
    const notifyMany = vi.fn(async () => undefined);
    const module = moduleWithNotify({ findUserIdsByAudience, notifyMany });

    const result = await module.admin.sendNotification({
      adminUserId: "admin-1",
      audience: "SERVICE_PROVIDER",
      title: "t",
      body: "b",
    });

    expect(notifyMany).not.toHaveBeenCalled();
    expect(result).toEqual({ recipientCount: 0 });
  });

  it("listNotificationHistory delegates to findNotificationHistory with the given limit", async () => {
    const rows = [{ id: "log-1" }];
    const findNotificationHistory = vi.fn(async () => rows);
    const module = moduleWithNotify({ findNotificationHistory });

    await expect(module.admin.listNotificationHistory(20)).resolves.toEqual(rows);
    expect(findNotificationHistory).toHaveBeenCalledWith(20);
  });
});
