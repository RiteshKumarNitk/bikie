import type { AdminOverviewStatsDTO } from "@bikie/types";
import type { AdminExportType } from "../domain/csv";

/**
 * Admin repository surface — return types stay deliberately loose (`any`) so the
 * large admin CRUD DTO set does not need a parallel type layer during the Strangler
 * migration. Routes already depend on the repository shapes via AdminService.
 */
export interface AdminRepositoryPort {
  getAdminOverviewStats(): Promise<AdminOverviewStatsDTO>;
  findAllUsers(): Promise<any[]>;
  updateUserRole(userId: string, role: string): Promise<any>;
  deleteUser(userId: string): Promise<any>;
  findAllPartners(): Promise<any[]>;
  updatePartnerVerification(partnerId: string, isVerified: boolean): Promise<any>;
  deletePartner(partnerId: string): Promise<any>;
  findAllBookingsAdmin(): Promise<any[]>;
  updateBookingStatus(bookingId: string, status: string): Promise<any>;
  deleteBooking(bookingId: string): Promise<any>;
  createBike(data: Record<string, unknown>): Promise<any>;
  updateBike(bikeId: string, data: Record<string, unknown>): Promise<any>;
  deleteBike(bikeId: string): Promise<any>;
  findAllTestimonials(): Promise<any[]>;
  createTestimonial(data: Record<string, unknown>): Promise<any>;
  updateTestimonial(id: string, data: Record<string, unknown>): Promise<any>;
  deleteTestimonial(id: string): Promise<any>;
  findAllAuditLogs(): Promise<any[]>;
  findAllPlansAdmin(): Promise<any[]>;
  createMembershipPlan(data: Record<string, unknown>): Promise<any>;
  updateMembershipPlan(id: string, data: Record<string, unknown>): Promise<any>;
  deleteMembershipPlan(id: string): Promise<any>;
  findAllReferrals(): Promise<any[]>;
  findAllTripsAdmin(): Promise<any[]>;
  updateTripAdmin(tripId: string, data: Record<string, unknown>): Promise<any>;
  deleteTripAdmin(tripId: string): Promise<any>;
  findAllGroupsAdmin(): Promise<any[]>;
  createGroupAdmin(data: Record<string, unknown>): Promise<any>;
  updateGroupAdmin(groupId: string, data: Record<string, unknown>): Promise<any>;
  deleteGroupAdmin(groupId: string): Promise<any>;
  exportUsersCsvRows(take: number): Promise<Record<string, unknown>[]>;
  exportBookingsCsvRows(take: number): Promise<Record<string, unknown>[]>;
  exportPartnersCsvRows(take: number): Promise<Record<string, unknown>[]>;
}

export interface AdministrationPorts {
  admin: AdminRepositoryPort;
}

export type { AdminExportType };
