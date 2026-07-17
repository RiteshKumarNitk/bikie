import { riderLocationRepository } from "@bikie/database";

export const RiderLocationService = {
  async setSharing(userId: string, enabled: boolean): Promise<void> {
    await riderLocationRepository.setSharingEnabled(userId, enabled);
  },

  async getSharing(userId: string): Promise<boolean> {
    return riderLocationRepository.getSharingEnabled(userId);
  },

  /** Returns false if the update was rejected because sharing isn't enabled server-side. */
  async updateLocation(userId: string, lat: number, lng: number): Promise<boolean> {
    const affected = await riderLocationRepository.updateLocationIfSharing(userId, lat, lng);
    return affected > 0;
  },

  async findNearby(userId: string, radiusKm: number) {
    const rows = await riderLocationRepository.findNearby(userId, radiusKm * 1000);
    return rows.map((r) => ({ id: r.id, name: r.name, distanceMeters: Math.round(r.distanceMeters) }));
  },

  async autoDisableStaleSharing(minutes: number): Promise<void> {
    await riderLocationRepository.autoDisableStaleSharing(minutes);
  },
};
