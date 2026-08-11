-- §25 of the master product spec — Rider → Service Provider service reviews.
-- Created when a rider rates a COMPLETED SOS assistance session whose helper has a Partner
-- profile. One review per SOS session (sessionId is unique). Aggregated into
-- Partner.ratingAvg/ratingCount.

CREATE TABLE "provider_review" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_review_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "provider_review_sessionId_key" ON "provider_review"("sessionId");
CREATE INDEX "provider_review_providerId_idx" ON "provider_review"("providerId");
CREATE INDEX "provider_review_riderId_idx" ON "provider_review"("riderId");

ALTER TABLE "provider_review" ADD CONSTRAINT "provider_review_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_review" ADD CONSTRAINT "provider_review_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
