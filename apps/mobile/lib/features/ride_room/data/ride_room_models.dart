import 'package:freezed_annotation/freezed_annotation.dart';

part 'ride_room_models.freezed.dart';
part 'ride_room_models.g.dart';

/// Mirrors `packages/types/src/ride-room.ts` `EmergencyContactDTO`.
@freezed
class EmergencyContact with _$EmergencyContact {
  const factory EmergencyContact({
    required String name,
    required String phone,
    required String relation,
  }) = _EmergencyContact;

  factory EmergencyContact.fromJson(Map<String, dynamic> json) => _$EmergencyContactFromJson(json);
}

/// Mirrors `packages/types/src/ride-room.ts` `RideRoomDTO`. Access is
/// Organizer + Approved Riders + Admin only (`assertRideRoomAccess`,
/// `packages/services/src/lib/ride-room-access.ts`) — `role` tells the
/// client whether to show manage affordances (`canManage`).
@freezed
class RideRoom with _$RideRoom {
  const RideRoom._();

  const factory RideRoom({
    required String tripId,
    required String conversationId,
    required String role,
    required bool isLocked,
    String? meetingPoint,
    double? meetingLat,
    double? meetingLng,
    @Default([]) List<EmergencyContact> emergencyContacts,
  }) = _RideRoom;

  factory RideRoom.fromJson(Map<String, dynamic> json) => _$RideRoomFromJson(json);

  /// Only the Organizer or an Admin can post announcements / edit the
  /// meeting point / edit emergency contacts (`canManageRideRoom`,
  /// `packages/services/src/lib/ride-room-access.ts`) — plain approved
  /// Members get read-only access to those same panels.
  bool get canManage => role == 'ORGANIZER' || role == 'ADMIN';
}

/// Mirrors `packages/types/src/ride-room.ts` `AnnouncementDTO`.
@freezed
class Announcement with _$Announcement {
  const factory Announcement({
    required String id,
    required String tripId,
    required String authorId,
    required String authorName,
    required String content,
    String? pinnedAt,
    required String createdAt,
  }) = _Announcement;

  factory Announcement.fromJson(Map<String, dynamic> json) => _$AnnouncementFromJson(json);
}

/// Mirrors `packages/types/src/ride-room.ts` `MediaItemDTO`.
@freezed
class MediaItem with _$MediaItem {
  const factory MediaItem({
    required String id,
    required String type,
    required String fileName,
    required String mimeType,
    required int sizeBytes,
    int? width,
    int? height,
    required String createdAt,
  }) = _MediaItem;

  factory MediaItem.fromJson(Map<String, dynamic> json) => _$MediaItemFromJson(json);
}
