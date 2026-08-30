-- ADR-070: membership billing receipts. One immutable invoice per membership activation, for
-- both account types. Every commercially meaningful value is SNAPSHOT at purchase time so a
-- later admin change to a plan's price/duration never alters a historic invoice or membership.
-- Additive only — no existing table or row is touched. `paymentId` / `razorpayPaymentId` /
-- `userMembershipId` / `partnerMembershipId` are each UNIQUE (nullable → many NULLs allowed),
-- making invoice creation idempotent under a replayed /purchase exactly like ADR-069's
-- membership guard.

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PAID', 'REFUNDED');

-- CreateTable
CREATE TABLE "membership_invoice" (
    "id" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "userMembershipId" TEXT,
    "partnerMembershipId" TEXT,
    "planId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "durationDays" INTEGER NOT NULL,
    "membershipStartDate" TIMESTAMP(3) NOT NULL,
    "membershipEndDate" TIMESTAMP(3) NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PAID',
    "paymentId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpayOrderId" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "confirmationSmsSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "membership_invoice_receiptNo_key" ON "membership_invoice"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "membership_invoice_userMembershipId_key" ON "membership_invoice"("userMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_invoice_partnerMembershipId_key" ON "membership_invoice"("partnerMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_invoice_paymentId_key" ON "membership_invoice"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_invoice_razorpayPaymentId_key" ON "membership_invoice"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "membership_invoice_userId_createdAt_idx" ON "membership_invoice"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "membership_invoice" ADD CONSTRAINT "membership_invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_invoice" ADD CONSTRAINT "membership_invoice_userMembershipId_fkey" FOREIGN KEY ("userMembershipId") REFERENCES "user_membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_invoice" ADD CONSTRAINT "membership_invoice_partnerMembershipId_fkey" FOREIGN KEY ("partnerMembershipId") REFERENCES "partner_membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
