import { z } from "zod";

export const createTripSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(1).max(3000),
  imageUrl: z.string().url().optional(),
  type: z.enum(["WEEKEND", "ADVENTURE", "ROAD_TRIP", "INTERNATIONAL", "GUIDED_TOUR"]),
  difficulty: z.enum(["EASY", "MODERATE", "HARD"]).default("MODERATE"),
  price: z.coerce.number().min(0).default(0),
  seatsTotal: z.coerce.number().int().min(1).max(200),
  meetingPoint: z.string().max(200).optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  destinationId: z.string().min(1).optional(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;

export const joinRequestSchema = z.object({
  message: z.string().max(500).optional(),
});

export type JoinRequestInput = z.infer<typeof joinRequestSchema>;
