-- Additive indexes for Phase 5 query shapes (ADR-024).
-- Safe to apply on a live DB: CREATE INDEX CONCURRENTLY is not used because Prisma
-- migrations run inside a transaction; these are btree indexes on existing FK/filter columns.

-- Booking overlap check: WHERE bikeId = ? AND status <> CANCELLED AND startDate < ? AND endDate > ?
CREATE INDEX IF NOT EXISTS "Booking_bikeId_startDate_endDate_idx"
  ON "Booking"("bikeId", "startDate", "endDate");

-- SOS / partner city lookup: WHERE city ILIKE ?
CREATE INDEX IF NOT EXISTS "Partner_city_idx"
  ON "Partner"("city");

-- Partner fleet + bike city search filters
CREATE INDEX IF NOT EXISTS "Bike_city_idx"
  ON "Bike"("city");

CREATE INDEX IF NOT EXISTS "Bike_ownerId_idx"
  ON "Bike"("ownerId");

-- "My rides" / pending requests by user
CREATE INDEX IF NOT EXISTS "TripParticipant_userId_idx"
  ON "TripParticipant"("userId");
