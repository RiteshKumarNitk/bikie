import { z } from "zod";

export const purchaseMembershipSchema = z.object({
  planId: z.string().min(1),
  paymentId: z.string().min(1),
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
