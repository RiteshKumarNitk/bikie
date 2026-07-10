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
}

export interface TripDetailDTO extends TripSummaryDTO {
  description: string;
  gallery: string[];
  meetingPoint: string | null;
  organizer: { id: string; name: string; image: string | null };
}

export interface RideJoinRequestDTO {
  id: string;
  message: string | null;
  createdAt: string;
  rider: { id: string; name: string; image: string | null };
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
