-- ADR-037: organizer-typed free-text destination name, decoupled from the curated
-- `Destination` catalog (`destinationId` stays for the now-optional curated link).
ALTER TABLE "Trip" ADD COLUMN "destinationName" TEXT;
