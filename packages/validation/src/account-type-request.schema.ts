import { z } from "zod";

/** ADR-053 — "I picked the wrong account type" support ticket. `POST /api/account-type-requests`. */
export const submitAccountTypeRequestSchema = z.object({
  requestedType: z.enum(["RIDER", "SERVICE_PROVIDER"]),
  reason: z.string().min(1).max(1000),
  supportingInfo: z.string().max(2000).optional(),
});

export type SubmitAccountTypeRequestInput = z.infer<typeof submitAccountTypeRequestSchema>;

/** `PATCH /api/admin/account-type-requests/[id]` — admin decision. `adminRemarks` required for
 * everything except a clean APPROVE, same rule `partnerVerificationActionSchema` uses. */
export const reviewAccountTypeRequestSchema = z
  .object({
    decision: z.enum(["APPROVED", "REJECTED", "MORE_INFORMATION_REQUIRED"]),
    adminRemarks: z.string().min(1).max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision !== "APPROVED" && !data.adminRemarks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adminRemarks"],
        message: "Remarks are required for this decision",
      });
    }
  });

export type ReviewAccountTypeRequestInput = z.infer<typeof reviewAccountTypeRequestSchema>;
