import { z } from "zod";

export const createBookingSchema = z.object({
  bikeId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  pickupCity: z.string().min(1),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
