import { getSafetyLocationModule } from "./modules/safety-location/public";

/** Compatibility facade — routes keep importing RiderLocationService. */
export const RiderLocationService = {
  async setSharing(userId: string, enabled: boolean): Promise<void> {
    await getSafetyLocationModule().riderLocation.setSharing(userId, enabled);
  },

  async getSharing(userId: string): Promise<boolean> {
    return getSafetyLocationModule().riderLocation.getSharing(userId);
  },

  /** Returns false if the update was rejected because sharing isn't enabled server-side. */
  async updateLocation(userId: string, lat: number, lng: number): Promise<boolean> {
    return getSafetyLocationModule().riderLocation.updateLocation(userId, lat, lng);
  },

  async findNearby(userId: string, radiusKm: number) {
    return getSafetyLocationModule().riderLocation.findNearby(userId, radiusKm);
  },

  async autoDisableStaleSharing(minutes: number): Promise<void> {
    await getSafetyLocationModule().riderLocation.autoDisableStaleSharing(minutes);
  },
};
