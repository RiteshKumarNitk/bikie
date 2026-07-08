import { tripRepository } from "@bikie/database";
import type { TripDetailDTO, TripSummaryDTO } from "@bikie/types";

export const TripService = {
  async getByTab(tab?: string): Promise<TripSummaryDTO[]> {
    return tripRepository.findTrips(tab);
  },

  async getBySlug(slug: string): Promise<TripDetailDTO | null> {
    return tripRepository.findTripBySlug(slug);
  },

  async getOrganizedBy(userId: string): Promise<TripSummaryDTO[]> {
    return tripRepository.findTripsOrganizedBy(userId);
  },

  async getJoinedBy(userId: string): Promise<TripSummaryDTO[]> {
    return tripRepository.findTripsJoinedBy(userId);
  },
};
