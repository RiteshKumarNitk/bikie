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
  findPartnerDetailById(partnerId: string): Promise<any | null>;
  transitionPartnerVerification(
    partnerId: string,
    action: "APPROVE" | "REJECT" | "REQUEST_INFO" | "SUSPEND" | "RESTORE",
    opts: { reason?: string; adminUserId: string },
  ): Promise<any>;
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

/** ADR-046b — applicant-facing notification on a verification decision. Same shape as
 * trust-safety's `TrustNotificationPort`, a separate interface per module rather than a shared
 * one so each module's port surface stays independently mockable in tests. */
export interface AdminNotificationPort {
  notify(userId: string, type: string, title: string, body: string, entity?: string, entityId?: string): Promise<void>;
}

export interface AdministrationPorts {
  admin: AdminRepositoryPort;
  notifications: AdminNotificationPort;
}

export type { AdminExportType };
