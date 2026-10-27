-- Recurring Razorpay Subscriptions for UserMembership (Rider ₹149/year), mirroring the
-- 20261018120000_partner_membership_subscription migration's shape exactly for UserMembership.
-- Hand-authored (not `prisma migrate dev`'s auto-diff) for the same reason as that migration:
-- this database's migration history has unrelated drift against the auto-diff engine (hand-
-- written PostGIS indexes on rider_location that are permanently invisible to Prisma's diff
-- engine and must never be "cleaned up" — see ADR-016). This file contains ONLY the statements
-- for the new Rider subscription fields/index changes, hand-filtered to exclude that drift.

-- AlterTable: new nullable recurring-subscription fields on UserMembership. All NULL on every
-- existing one-time/free/legacy row — status/startDate/endDate (unchanged) remain the only
-- fields membership-eligibility checks read.
ALTER TABLE "user_membership"
  ADD COLUMN "razorpaySubscriptionId" TEXT,
  ADD COLUMN "razorpayPlanId" TEXT,
  ADD COLUMN "subscriptionStatus" TEXT,
  ADD COLUMN "currentPeriodStart" TIMESTAMP(3),
  ADD COLUMN "currentPeriodEnd" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "lastPaymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_membership_razorpaySubscriptionId_key" ON "user_membership"("razorpaySubscriptionId");

-- DropIndex: MembershipInvoice.userMembershipId is no longer 1:1 — a subscription-backed Rider
-- membership accumulates one invoice per recurring (yearly) charge against the same row, exactly
-- like PartnerMembershipId's equivalent change in the prior migration. Invoice idempotency was
-- never enforced by this column; it's enforced by paymentId/razorpayPaymentId's own unique
-- constraints, which are untouched.
DROP INDEX "membership_invoice_userMembershipId_key";

-- CreateIndex
CREATE INDEX "membership_invoice_userMembershipId_idx" ON "membership_invoice"("userMembershipId");
