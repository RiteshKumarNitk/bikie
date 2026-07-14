import { z } from "zod";

export const createConversationSchema = z.object({
  otherUserId: z.string().min(1),
  subject: z.string().max(200).optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
