-- ADR-059 — surfaced (unredacted) on SOS alert dispatch to nearby riders/service providers,
-- alongside the existing vehicleType/vehicleBrand/vehicleModel fields, via the DLT-approved
-- "BIKIE_SR" SMS template. Additive and nullable; no backfill needed — most riders leave the
-- existing vehicle fields empty too (see ADR-044's note on the same pattern).
ALTER TABLE "rider_profile" ADD COLUMN "vehicleRegistrationNumber" TEXT;
