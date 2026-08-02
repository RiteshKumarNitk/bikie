import { adminRepository } from "@bikie/database";
import type { AdminRepositoryPort } from "../ports";

export function createAdminRepositoryAdapter(): AdminRepositoryPort {
  return {
    getAdminOverviewStats: () => adminRepository.getAdminOverviewStats(),
    findAllUsers: () => adminRepository.findAllUsers(),
    updateUserRole: (userId, role) => adminRepository.updateUserRole(userId, role),
    deleteUser: (userId) => adminRepository.deleteUser(userId),
    findAllPartners: () => adminRepository.findAllPartners(),
    updatePartnerVerification: (partnerId, isVerified) =>
      adminRepository.updatePartnerVerification(partnerId, isVerified),
    deletePartner: (partnerId) => adminRepository.deletePartner(partnerId),
    findAllBookingsAdmin: () => adminRepository.findAllBookingsAdmin(),
    updateBookingStatus: (bookingId, status) => adminRepository.updateBookingStatus(bookingId, status),
    deleteBooking: (bookingId) => adminRepository.deleteBooking(bookingId),
    createBike: (data) => adminRepository.createBike(data as never),
    updateBike: (bikeId, data) => adminRepository.updateBike(bikeId, data as never),
    deleteBike: (bikeId) => adminRepository.deleteBike(bikeId),
    findAllTestimonials: () => adminRepository.findAllTestimonials(),
    createTestimonial: (data) => adminRepository.createTestimonial(data as never),
    updateTestimonial: (id, data) => adminRepository.updateTestimonial(id, data as never),
    deleteTestimonial: (id) => adminRepository.deleteTestimonial(id),
    findAllAuditLogs: () => adminRepository.findAllAuditLogs(),
    findAllPlansAdmin: () => adminRepository.findAllPlansAdmin(),
    createMembershipPlan: (data) => adminRepository.createMembershipPlan(data as never),
    updateMembershipPlan: (id, data) => adminRepository.updateMembershipPlan(id, data as never),
    deleteMembershipPlan: (id) => adminRepository.deleteMembershipPlan(id),
    findAllReferrals: () => adminRepository.findAllReferrals(),
    findAllTripsAdmin: () => adminRepository.findAllTripsAdmin(),
    updateTripAdmin: (tripId, data) => adminRepository.updateTripAdmin(tripId, data as never),
    deleteTripAdmin: (tripId) => adminRepository.deleteTripAdmin(tripId),
    findAllGroupsAdmin: () => adminRepository.findAllGroupsAdmin(),
    createGroupAdmin: (data) => adminRepository.createGroupAdmin(data as never),
    updateGroupAdmin: (groupId, data) => adminRepository.updateGroupAdmin(groupId, data as never),
    deleteGroupAdmin: (groupId) => adminRepository.deleteGroupAdmin(groupId),
    exportUsersCsvRows: (take) => adminRepository.exportUsersCsvRows(take),
    exportBookingsCsvRows: (take) => adminRepository.exportBookingsCsvRows(take),
    exportPartnersCsvRows: (take) => adminRepository.exportPartnersCsvRows(take),
  };
}
