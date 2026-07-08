import { adminRepository } from "@bikie/database";
import type { AdminOverviewStatsDTO } from "@bikie/types";

export const AdminService = {
  async getOverviewStats(): Promise<AdminOverviewStatsDTO> {
    return adminRepository.getAdminOverviewStats();
  },

  async getAllUsers() {
    return adminRepository.findAllUsers();
  },

  async getAllPartners() {
    return adminRepository.findAllPartners();
  },

  async getAllBookings() {
    return adminRepository.findAllBookingsAdmin();
  },
};
