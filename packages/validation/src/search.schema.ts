import { z } from "zod";

export const homeSearchSchema = z.object({
  location: z.string().min(1, "Where are you going?"),
  pickupDate: z.string().min(1, "Pick a pickup date"),
  returnDate: z.string().min(1, "Pick a return date"),
  bikeType: z.string().min(1, "Choose a bike type"),
  passengers: z.coerce.number().int().min(1).max(2).default(1),
});

export type HomeSearchInput = z.infer<typeof homeSearchSchema>;
