ALTER TABLE "rider_location" ADD COLUMN "receiveSosAlerts" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "rider_location_receiveSosAlerts_idx" ON "rider_location" ("receiveSosAlerts");
