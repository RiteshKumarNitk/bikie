-- Business-level contact fields (distinct from the ADR-014 contact-person mobiles) so the
-- public-facing "find a service provider" flow has a number/email that reaches the business
-- itself, not a specific staff member.

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN "businessMobile" TEXT,
ADD COLUMN "businessEmail" TEXT;
