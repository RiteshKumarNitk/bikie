export interface RideRoomDTO {
  tripId: string;
  conversationId: string;
  role: "ORGANIZER" | "MEMBER" | "ADMIN";
  isLocked: boolean;
  meetingPoint: string | null;
  meetingLat: number | null;
  meetingLng: number | null;
  emergencyContacts: EmergencyContactDTO[];
}

export interface EmergencyContactDTO {
  name: string;
  phone: string;
  relation: string;
}

export interface AnnouncementDTO {
  id: string;
  tripId: string;
  authorId: string;
  authorName: string;
  content: string;
  pinnedAt: string | null;
  createdAt: string;
}

export interface MediaItemDTO {
  id: string;
  type: "IMAGE" | "DOCUMENT";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
}
