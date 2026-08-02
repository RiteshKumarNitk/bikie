import { prisma } from "../client";

// `location` (Unsupported("geography(Point, 4326)")) is invisible to the normal Prisma Client
// API — every read/write against it goes through $queryRaw/$executeRaw here. Plain columns
// (sharingEnabled) still go through the normal Client. See ADR-016 in .docs/DECISIONS.md.

export async function setSharingEnabled(userId: string, enabled: boolean) {
  await prisma.riderLocation.upsert({
    where: { userId },
    create: { userId, sharingEnabled: enabled },
    update: { sharingEnabled: enabled },
  });
}

export async function getSharingEnabled(userId: string): Promise<boolean> {
  const row = await prisma.riderLocation.findUnique({
    where: { userId },
    select: { sharingEnabled: true },
  });
  return row?.sharingEnabled ?? false;
}

/**
 * Updates the GPS fix. Requires sharing to already be enabled — returns the affected row
 * count so the caller can reject if consent isn't on, rather than trusting the client to only
 * call this while opted in. NOTE: ST_MakePoint takes longitude first, then latitude.
 */
export async function updateLocationIfSharing(userId: string, lat: number, lng: number): Promise<number> {
  const result = await prisma.$executeRaw`
    UPDATE "rider_location"
    SET "location" = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        "updatedAt" = now()
    WHERE "userId" = ${userId} AND "sharingEnabled" = true
  `;
  return result;
}

export interface NearbyRiderRow {
  id: string;
  name: string;
  distanceMeters: number;
}

export interface NearbyRiderContactRow extends NearbyRiderRow {
  phone: string | null;
  email: string;
}

/**
 * Nearby riders around the CALLER's own last known fix (a self-join, not an externally passed
 * lat/lng) — this makes "you must have a fix on file to search" a natural side effect of the
 * query rather than a separate check: if `self.location` is null, `ST_DWithin`/`ST_Distance`
 * against it evaluate to null and every row is filtered out. Only riders with sharing on, a
 * fix on record, and a fix newer than `staleMinutes` are returned — an opted-in-but-abandoned
 * row must never render as "nearby" indefinitely.
 */
export async function findNearby(
  userId: string,
  radiusMeters: number,
  staleMinutes = 15,
): Promise<NearbyRiderRow[]> {
  return prisma.$queryRaw<NearbyRiderRow[]>`
    SELECT u."id" AS "id", u."name" AS "name",
           ST_Distance(rl."location", self."location") AS "distanceMeters"
    FROM "rider_location" rl
    JOIN "user" u ON u."id" = rl."userId"
    JOIN "rider_location" self ON self."userId" = ${userId}
    WHERE rl."sharingEnabled" = true
      AND rl."location" IS NOT NULL
      AND rl."userId" != ${userId}
      AND rl."updatedAt" > now() - (${staleMinutes} || ' minutes')::interval
      AND ST_DWithin(rl."location", self."location", ${radiusMeters})
    ORDER BY "distanceMeters" ASC
    LIMIT 50
  `;
}

/**
 * Nearby riders around an arbitrary GPS fix (used by SOS dispatch). Unlike `findNearby`, this
 * does NOT require the reporter to have opted into live sharing — SOS alerts carry their own
 * lat/lng from the panic button's one-shot geolocation.
 */
export async function findNearbyAroundPoint(
  latitude: number,
  longitude: number,
  excludeUserId: string,
  radiusMeters: number,
  staleMinutes = 30,
): Promise<NearbyRiderContactRow[]> {
  return prisma.$queryRaw<NearbyRiderContactRow[]>`
    SELECT u."id" AS "id", u."name" AS "name", u."phone" AS "phone", u."email" AS "email",
           ST_Distance(
             rl."location",
             ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
           ) AS "distanceMeters"
    FROM "rider_location" rl
    JOIN "user" u ON u."id" = rl."userId"
    WHERE rl."sharingEnabled" = true
      AND rl."location" IS NOT NULL
      AND rl."userId" != ${excludeUserId}
      AND rl."updatedAt" > now() - (${staleMinutes} || ' minutes')::interval
      AND ST_DWithin(
        rl."location",
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ${radiusMeters}
      )
    ORDER BY "distanceMeters" ASC
    LIMIT 50
  `;
}

/** Cron-only: flips sharing off for anyone whose fix has gone stale, so opting in doesn't
 * silently persist consent forever after the client stops reporting. */
export async function autoDisableStaleSharing(minutes: number): Promise<number> {
  return prisma.$executeRaw`
    UPDATE "rider_location"
    SET "sharingEnabled" = false
    WHERE "sharingEnabled" = true
      AND "updatedAt" < now() - (${minutes} || ' minutes')::interval
  `;
}
