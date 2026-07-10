import { announcementRepository, messageRepository, tripRepository } from "@bikie/database";
import type { AnnouncementDTO, EmergencyContactDTO, MediaItemDTO, RideRoomDTO } from "@bikie/types";
import { assertRideRoomAccess, canManageRideRoom, type RideRoomRole } from "./lib/ride-room-access";
import { MessageService } from "./message.service";
import { NotificationService } from "./notification.service";
import { RealtimeService } from "./lib/realtime";

export type RideRoomResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "TRIP_NOT_FOUND" | "FORBIDDEN" | "NOT_STARTED" | "NOT_FOUND" };

function toAnnouncementDTO(row: {
  id: string;
  tripId: string;
  authorId: string;
  author: { name: string };
  content: string;
  pinnedAt: Date | null;
  createdAt: Date;
}): AnnouncementDTO {
  return {
    id: row.id,
    tripId: row.tripId,
    authorId: row.authorId,
    authorName: row.author.name,
    content: row.content,
    pinnedAt: row.pinnedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function toEmergencyContacts(raw: unknown): EmergencyContactDTO[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (c): c is EmergencyContactDTO =>
      typeof c === "object" && c !== null && "name" in c && "phone" in c && "relation" in c,
  );
}

async function requireRoomConversation(
  slug: string,
  userId: string,
  userRole: string,
): Promise<
  | { ok: true; tripId: string; conversationId: string; role: RideRoomRole }
  | { ok: false; reason: "TRIP_NOT_FOUND" | "FORBIDDEN" | "NOT_STARTED" }
> {
  const access = await assertRideRoomAccess(slug, userId, userRole);
  if (!access.ok) return access;

  const conversationId = await tripRepository.findConversationIdForTrip(access.tripId);
  if (!conversationId) return { ok: false, reason: "NOT_STARTED" };

  return { ok: true, tripId: access.tripId, conversationId, role: access.role };
}

export const RideRoomService = {
  async getRoom(slug: string, userId: string, userRole: string): Promise<RideRoomResult<RideRoomDTO>> {
    const access = await requireRoomConversation(slug, userId, userRole);
    if (!access.ok) return access;

    const [conversation, info] = await Promise.all([
      messageRepository.getConversationById(access.conversationId),
      tripRepository.getRoomInfo(access.tripId),
    ]);
    if (!conversation) return { ok: false, reason: "NOT_STARTED" };

    return {
      ok: true,
      data: {
        tripId: access.tripId,
        conversationId: access.conversationId,
        role: access.role,
        isLocked: conversation.isLocked,
        meetingPoint: info?.meetingPoint ?? null,
        meetingLat: info?.meetingLat ?? null,
        meetingLng: info?.meetingLng ?? null,
        emergencyContacts: toEmergencyContacts(info?.emergencyContacts),
      },
    };
  },

  async getAnnouncements(slug: string, userId: string, userRole: string): Promise<RideRoomResult<AnnouncementDTO[]>> {
    const access = await requireRoomConversation(slug, userId, userRole);
    if (!access.ok) return access;

    const rows = await announcementRepository.findForTrip(access.tripId);
    return { ok: true, data: rows.map(toAnnouncementDTO) };
  },

  async postAnnouncement(
    slug: string,
    userId: string,
    userRole: string,
    content: string,
  ): Promise<RideRoomResult<AnnouncementDTO>> {
    const access = await requireRoomConversation(slug, userId, userRole);
    if (!access.ok) return access;
    if (!canManageRideRoom(access.role)) return { ok: false, reason: "FORBIDDEN" };

    const row = await announcementRepository.create(access.tripId, userId, content);
    const dto = toAnnouncementDTO(row);

    const memberIds = await messageRepository.getOtherParticipantIds(access.conversationId, userId);
    await RealtimeService.publishToUsers(memberIds, "announcement", dto);
    await NotificationService.notifyMany(
      memberIds,
      "RIDE_ANNOUNCEMENT",
      "New ride announcement",
      content.slice(0, 140),
      "Trip",
      access.tripId,
    );

    return { ok: true, data: dto };
  },

  async deleteAnnouncement(
    slug: string,
    announcementId: string,
    userId: string,
    userRole: string,
  ): Promise<RideRoomResult<null>> {
    const access = await requireRoomConversation(slug, userId, userRole);
    if (!access.ok) return access;
    if (!canManageRideRoom(access.role)) return { ok: false, reason: "FORBIDDEN" };

    const existing = await announcementRepository.findById(announcementId);
    if (!existing || existing.tripId !== access.tripId) return { ok: false, reason: "NOT_FOUND" };

    await announcementRepository.remove(announcementId);
    return { ok: true, data: null };
  },

  async updateMeetingPoint(
    slug: string,
    userId: string,
    userRole: string,
    data: { meetingPoint?: string; meetingLat?: number; meetingLng?: number },
  ): Promise<RideRoomResult<null>> {
    const access = await requireRoomConversation(slug, userId, userRole);
    if (!access.ok) return access;
    if (!canManageRideRoom(access.role)) return { ok: false, reason: "FORBIDDEN" };

    await tripRepository.updateMeetingPoint(access.tripId, data);
    await MessageService.createSystemMessage(access.conversationId, "Ride location updated.");

    const memberIds = await messageRepository.getOtherParticipantIds(access.conversationId, userId);
    await RealtimeService.publishToUsers(memberIds, "ride_room_updated", { tripId: access.tripId });

    return { ok: true, data: null };
  },

  async getEmergencyContacts(
    slug: string,
    userId: string,
    userRole: string,
  ): Promise<RideRoomResult<EmergencyContactDTO[]>> {
    const access = await requireRoomConversation(slug, userId, userRole);
    if (!access.ok) return access;

    const info = await tripRepository.getRoomInfo(access.tripId);
    return { ok: true, data: toEmergencyContacts(info?.emergencyContacts) };
  },

  async updateEmergencyContacts(
    slug: string,
    userId: string,
    userRole: string,
    contacts: EmergencyContactDTO[],
  ): Promise<RideRoomResult<null>> {
    const access = await requireRoomConversation(slug, userId, userRole);
    if (!access.ok) return access;
    if (!canManageRideRoom(access.role)) return { ok: false, reason: "FORBIDDEN" };

    await tripRepository.updateEmergencyContacts(access.tripId, contacts);
    return { ok: true, data: null };
  },

  async getMedia(
    slug: string,
    userId: string,
    userRole: string,
    type?: "IMAGE" | "DOCUMENT",
  ): Promise<RideRoomResult<MediaItemDTO[]>> {
    const access = await requireRoomConversation(slug, userId, userRole);
    if (!access.ok) return access;

    const rows = await announcementRepository.findMediaForConversation(access.conversationId, type);
    return {
      ok: true,
      data: rows.map((a) => ({
        id: a.id,
        type: a.type,
        fileName: a.fileName,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
        width: a.width,
        height: a.height,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  },
};
