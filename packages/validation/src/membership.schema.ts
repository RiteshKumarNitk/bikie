import { z } from "zod";

/** `POST /api/membership/checkout` — creates a Razorpay order for a plan (ADR-043). */
export const checkoutMembershipSchema = z.object({
  planId: z.string().min(1),
});

export type CheckoutMembershipInput = z.infer<typeof checkoutMembershipSchema>;

/**
 * `POST /api/membership/purchase` accepts either shape (ADR-043):
 *  - `paymentId` alone — the pre-Razorpay simulated-checkout path, only honored by the route
 *    while `RazorpayService.isConfigured()` is false (no live keys set).
 *  - `razorpayOrderId`/`razorpayPaymentId`/`razorpaySignature` together — the real path, the
 *    route verifies the signature server-side before ever creating a membership.
 * The schema only enforces "one full shape or the other, not a partial mix"; which shape is
 * actually *acceptable* is a runtime decision the route makes based on whether Razorpay is
 * configured — not something client input should be able to opt out of once real money is live.
 */
export const purchaseMembershipSchema = z
  .object({
    planId: z.string().min(1),
    paymentId: z.string().min(1).optional(),
    razorpayOrderId: z.string().min(1).optional(),
    razorpayPaymentId: z.string().min(1).optional(),
    razorpaySignature: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    const hasRazorpayFields = data.razorpayOrderId || data.razorpayPaymentId || data.razorpaySignature;
    if (hasRazorpayFields) {
      if (!data.razorpayOrderId || !data.razorpayPaymentId || !data.razorpaySignature) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["razorpaySignature"],
          message: "razorpayOrderId, razorpayPaymentId, and razorpaySignature must all be provided together",
        });
      }
      return;
    }
    if (!data.paymentId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paymentId"], message: "paymentId is required" });
    }
  });

export type PurchaseMembershipInput = z.infer<typeof purchaseMembershipSchema>;

export const createMembershipPlanSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  price: z.coerce.number().min(0),
  durationDays: z.coerce.number().int().min(1),
  benefits: z.array(z.string().min(1).max(300)).default([]),
  sortOrder: z.coerce.number().int().optional(),
});

export type CreateMembershipPlanInput = z.infer<typeof createMembershipPlanSchema>;

export const updateMembershipPlanSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().min(1).max(2000).optional(),
  price: z.coerce.number().min(0).optional(),
  durationDays: z.coerce.number().int().min(1).optional(),
  benefits: z.array(z.string().min(1).max(300)).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export type UpdateMembershipPlanInput = z.infer<typeof updateMembershipPlanSchema>;
