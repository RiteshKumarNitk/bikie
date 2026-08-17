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
