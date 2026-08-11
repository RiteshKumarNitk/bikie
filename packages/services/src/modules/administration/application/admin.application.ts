import {
  buildCsv,
  exportFilenameFor,
  MAX_ADMIN_CSV_ROWS,
  type AdminExportType,
} from "../domain/csv";
import type { AdministrationPorts } from "../ports";

type PartnerVerificationAction = "APPROVE" | "REJECT" | "REQUEST_INFO" | "SUSPEND" | "RESTORE";

const NOTIFICATION_COPY: Record<
  PartnerVerificationAction,
  { type: string; title: string; body: (reason?: string) => string }
> = {
  APPROVE: {
    type: "PARTNER_APPLICATION_APPROVED",
    title: "You're now a verified Service Provider",
    body: () => "Your Service Provider application was approved — switch to Service Provider mode to get started.",
  },
  REJECT: {
    type: "PARTNER_APPLICATION_REJECTED",
    title: "Your Service Provider application was not approved",
    body: (reason) => reason ?? "Your Service Provider application was rejected.",
  },
  REQUEST_INFO: {
    type: "PARTNER_APPLICATION_INFO_REQUESTED",
    title: "More information needed for your Service Provider application",
    body: (reason) => reason ?? "Please review and update your Service Provider application.",
  },
  SUSPEND: {
    type: "PARTNER_APPLICATION_SUSPENDED",
    title: "Your Service Provider account has been suspended",
    body: (reason) => reason ?? "Your Service Provider account has been suspended.",
  },
  RESTORE: {
    type: "PARTNER_APPLICATION_APPROVED",
    title: "Your Service Provider account has been restored",
    body: () => "Your Service Provider account is active again.",
  },
};

