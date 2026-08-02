import {
  buildCsv,
  exportFilenameFor,
  MAX_ADMIN_CSV_ROWS,
  type AdminExportType,
} from "../domain/csv";
import type { AdministrationPorts } from "../ports";

export function createAdminApplication(ports: AdministrationPorts) {
  return {
    getOverviewStats: () => ports.admin.getAdminOverviewStats(),
    getAllUsers: () => ports.admin.findAllUsers(),
    updateUserRole: (userId: string, role: string) => ports.admin.updateUserRole(userId, role),
    deleteUser: (userId: string) => ports.admin.deleteUser(userId),
    getAllPartners: () => ports.admin.findAllPartners(),
    updatePartnerVerification: (partnerId: string, isVerified: boolean) =>
      ports.admin.updatePartnerVerification(partnerId, isVerified),
    deletePartner: (partnerId: string) => ports.admin.deletePartner(partnerId),
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
