-- ADR-090: versioned legal terms + immutable user consent records. Additive only — no existing
-- table or row is touched. Documents are edited only as new versions (DRAFT -> PUBLISHED ->
-- ARCHIVED); acceptance rows snapshot the exact version accepted and are never rewritten.

-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('TERMS_AND_CONDITIONS', 'PRIVACY_POLICY', 'USER_AGREEMENT');

-- CreateEnum
CREATE TYPE "LegalVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LegalAcceptanceSource" AS ENUM ('SIGNUP', 'RECONSENT');

-- CreateTable
CREATE TABLE "legal_document" (
    "id" TEXT NOT NULL,
    "type" "LegalDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_document_version" (
    "id" TEXT NOT NULL,
    "legalDocumentId" TEXT NOT NULL,
    "documentType" "LegalDocumentType" NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "status" "LegalVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "publishedById" TEXT,

    CONSTRAINT "legal_document_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_acceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legalDocumentVersionId" TEXT NOT NULL,
    "documentType" "LegalDocumentType" NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "source" "LegalAcceptanceSource" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_acceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legal_document_type_key" ON "legal_document"("type");

-- CreateIndex
CREATE UNIQUE INDEX "legal_document_currentVersionId_key" ON "legal_document"("currentVersionId");

-- CreateIndex
CREATE INDEX "legal_document_version_documentType_status_idx" ON "legal_document_version"("documentType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "legal_document_version_legalDocumentId_versionNumber_key" ON "legal_document_version"("legalDocumentId", "versionNumber");

-- CreateIndex
CREATE INDEX "legal_acceptance_legalDocumentVersionId_idx" ON "legal_acceptance"("legalDocumentVersionId");

-- CreateIndex
CREATE INDEX "legal_acceptance_documentType_versionNumber_idx" ON "legal_acceptance"("documentType", "versionNumber");

-- CreateIndex
CREATE INDEX "legal_acceptance_acceptedAt_idx" ON "legal_acceptance"("acceptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "legal_acceptance_userId_legalDocumentVersionId_key" ON "legal_acceptance"("userId", "legalDocumentVersionId");

-- AddForeignKey
ALTER TABLE "legal_document" ADD CONSTRAINT "legal_document_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "legal_document_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_document_version" ADD CONSTRAINT "legal_document_version_legalDocumentId_fkey" FOREIGN KEY ("legalDocumentId") REFERENCES "legal_document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_document_version" ADD CONSTRAINT "legal_document_version_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_document_version" ADD CONSTRAINT "legal_document_version_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_acceptance" ADD CONSTRAINT "legal_acceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_acceptance" ADD CONSTRAINT "legal_acceptance_legalDocumentVersionId_fkey" FOREIGN KEY ("legalDocumentVersionId") REFERENCES "legal_document_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------------------------
-- ADR-090 invariants Prisma's schema language can't express.
-- ---------------------------------------------------------------------------------------------

-- At most ONE published and ONE draft version per document. Two admins publishing at the same
-- moment can never both succeed: the second transaction's PUBLISHED write violates this index
-- (the publish transaction also takes a row lock on the parent `legal_document` first).
CREATE UNIQUE INDEX "legal_document_version_one_published_per_document"
    ON "legal_document_version"("legalDocumentId") WHERE "status" = 'PUBLISHED';
CREATE UNIQUE INDEX "legal_document_version_one_draft_per_document"
    ON "legal_document_version"("legalDocumentId") WHERE "status" = 'DRAFT';

-- A version stops being editable the moment it leaves DRAFT. After that the only permitted change
-- is the lifecycle step PUBLISHED -> ARCHIVED (plus bookkeeping columns: archivedAt, updatedAt,
-- and the SET NULL of createdById/publishedById if that admin user is ever removed).
CREATE FUNCTION "legal_document_version_guard_update"() RETURNS trigger AS $$
BEGIN
    IF OLD."status" <> 'DRAFT' THEN
        IF NEW."content" IS DISTINCT FROM OLD."content"
            OR NEW."versionNumber" IS DISTINCT FROM OLD."versionNumber"
            OR NEW."legalDocumentId" IS DISTINCT FROM OLD."legalDocumentId"
            OR NEW."documentType" IS DISTINCT FROM OLD."documentType"
            OR NEW."publishedAt" IS DISTINCT FROM OLD."publishedAt"
            OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt"
            OR NOT (NEW."status" = OLD."status" OR (OLD."status" = 'PUBLISHED' AND NEW."status" = 'ARCHIVED'))
        THEN
            RAISE EXCEPTION 'legal_document_version % is % and immutable', OLD."id", OLD."status";
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "legal_document_version_guard_update"
    BEFORE UPDATE ON "legal_document_version"
    FOR EACH ROW EXECUTE FUNCTION "legal_document_version_guard_update"();

-- Only an unpublished draft may be discarded; published/archived versions are kept forever.
CREATE FUNCTION "legal_document_version_guard_delete"() RETURNS trigger AS $$
BEGIN
    IF OLD."status" <> 'DRAFT' THEN
        RAISE EXCEPTION 'legal_document_version % is % and cannot be deleted', OLD."id", OLD."status";
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "legal_document_version_guard_delete"
    BEFORE DELETE ON "legal_document_version"
    FOR EACH ROW EXECUTE FUNCTION "legal_document_version_guard_delete"();

-- Acceptance records are append-only audit history.
CREATE FUNCTION "legal_acceptance_immutable"() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'legal_acceptance rows are immutable (% on %)', TG_OP, OLD."id";
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "legal_acceptance_immutable"
    BEFORE UPDATE OR DELETE ON "legal_acceptance"
    FOR EACH ROW EXECUTE FUNCTION "legal_acceptance_immutable"();

-- ---------------------------------------------------------------------------------------------
-- Seed: v1 of each document, PUBLISHED, so signup has something to accept from the first deploy.
-- Terms & Privacy carry the wording already live on /terms-and-conditions and /privacy-policy;
-- the User Agreement v1 is new wording and should be reviewed by counsel — revise it by
-- publishing v2 from Admin → Legal, never by editing this row.
-- ---------------------------------------------------------------------------------------------

INSERT INTO "legal_document" ("id", "type", "title", "createdAt", "updatedAt") VALUES
    ('legal_doc_terms', 'TERMS_AND_CONDITIONS', 'Terms & Conditions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('legal_doc_privacy', 'PRIVACY_POLICY', 'Privacy Policy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('legal_doc_user_agreement', 'USER_AGREEMENT', 'User Agreement', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "legal_document_version"
    ("id", "legalDocumentId", "documentType", "versionNumber", "content", "status", "createdAt", "updatedAt", "publishedAt")
VALUES
    ('legal_ver_terms_v1', 'legal_doc_terms', 'TERMS_AND_CONDITIONS', 1,
$terms$## 1. Eligibility
You must be at least 18 years old and hold a valid driving license to book a motorcycle on BIKIE.

## 2. Bookings
A booking is confirmed once payment is processed. Pickup requires a valid license and government ID matching the account holder.

## 3. Cancellations
Free cancellation up to 48 hours before pickup. See individual bike listings for exact cancellation terms.

## 4. Liability
Renters are responsible for damage beyond normal wear, traffic violations incurred during the rental period, and any loss of accessories provided.

## 5. Partner Obligations
Partners must maintain listed vehicles in roadworthy condition and honor confirmed bookings at the agreed price.

# Community & Group Rides

## 6. Organizer Responsibilities
By creating and organizing a group ride, you agree that you are solely responsible for managing the itinerary, ensuring safety protocols, and communicating effectively with participants. BIKIE acts strictly as a platform to facilitate community connections and does not organize or sponsor these rides.

## 7. Rider Conduct
All participants in community rides must adhere to local traffic laws, wear appropriate safety gear (including helmets), and ride responsibly. Organizers reserve the right to remove any rider from a trip for unsafe behavior.

## 8. Financial Contributions
Any estimated costs or prices listed for community rides are handled directly between the organizer and the participants. BIKIE does not currently process payments for community group rides, and any financial disputes must be resolved among the involved parties.$terms$,
     'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('legal_ver_privacy_v1', 'legal_doc_privacy', 'PRIVACY_POLICY', 1,
$privacy$## 1. Information We Collect
We collect information you provide directly — name, email, and password at signup; booking details when you rent a bike; and payment information when processing a transaction (handled by our payment partner, never stored on our servers).

## 2. How We Use Information
To operate bookings, communicate with you about your trips, improve our platform, and — with consent — send offers and updates.

## 3. Sharing
We share booking details with the relevant rental partner to fulfill your reservation. We do not sell personal data to third parties.

## 4. Your Rights
You may request a copy of your data or account deletion at any time by contacting privacy@bikie.app.

## 5. Cookies
See our Cookie Policy (bikie.app/cookie-policy) for details on how we use cookies.$privacy$,
     'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('legal_ver_user_agreement_v1', 'legal_doc_user_agreement', 'USER_AGREEMENT', 1,
$agreement$## 1. Your Account
You register with your mobile number as either a Rider or a Service Provider. You are responsible for keeping access to your account secure and for the accuracy of the information you provide.

## 2. SOS and Emergency Assistance
BIKIE's SOS feature alerts nearby riders, service providers and your saved emergency contacts. It is a community assistance tool, not an emergency service. In any life-threatening situation, contact local emergency services (112) directly. BIKIE does not guarantee that anyone will respond to an alert, or how quickly.

## 3. Location Sharing
When you send an SOS, or turn on location sharing, your location is shared with the people BIKIE notifies so they can reach you.

## 4. Service Providers
Service Providers are independent businesses, not BIKIE employees. Verification status shows what BIKIE has checked; it is not a guarantee of any provider's work.

## 5. Acceptable Use
Do not send false SOS alerts, harass other users, or misuse the platform. BIKIE may suspend or remove accounts that do.

## 6. Changes to These Terms
When BIKIE updates these terms, you may be asked to review and accept the new version to keep using the app.$agreement$,
     'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE "legal_document" SET "currentVersionId" = 'legal_ver_terms_v1' WHERE "id" = 'legal_doc_terms';
UPDATE "legal_document" SET "currentVersionId" = 'legal_ver_privacy_v1' WHERE "id" = 'legal_doc_privacy';
UPDATE "legal_document" SET "currentVersionId" = 'legal_ver_user_agreement_v1' WHERE "id" = 'legal_doc_user_agreement';
