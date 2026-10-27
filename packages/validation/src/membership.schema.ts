import { z } from "zod";

/** `POST /api/membership/checkout` — creates a Razorpay order for a plan (ADR-043). */
export const checkoutMembershipSchema = z.object({
  planId: z.string().min(1),
});

export type CheckoutMembershipInput = z.infer<typeof checkoutMembershipSchema>;

/**
 * `POST /api/membership/purchase` (narrowed by the yearly-auto-debit-only change, mirroring
 * `purchasePartnerMembershipSchema`): `planId` alone is valid — the route's own free-plan and
 * Rider-test-account branches need neither `paymentId` nor Razorpay fields, and every other
 * paid-plan request is rejected by the route regardless of what's supplied here. When Razorpay
 * fields ARE supplied (the test account may send one), all three must be present together.
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
    if (hasRazorpayFields && (!data.razorpayOrderId || !data.razorpayPaymentId || !data.razorpaySignature)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["razorpaySignature"],
        message: "razorpayOrderId, razorpayPaymentId, and razorpaySignature must all be provided together",
      });
    }
  });

export type PurchaseMembershipInput = z.infer<typeof purchaseMembershipSchema>;

/** `POST /api/membership/subscription` — starts a recurring Razorpay Subscription for the given
 * BIKIE plan (the Razorpay Plan id itself comes from `RAZORPAY_RIDER_MEMBERSHIP_PLAN_ID`
 * server-side, never the client). Mirrors `startPartnerSubscriptionSchema`. */
export const startMembershipSubscriptionSchema = z.object({
  planId: z.string().min(1),
});

export type StartMembershipSubscriptionInput = z.infer<typeof startMembershipSubscriptionSchema>;

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
