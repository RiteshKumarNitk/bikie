export function statusForRideRoomError(reason: string): number {
  if (reason === "TRIP_NOT_FOUND" || reason === "NOT_STARTED" || reason === "NOT_FOUND") return 404;
  if (reason === "FORBIDDEN") return 403;
  return 400;
}
