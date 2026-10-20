-- Recurring Razorpay Subscriptions for PartnerMembership (Service Provider ₹99/month).
-- Hand-authored (not `prisma migrate dev`'s auto-diff) because this dev database's migration
-- history has unrelated drift against the auto-diff engine (a separately pending
-- 20260928100000_legal_terms_consent migration, plus the auto-diff falsely wanting to drop the
-- hand-written PostGIS indexes on rider_location — see ADR-016's own warning that those are
-- permanently invisible to Prisma's diff engine and must never be "cleaned up"). This file
-- contains ONLY the statements for the new subscription fields/table, verified against a
-- `prisma migrate diff` run and hand-filtered to exclude both of those unrelated items.

-- AlterTable: new nullable recurring-subscription fields on PartnerMembership. All NULL on every
-- existing one-time/free/test-account row — status/startDate/endDate (unchanged) remain the only
-- fields SOS eligibility and the active-membership screen read.
ALTER TABLE "partner_membership"
  ADD COLUMN "razorpaySubscriptionId" TEXT,
  ADD COLUMN "razorpayPlanId" TEXT,
  ADD COLUMN "subscriptionStatus" TEXT,
  ADD COLUMN "currentPeriodStart" TIMESTAMP(3),
  ADD COLUMN "currentPeriodEnd" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "lastPaymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "partner_membership_razorpaySubscriptionId_key" ON "partner_membership"("razorpaySubscriptionId");

-- DropIndex: MembershipInvoice.partnerMembershipId is no longer 1:1 — a subscription-backed
-- membership accumulates one invoice per recurring charge against the same row. Invoice
-- idempotency was never enforced by this column; it's enforced by paymentId/razorpayPaymentId's
-- own unique constraints below, which are untouched.
DROP INDEX "membership_invoice_partnerMembershipId_key";

-- CreateIndex
CREATE INDEX "membership_invoice_partnerMembershipId_idx" ON "membership_invoice"("partnerMembershipId");

-- CreateTable: idempotency ledger for POST /api/webhooks/razorpay — one row per processed
-- Razorpay webhook event id, inserted before the event is acted on (unique-violation = already
-- processed, short-circuit with no further action).
CREATE TABLE "razorpay_webhook_event" (
    "id" TEXT NOT NULL,
    "razorpayEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "razorpay_webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_webhook_event_razorpayEventId_key" ON "razorpay_webhook_event"("razorpayEventId");