export function createAdminApplication(ports: AdministrationPorts) {
  return {
    getOverviewStats: () => ports.admin.getAdminOverviewStats(),
    getAllUsers: () => ports.admin.findAllUsers(),
    updateUserRole: (userId: string, role: string) => ports.admin.updateUserRole(userId, role),
    deleteUser: (userId: string) => ports.admin.deleteUser(userId),
    getAllPartners: () => ports.admin.findAllPartners(),
    getPartnerStats: () => ports.admin.getAdminPartnerStats(),
    getPartnerDetail: (partnerId: string) => ports.admin.findPartnerDetailById(partnerId),
    /** ADR-046b — the one place every Approve/Reject/Request-info/Suspend/Restore decision goes
     * through. The DB write is the transactional part (Partner.verificationStatus + isVerified +
     * User.partnerStatus, atomically); notifying the applicant is a best-effort side effect that
     * must never make an otherwise-successful decision fail. */
    async transitionPartnerVerification(
      partnerId: string,
      action: "APPROVE" | "REJECT" | "REQUEST_INFO" | "SUSPEND" | "RESTORE",
      opts: { reason?: string; adminUserId: string },
    ) {
      const result = await ports.admin.transitionPartnerVerification(partnerId, action, opts);
      if (result.ok) {
        const copy = NOTIFICATION_COPY[action];
        await ports.notifications
          .notify(result.userId, copy.type, copy.title, copy.body(opts.reason), "Partner", partnerId)
          .catch((err) => console.error("[Admin][PartnerVerification] notify failed", err));
      }
      return result;
    },
    deletePartner: (partnerId: string) => ports.admin.deletePartner(partnerId),
    updatePartnerType: (partnerId: string, type: string) => ports.admin.updatePartnerType(partnerId, type),
    getAllBookings: () => ports.admin.findAllBookingsAdmin(),
    updateBookingStatus: (bookingId: string, status: string) =>
      ports.admin.updateBookingStatus(bookingId, status),
    deleteBooking: (bookingId: string) => ports.admin.deleteBooking(bookingId),
    createBike: (data: {
      name: string;
      slug: string;
      brand: string;
      categoryId: string;
      city: string;
      pricePerDay: number;
      imageUrl: string;
      gallery?: string[];
      ownerId?: string;
      description?: string;
    }) => ports.admin.createBike(data),
    updateBike: (bikeId: string, data: Record<string, unknown>) => ports.admin.updateBike(bikeId, data),
    deleteBike: (bikeId: string) => ports.admin.deleteBike(bikeId),
    getAllTestimonials: () => ports.admin.findAllTestimonials(),
    createTestimonial: (data: {
      authorName: string;
      authorLocation?: string;
      authorAvatarUrl?: string;
      rating: number;
      quote: string;
    }) => ports.admin.createTestimonial(data),
    updateTestimonial: (id: string, data: Record<string, unknown>) =>
      ports.admin.updateTestimonial(id, data),
    deleteTestimonial: (id: string) => ports.admin.deleteTestimonial(id),
    getAllAuditLogs: () => ports.admin.findAllAuditLogs(),
    getAllMembershipPlans: () => ports.admin.findAllPlansAdmin(),
    createMembershipPlan: (data: {
      name: string;
      description: string;
      price: number;
      durationDays: number;
      benefits: string[];
      sortOrder?: number;
    }) => ports.admin.createMembershipPlan(data),
    updateMembershipPlan: (id: string, data: Record<string, unknown>) =>
      ports.admin.updateMembershipPlan(id, data),
    deleteMembershipPlan: (id: string) => ports.admin.deleteMembershipPlan(id),
    getAllPartnerMembershipPlans: () => ports.admin.findAllPartnerPlansAdmin(),
    createPartnerMembershipPlan: (data: {
      name: string;
      description: string;
      price: number;
      durationDays: number;
      benefits: string[];
      sortOrder?: number;
    }) => ports.admin.createPartnerMembershipPlan(data),
    updatePartnerMembershipPlan: (id: string, data: Record<string, unknown>) =>
      ports.admin.updatePartnerMembershipPlan(id, data),
    deletePartnerMembershipPlan: (id: string) => ports.admin.deletePartnerMembershipPlan(id),
    getAllReferrals: () => ports.admin.findAllReferrals(),
    getAllTrips: () => ports.admin.findAllTripsAdmin(),
    updateTrip: (
      tripId: string,
      data: Partial<{
        title: string;
        description: string;
        seatsTotal: number;
        startDate: string;
        endDate: string;
        status: string;
      }>,
    ) => ports.admin.updateTripAdmin(tripId, data),
    deleteTrip: (tripId: string) => ports.admin.deleteTripAdmin(tripId),
    getAllGroups: () => ports.admin.findAllGroupsAdmin(),
    createGroup: (data: {
      name: string;
      description: string;
      imageUrl: string;
      type: "COMMUNITY" | "CLUB";
      city?: string;
      isPrivate?: boolean;
      ownerId: string;
    }) => ports.admin.createGroupAdmin(data),
    updateGroup: (
      groupId: string,
      data: Partial<{
        name: string;
        description: string;
        imageUrl: string;
        type: "COMMUNITY" | "CLUB";
        city: string | null;
        isPrivate: boolean;
        ownerId: string;
      }>,
    ) => ports.admin.updateGroupAdmin(groupId, data),
    deleteGroup: (groupId: string) => ports.admin.deleteGroupAdmin(groupId),

    /**
     * CSV export for admin downloads. Sanitizes cells against spreadsheet formula injection
     * and caps rows at MAX_ADMIN_CSV_ROWS. Returns null when `type` is unsupported.
     */
    async exportCsv(
      type: AdminExportType,
    ): Promise<{ csv: string; filename: string } | null> {
      let rows: Record<string, unknown>[];
      switch (type) {
        case "users":
          rows = await ports.admin.exportUsersCsvRows(MAX_ADMIN_CSV_ROWS);
          break;
        case "bookings":
          rows = await ports.admin.exportBookingsCsvRows(MAX_ADMIN_CSV_ROWS);
          break;
        case "partners":
          rows = await ports.admin.exportPartnersCsvRows(MAX_ADMIN_CSV_ROWS);
          break;
        default:
          return null;
      }
      return { csv: buildCsv(rows), filename: exportFilenameFor(type) };
    },
  };
}

export type AdminApplication = ReturnType<typeof createAdminApplication>;
