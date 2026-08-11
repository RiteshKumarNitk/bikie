import { z } from "zod";

/** ADR-051 — mirrors `membership.schema.ts` for a Service Provider's own, separate membership. */

/** `POST /api/partner-membership/checkout` — creates a Razorpay order for a plan, or signals
 * the free-tier shortcut when the plan's server-side price is 0. */
export const checkoutPartnerMembershipSchema = z.object({
  planId: z.string().min(1),
});

export type CheckoutPartnerMembershipInput = z.infer<typeof checkoutPartnerMembershipSchema>;

/**
 * `POST /api/partner-membership/purchase` accepts either shape, same rule as the Rider route:
 *  - `paymentId` alone — simulated-checkout / free-plan path.
 *  - `razorpayOrderId`/`razorpayPaymentId`/`razorpaySignature` together — the real, signature-
 *    verified path.
 * Which shape is actually required is a runtime decision the route makes (configured Razorpay +
 * a non-zero plan price), not something client input can opt out of.
 */
export const purchasePartnerMembershipSchema = z
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
    }
    // paymentId is optional at the schema layer — the free-plan path needs neither paymentId nor
    // Razorpay fields, and the route itself enforces payment presence for non-free plans.
  });

export type PurchasePartnerMembershipInput = z.infer<typeof purchasePartnerMembershipSchema>;

export const createPartnerMembershipPlanSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  price: z.coerce.number().min(0),
  durationDays: z.coerce.number().int().min(1).default(365),
  benefits: z.array(z.string().min(1).max(300)).default([]),
  sortOrder: z.coerce.number().int().optional(),
});

export type CreatePartnerMembershipPlanInput = z.infer<typeof createPartnerMembershipPlanSchema>;

export const updatePartnerMembershipPlanSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().min(1).max(2000).optional(),
  price: z.coerce.number().min(0).optional(),
  durationDays: z.coerce.number().int().min(1).optional(),
  benefits: z.array(z.string().min(1).max(300)).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export type UpdatePartnerMembershipPlanInput = z.infer<typeof updatePartnerMembershipPlanSchema>;
