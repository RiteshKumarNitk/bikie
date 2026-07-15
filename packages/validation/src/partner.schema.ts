import { z } from "zod";

export const partnerProfileSchema = z.object({
  businessName: z.string().min(1).max(120),
  type: z.enum([
    "RENTAL",
    "MECHANIC",
    "FUEL_DELIVERY",
    "TOUR_GUIDE",
    "HOTEL",
    "CAMPING",
    "ACCESSORIES",
    "PHOTOGRAPHY",
  ]),
  city: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  aadhaarNumber: z.string().max(20).optional(),
  contactPerson1Name: z.string().max(100).optional(),
  contactPerson1Mobile: z.string().max(20).optional(),
  contactPerson2Name: z.string().max(100).optional(),
  contactPerson2Mobile: z.string().max(20).optional(),
});

export type PartnerProfileInput = z.infer<typeof partnerProfileSchema>;
