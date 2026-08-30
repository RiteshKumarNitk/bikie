-- ADR-069: payment idempotency. A given payment reference (Razorpay order id, Razorpay
-- payment id stored as `paymentId`, or a dev-mode `DUMMY-<uuid>`) must map to at most one
-- membership row, so a replayed `POST /api/*/purchase` callback can't mint duplicate
-- memberships. Nullable columns: a Postgres UNIQUE index permits multiple NULLs, so free-tier
-- purchases and the grandfathered `legacy-free-partner-plan` rows (both carry NULL here) are
-- unaffected. All existing seed/backfill rows insert NULL for these columns, so index
-- creation does not conflict with current data.

-- CreateIndex
CREATE UNIQUE INDEX "user_membership_paymentId_key" ON "user_membership"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "user_membership_razorpayOrderId_key" ON "user_membership"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_membership_paymentId_key" ON "partner_membership"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_membership_razorpayOrderId_key" ON "partner_membership"("razorpayOrderId");
