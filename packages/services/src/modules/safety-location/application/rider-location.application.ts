import type { SafetyLocationPorts } from "../ports";

export function createRiderLocationApplication(ports: SafetyLocationPorts) {
  return {
    async setSharing(userId: string, enabled: boolean): Promise<void> {
      await ports.riderLocation.setSharingEnabled(userId, enabled);
    },

    getSharing(userId: string): Promise<boolean> {
      return ports.riderLocation.getSharingEnabled(userId);
    },

    /** Returns false if the update was rejected because sharing isn't enabled server-side. */
    async updateLocation(userId: string, lat: number, lng: number): Promise<boolean> {
      const affected = await ports.riderLocation.updateLocationIfSharing(userId, lat, lng);
      return affected > 0;
    },

    async findNearby(userId: string, radiusKm: number) {
      const rows = await ports.riderLocation.findNearby(userId, radiusKm * 1000);
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        distanceMeters: Math.round(r.distanceMeters),
      }));
    },

    async autoDisableStaleSharing(minutes: number): Promise<void> {
      await ports.riderLocation.autoDisableStaleSharing(minutes);
    },
  };
}

export type RiderLocationApplication = ReturnType<typeof createRiderLocationApplication>;
