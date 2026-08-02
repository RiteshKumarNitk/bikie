-- Emergency contacts were phone-only, so SOS fan-out could never reach them by email
-- (ADR-030). Nullable and additive: existing rows keep working with SMS/WhatsApp only.
ALTER TABLE "rider_emergency_contact" ADD COLUMN "email" TEXT;
