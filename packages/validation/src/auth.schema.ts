import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const completePhoneSignupSchema = z.object({
  // Optional: name is now collected on the onboarding/partner-onboarding form
  // that follows this call, not during OTP verification itself.
  name: z.string().min(2, "Name is too short").max(100).optional(),
  role: z.enum(["RENTER", "PARTNER"]).default("RENTER"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CompletePhoneSignupInput = z.infer<typeof completePhoneSignupSchema>;
