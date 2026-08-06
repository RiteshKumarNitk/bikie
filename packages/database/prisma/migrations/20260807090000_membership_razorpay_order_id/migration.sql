-- ADR-043: Razorpay order id, kept alongside the existing paymentId for support/reconciliation.
ALTER TABLE "user_membership" ADD COLUMN "razorpayOrderId" TEXT;
