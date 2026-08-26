import { createRideRoomApplication } from "./application/ride-room.application";
import { createTripApplication } from "./application/trip.application";
import {
  createAnnouncementRepositoryAdapter,
  createConversationLookupAdapter,
  createRideNotificationAdapter,
  createRideRealtimeAdapter,
  createSystemMessageAdapter,
  createTripRepositoryAdapter,
  createUnreadMessagesAdapter,
} from "./infrastructure/repositories.adapter";
import type { RidesCommunityPorts } from "./ports";

export type RidesCommunityModule = {
  ports: RidesCommunityPorts;
  trips: ReturnType<typeof createTripApplication>;
  rideRoom: ReturnType<typeof createRideRoomApplication>;
};

export type RidesCommunityDeps = Partial<RidesCommunityPorts>;

export function createRidesCommunityModule(overrides: RidesCommunityDeps = {}): RidesCommunityModule {
  const ports: RidesCommunityPorts = {
    trips: overrides.trips ?? createTripRepositoryAdapter(),
    announcements: overrides.announcements ?? createAnnouncementRepositoryAdapter(),
    unread: overrides.unread ?? createUnreadMessagesAdapter(),
    conversations: overrides.conversations ?? createConversationLookupAdapter(),
    systemMessages: overrides.systemMessages ?? createSystemMessageAdapter(),
    notifications: overrides.notifications ?? createRideNotificationAdapter(),
    realtime: overrides.realtime ?? createRideRealtimeAdapter(),
  };

  return {
    ports,
    trips: createTripApplication(ports),
    rideRoom: createRideRoomApplication(ports),
  };
}

let defaultModule: RidesCommunityModule | null = null;

export function getRidesCommunityModule(): RidesCommunityModule {
  if (!defaultModule) defaultModule = createRidesCommunityModule();
  return defaultModule;
}

export function setRidesCommunityModuleForTests(module: RidesCommunityModule | null): void {
  defaultModule = module;
}

export type { RidesCommunityPorts, TripListFilters } from "./ports";
export type {
  CancelTripResult,
  DecideRequestResult,
  GetGroupResult,
  GetRequestsResult,
  LeaveRideResult,
  RequestToJoinResult,
  UpdateTripResult,
} from "./application/trip.application";
export type { RideRoomResult } from "./application/ride-room.application";
export {
  evaluateJoinRequest,
  evaluateDecideRequest,
  evaluateLeaveRide,
  computeApprovalRate,
} from "./domain/participation";
export { resolveRideRoomAccess, canManageRideRoom } from "./domain/room-access";
export type { RideRoomRole } from "./domain/room-access";
export { DEFAULT_TRIP_IMAGE } from "./domain/defaults";
export { redactTripDetailForViewer } from "./domain/visibility";
export type { TripViewer } from "./domain/visibility";
