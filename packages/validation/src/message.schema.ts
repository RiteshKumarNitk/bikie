import { z } from "zod";

export const attachmentInputSchema = z.object({
  type: z.enum(["IMAGE", "DOCUMENT"]),
  url: z.string().min(1),
  publicId: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000).optional(),
  replyToId: z.string().min(1).optional(),
  attachments: z.array(attachmentInputSchema).max(10).optional(),
}).refine((data) => (data.content && data.content.length > 0) || (data.attachments && data.attachments.length > 0), {
  message: "A message needs either content or at least one attachment",
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const editMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});

export type EditMessageInput = z.infer<typeof editMessageSchema>;

export const typingSchema = z.object({
  isTyping: z.boolean(),
});

export type TypingInput = z.infer<typeof typingSchema>;

export const readReceiptSchema = z.object({
  upToMessageId: z.string().min(1),
});

export type ReadReceiptInput = z.infer<typeof readReceiptSchema>;

export const reportSchema = z.object({
  targetType: z.enum(["MESSAGE", "USER", "TRIP", "CONVERSATION", "GROUP"]),
  targetId: z.string().min(1),
  reason: z.enum(["SPAM", "ABUSE", "FAKE_ACCOUNT", "DANGEROUS_BEHAVIOUR", "HARASSMENT", "SCAM", "OTHER"]),
  details: z.string().trim().max(1000).optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;

export const moderationDurationSchema = z.object({
  reason: z.string().trim().min(1).max(500),
  durationHours: z.number().int().positive().max(24 * 90).optional(),
  reportId: z.string().min(1).optional(),
});

export type ModerationDurationInput = z.infer<typeof moderationDurationSchema>;
