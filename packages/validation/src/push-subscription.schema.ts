import { z } from "zod";

// `platform`/device fields are optional so the existing web caller (which only ever sends
// `{ token }`) keeps working unchanged — this is the same PUT/DELETE route both platforms
// share, not a new endpoint (ADR-035).
export const pushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["WEB", "ANDROID", "IOS"]).optional(),
  deviceId: z.string().min(1).optional(),
  deviceName: z.string().min(1).max(200).optional(),
  appVersion: z.string().min(1).max(50).optional(),
});

export type PushTokenInput = z.infer<typeof pushTokenSchema>;
