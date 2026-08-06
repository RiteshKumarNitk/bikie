export interface SOSAlertDTO {
  id: string;
  userId: string;
  userName: string;
  userPhone: string | null;
  userEmail: string;
  type: string;
  description: string | null;
  latitude: number;
  longitude: number;
  city: string;
  status: string;
  severity: string;
  escalationTier: string;
  currentRadiusMeters: number;
  assignedHelperId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  /** Reverse-geocoded from latitude/longitude at creation time (ADR-038) — null if the lookup
   * failed or timed out. Every reader falls back to `city`/raw coordinates when null. */
  placeName: string | null;
  area: string | null;
  formattedAddress: string | null;
}

export interface SOSAlertCreateInput {
  type: string;
  description?: string;
  latitude: number;
  longitude: number;
  city: string;
}

export interface SOSOfferDTO {
  id: string;
  alertId: string;
  responderId: string;
  responderName: string;
  responderPhone: string | null;
  status: string;
  distanceMeters: number | null;
  etaMinutes: number | null;
  message: string | null;
  createdAt: string;
}

export interface SOSSessionDTO {
  id: string;
  alertId: string;
  helperId: string;
  riderId: string;
  status: string;
  conversationId: string | null;
  startedAt: string;
  helperArrivedAt: string | null;
  assistanceStartedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  rating: number | null;
  ratingComment: string | null;
}

export interface SOSTimelineEventDTO {
  id: string;
  alertId: string;
  sessionId: string | null;
  type: string;
  actorId: string | null;
  actorName: string | null;
  createdAt: string;
}