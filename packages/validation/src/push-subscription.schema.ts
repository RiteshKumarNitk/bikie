import { z } from "zod";

export const pushTokenSchema = z.object({
  token: z.string().min(1),
});

export type PushTokenInput = z.infer<typeof pushTokenSchema>;
