import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  imageUrl: z.string().url(),
  type: z.enum(["COMMUNITY", "CLUB"]),
  city: z.string().max(100).optional(),
  isPrivate: z.boolean().optional(),
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(2000).optional(),
  imageUrl: z.string().url().optional(),
  city: z.string().max(100).nullable().optional(),
  isPrivate: z.boolean().optional(),
});
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

export const joinGroupSchema = z.object({
  message: z.string().max(500).optional(),
});
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;

export const decideMembershipSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
});
export type DecideMembershipInput = z.infer<typeof decideMembershipSchema>;
