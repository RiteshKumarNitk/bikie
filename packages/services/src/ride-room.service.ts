import {
  getRidesCommunityModule,
  type RideRoomResult,
} from "./modules/rides-community/public";
import type { AnnouncementDTO, EmergencyContactDTO, MediaItemDTO, RideRoomDTO } from "@bikie/types";

export type { RideRoomResult };

/** Compatibility facade — routes keep importing RideRoomService. */
export const RideRoomService = {
  getRoom(slug: string, userId: string, userRole: string): Promise<RideRoomResult<RideRoomDTO>> {
    return getRidesCommunityModule().rideRoom.getRoom(slug, userId, userRole);
  },

  getAnnouncements(
    slug: string,
    userId: string,
    userRole: string,
  ): Promise<RideRoomResult<AnnouncementDTO[]>> {
    return getRidesCommunityModule().rideRoom.getAnnouncements(slug, userId, userRole);
  },

  postAnnouncement(
    slug: string,
    userId: string,
    userRole: string,
    content: string,
  ): Promise<RideRoomResult<AnnouncementDTO>> {
    return getRidesCommunityModule().rideRoom.postAnnouncement(slug, userId, userRole, content);
  },

  deleteAnnouncement(
    slug: string,
    announcementId: string,
    userId: string,
    userRole: string,
  ): Promise<RideRoomResult<null>> {
    return getRidesCommunityModule().rideRoom.deleteAnnouncement(slug, announcementId, userId, userRole);
  },

  updateMeetingPoint(
    slug: string,
    userId: string,
    userRole: string,
    data: { meetingPoint?: string; meetingLat?: number; meetingLng?: number },
  ): Promise<RideRoomResult<null>> {
    return getRidesCommunityModule().rideRoom.updateMeetingPoint(slug, userId, userRole, data);
  },

  getEmergencyContacts(
    slug: string,
    userId: string,
    userRole: string,
  ): Promise<RideRoomResult<EmergencyContactDTO[]>> {
    return getRidesCommunityModule().rideRoom.getEmergencyContacts(slug, userId, userRole);
  },

  updateEmergencyContacts(
    slug: string,
    userId: string,
    userRole: string,
    contacts: EmergencyContactDTO[],
  ): Promise<RideRoomResult<null>> {
    return getRidesCommunityModule().rideRoom.updateEmergencyContacts(slug, userId, userRole, contacts);
  },

  getMedia(
    slug: string,
    userId: string,
    userRole: string,
    type?: "IMAGE" | "DOCUMENT",
  ): Promise<RideRoomResult<MediaItemDTO[]>> {
    return getRidesCommunityModule().rideRoom.getMedia(slug, userId, userRole, type);
  },
};
