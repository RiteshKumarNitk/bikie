import { adminRepository } from "@bikie/database";
import type { AdminOverviewStatsDTO } from "@bikie/types";

export const AdminService = {
  async getOverviewStats(): Promise<AdminOverviewStatsDTO> {
    return adminRepository.getAdminOverviewStats();
  },

  async getAllUsers() {
    return adminRepository.findAllUsers();
  },

  async updateUserRole(userId: string, role: string) {
    return adminRepository.updateUserRole(userId, role);
  },

  async deleteUser(userId: string) {
    return adminRepository.deleteUser(userId);
  },

  async getAllPartners() {
    return adminRepository.findAllPartners();
  },

  async updatePartnerVerification(partnerId: string, isVerified: boolean) {
    return adminRepository.updatePartnerVerification(partnerId, isVerified);
  },

  async deletePartner(partnerId: string) {
    return adminRepository.deletePartner(partnerId);
  },

  async getAllBookings() {
    return adminRepository.findAllBookingsAdmin();
  },

  async updateBookingStatus(bookingId: string, status: string) {
    return adminRepository.updateBookingStatus(bookingId, status);
  },

  async deleteBooking(bookingId: string) {
    return adminRepository.deleteBooking(bookingId);
  },

  async createBike(data: {
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
    return adminRepository.createBike(data);
  },

  async updateBike(bikeId: string, data: any) {
    return adminRepository.updateBike(bikeId, data);
  },

  async deleteBike(bikeId: string) {
    return adminRepository.deleteBike(bikeId);
  },

  // --- Testimonials ---

  async getAllTestimonials() {
    return adminRepository.findAllTestimonials();
  },

  async createTestimonial(data: {
    authorName: string;
    authorLocation?: string;
    authorAvatarUrl?: string;
    rating: number;
    quote: string;
  }) {
    return adminRepository.createTestimonial(data);
  },

  async updateTestimonial(id: string, data: any) {
    return adminRepository.updateTestimonial(id, data);
  },

  async deleteTestimonial(id: string) {
    return adminRepository.deleteTestimonial(id);
  },

  // --- Audit Logs ---

  async getAllAuditLogs() {
    return adminRepository.findAllAuditLogs();
  },

  // --- Membership Plans ---

  async getAllMembershipPlans() {
    return adminRepository.findAllPlansAdmin();
  },

  async createMembershipPlan(data: {
    name: string;
    description: string;
    price: number;
    durationDays: number;
    benefits: string[];
    sortOrder?: number;
  }) {
    return adminRepository.createMembershipPlan(data);
  },

  async updateMembershipPlan(id: string, data: any) {
    return adminRepository.updateMembershipPlan(id, data);
  },

  async deleteMembershipPlan(id: string) {
    return adminRepository.deleteMembershipPlan(id);
  },

  // --- Referrals ---

  async getAllReferrals() {
    return adminRepository.findAllReferrals();
  },
};
