-- Reverse-geocoded SOS location (ADR-038). Additive, nullable — a lookup failure/timeout at
-- alert-creation time just leaves these null; existing rows and every reader already fall back
-- to city/raw coordinates.
ALTER TABLE "sos_alert"
  ADD COLUMN "placeName" TEXT,
  ADD COLUMN "area" TEXT,
  ADD COLUMN "formattedAddress" TEXT;
