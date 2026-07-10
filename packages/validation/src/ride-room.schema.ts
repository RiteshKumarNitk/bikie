import { z } from "zod";

export const announcementSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;

export const meetingPointSchema = z.object({
  meetingPoint: z.string().trim().max(300).optional(),
  meetingLat: z.number().min(-90).max(90).optional(),
  meetingLng: z.number().min(-180).max(180).optional(),
});

export type MeetingPointInput = z.infer<typeof meetingPointSchema>;

export const emergencyContactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(1).max(30),
  relation: z.string().trim().min(1).max(60),
});

export const emergencyContactsSchema = z.object({
  contacts: z.array(emergencyContactSchema).max(10),
});

export type EmergencyContactsInput = z.infer<typeof emergencyContactsSchema>;
