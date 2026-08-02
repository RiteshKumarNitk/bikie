import { getAdministrationModule } from "./modules/administration/public";
import type { AdminOverviewStatsDTO } from "@bikie/types";

/** Compatibility facade — routes keep importing AdminService. */
export const AdminService = {
  getOverviewStats(): Promise<AdminOverviewStatsDTO> {
    return getAdministrationModule().admin.getOverviewStats();
  },
  getAllUsers() {
    return getAdministrationModule().admin.getAllUsers();
  },
  updateUserRole(userId: string, role: string) {
    return getAdministrationModule().admin.updateUserRole(userId, role);
  },
  deleteUser(userId: string) {
    return getAdministrationModule().admin.deleteUser(userId);
  },
  getAllPartners() {
    return getAdministrationModule().admin.getAllPartners();
  },
  updatePartnerVerification(partnerId: string, isVerified: boolean) {
    return getAdministrationModule().admin.updatePartnerVerification(partnerId, isVerified);
  },
  deletePartner(partnerId: string) {
    return getAdministrationModule().admin.deletePartner(partnerId);
  },
  getAllBookings() {
    return getAdministrationModule().admin.getAllBookings();
  },
  updateBookingStatus(bookingId: string, status: string) {
    return getAdministrationModule().admin.updateBookingStatus(bookingId, status);
  },
  deleteBooking(bookingId: string) {
    return getAdministrationModule().admin.deleteBooking(bookingId);
  },
  createBike(data: {
    name: string;
    slug: string;
    brand: string;
    categoryId: string;
    city: string;
    pricePerDay: number;
    imageUrl: string;
    ownerId?: string;
    description?: string;
  }) {
    return getAdministrationModule().admin.createBike(data);
  },
  updateBike(bikeId: string, data: Record<string, unknown>) {
    return getAdministrationModule().admin.updateBike(bikeId, data);
  },
  deleteBike(bikeId: string) {
    return getAdministrationModule().admin.deleteBike(bikeId);
  },
  getAllTestimonials() {
    return getAdministrationModule().admin.getAllTestimonials();
  },
  createTestimonial(data: {
    authorName: string;
    authorLocation?: string;
    authorAvatarUrl?: string;
    rating: number;
    quote: string;
  }) {
    return getAdministrationModule().admin.createTestimonial(data);
  },
  updateTestimonial(id: string, data: Record<string, unknown>) {
    return getAdministrationModule().admin.updateTestimonial(id, data);
  },
  deleteTestimonial(id: string) {
    return getAdministrationModule().admin.deleteTestimonial(id);
  },
  getAllAuditLogs() {
    return getAdministrationModule().admin.getAllAuditLogs();
  },
  getAllMembershipPlans() {
    return getAdministrationModule().admin.getAllMembershipPlans();
  },
  createMembershipPlan(data: {
    name: string;
    description: string;
    price: number;
    durationDays: number;
    benefits: string[];
    sortOrder?: number;
  }) {
    return getAdministrationModule().admin.createMembershipPlan(data);
  },
  updateMembershipPlan(id: string, data: Record<string, unknown>) {
    return getAdministrationModule().admin.updateMembershipPlan(id, data);
  },
  deleteMembershipPlan(id: string) {
    return getAdministrationModule().admin.deleteMembershipPlan(id);
  },
  getAllReferrals() {
    return getAdministrationModule().admin.getAllReferrals();
  },
  getAllTrips() {
    return getAdministrationModule().admin.getAllTrips();
  },
  updateTrip(
    tripId: string,
    data: Partial<{
      title: string;
      description: string;
      seatsTotal: number;
      startDate: string;
      endDate: string;
      status: string;
    }>,
  ) {
    return getAdministrationModule().admin.updateTrip(tripId, data);
  },
  deleteTrip(tripId: string) {
    return getAdministrationModule().admin.deleteTrip(tripId);
  },
  getAllGroups() {
    return getAdministrationModule().admin.getAllGroups();
  },
  createGroup(data: {
    name: string;
    description: string;
    imageUrl: string;
    type: "COMMUNITY" | "CLUB";
    city?: string;
    isPrivate?: boolean;
    ownerId: string;
  }) {
    return getAdministrationModule().admin.createGroup(data);
  },
  updateGroup(
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
  ) {
    return getAdministrationModule().admin.updateGroup(groupId, data);
  },
  deleteGroup(groupId: string) {
    return getAdministrationModule().admin.deleteGroup(groupId);
  },
  exportCsv(type: "users" | "bookings" | "partners") {
    return getAdministrationModule().admin.exportCsv(type);
  },
};
