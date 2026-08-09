-- ADR-044: partner-side SOS availability toggle + explicit general-responder opt-in.
ALTER TABLE "Partner" ADD COLUMN "isAvailable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Partner" ADD COLUMN "isGeneralResponder" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "Partner_isAvailable_idx" ON "Partner"("isAvailable");
