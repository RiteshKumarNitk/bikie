/** ADR-070 — internal helper shared by `MembershipService`/`PartnerMembershipService` when they
 * snapshot a purchase into an invoice. Not exported from the package barrel. */

/** The `paymentId` handed to `purchaseMembership` is the real Razorpay payment id in verified
 * mode and a client-generated `DUMMY-<uuid>` in the dev-fallback mode (ADR-043/069). Only the
 * former belongs in the invoice's `razorpayPaymentId` column. */
export function isRealRazorpayPaymentId(paymentId: string | null | undefined): boolean {
  return !!paymentId && !paymentId.startsWith("DUMMY-");
}
