export interface TripSummaryDTO {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  type: string;
  difficulty: string;
  price: number;
  seatsTotal: number;
  seatsLeft: number;
  startDate: string;
  endDate: string;
  status: string;
  destination: { name: string; slug: string } | null;
  // ADR-037: freeform, organizer-typed destination name — shown in place of `destination?.name`
  // when set, since ride creation no longer requires picking from the curated catalog above.
  destinationName: string | null;
  unreadMessages?: number;
  pendingRequests?: number;
  membersCount?: number;
}

export interface TripDetailDTO extends TripSummaryDTO {
  description: string;
  gallery: string[];
  meetingPoint: string | null;
  meetingLat: number | null;
  meetingLng: number | null;
  organizer: { id: string; name: string; image: string | null };
  members?: { id: string; name: string; image: string | null }[];
}

export interface RideJoinRequestDTO {
  id: string;
  tripId: string;
  tripSlug: string;
  tripTitle: string;
  message: string | null;
  createdAt: string;
  rider: { 
    id: string; 
    name: string; 
    image: string | null;
    completedRides?: number;
    rating?: number;
    bike?: string;
  };
}

export interface MyRideRequestStatusDTO {
  status: string;
  message: string | null;
}

export interface RideStatsDTO {
  ridesOrganized: number;
  requestsSent: number;
  requestsApproved: number;
  ridesCancelled: number;
  approvalRate: number | null;
}

export interface ActionableItemDTO {
  id: string;
  type: 'PENDING_APPROVALS' | 'RIDE_STARTING_SOON' | 'MISSING_MEETING_POINT' | 'UNREAD_MESSAGES';
  title: string;
  description?: string;
  actionLabel: string;
  actionHref: string;
}

export interface DashboardOverviewDTO {
  stats: {
    upcomingRides: number;
    pendingRequests: number;
    unreadMessages: number;
    ridesTomorrow: number;
  };
  actionableItems: ActionableItemDTO[];
}
