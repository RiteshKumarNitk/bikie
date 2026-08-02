/**
 * Compatibility re-export — Ride Room access policy lives in rides-community domain.
 * Prefer importing from the module public API for new code.
 */
export {
  assertRideRoomAccess,
  canManageRideRoom,
  type RideRoomAccess,
  type RideRoomRole,
} from "../modules/rides-community/lib/ride-room-access-compat";
