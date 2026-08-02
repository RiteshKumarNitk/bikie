import {
  getRidesCommunityModule,
  type DecideRequestResult,
  type GetGroupResult,
  type GetRequestsResult,
  type LeaveRideResult,
  type RequestToJoinResult,
  type TripListFilters,
} from "./modules/rides-community/public";
import type {
  MyRideRequestStatusDTO,
  RideJoinRequestDTO,
  RideStatsDTO,
  TripDetailDTO,
  TripSummaryDTO,
} from "@bikie/types";
import type { CreateTripInput, UpdateTripInput } from "@bikie/validation";

export type {
  DecideRequestResult,
  GetGroupResult,
  GetRequestsResult,
  LeaveRideResult,
  RequestToJoinResult,
  TripListFilters,
};

/** Compatibility facade — routes keep importing TripService. */
export const TripService = {
  getByTab(tab?: string, filters?: TripListFilters): Promise<TripSummaryDTO[]> {
    return getRidesCommunityModule().trips.getByTab(tab, filters);
  },

  getBySlug(slug: string): Promise<TripDetailDTO | null> {
    return getRidesCommunityModule().trips.getBySlug(slug);
  },

  getRequestedBy(userId: string): Promise<TripSummaryDTO[]> {
    return getRidesCommunityModule().trips.getRequestedBy(userId);
  },

  getAllPendingRequests(userId: string): Promise<RideJoinRequestDTO[]> {
    return getRidesCommunityModule().trips.getAllPendingRequests(userId);
  },

  getOverview(userId: string) {
    return getRidesCommunityModule().trips.getOverview(userId);
  },

  getStats(userId: string): Promise<RideStatsDTO> {
    return getRidesCommunityModule().trips.getStats(userId);
  },

  getOrganizedBy(userId: string): Promise<TripSummaryDTO[]> {
    return getRidesCommunityModule().trips.getOrganizedBy(userId);
  },

  getJoinedBy(userId: string): Promise<TripSummaryDTO[]> {
    return getRidesCommunityModule().trips.getJoinedBy(userId);
  },

  create(organizerId: string, input: CreateTripInput): Promise<TripSummaryDTO> {
    return getRidesCommunityModule().trips.create(organizerId, input);
  },

  update(slug: string, userId: string, input: UpdateTripInput) {
    return getRidesCommunityModule().trips.update(slug, userId, input);
  },

  requestToJoin(slug: string, userId: string, message?: string): Promise<RequestToJoinResult> {
    return getRidesCommunityModule().trips.requestToJoin(slug, userId, message);
  },

  getMyRequestStatus(slug: string, userId: string): Promise<MyRideRequestStatusDTO | null> {
    return getRidesCommunityModule().trips.getMyRequestStatus(slug, userId);
  },

  getPendingRequests(slug: string, organizerId: string): Promise<GetRequestsResult> {
    return getRidesCommunityModule().trips.getPendingRequests(slug, organizerId);
  },

  decideRequest(
    participantId: string,
    organizerId: string,
    decision: "APPROVED" | "REJECTED",
  ): Promise<DecideRequestResult> {
    return getRidesCommunityModule().trips.decideRequest(participantId, organizerId, decision);
  },

  leaveRide(slug: string, userId: string, userName: string): Promise<LeaveRideResult> {
    return getRidesCommunityModule().trips.leaveRide(slug, userId, userName);
  },

  getGroup(slug: string, userId: string): Promise<GetGroupResult> {
    return getRidesCommunityModule().trips.getGroup(slug, userId);
  },

  getRideStats(userId: string): Promise<RideStatsDTO> {
    return getRidesCommunityModule().trips.getRideStats(userId);
  },
};
