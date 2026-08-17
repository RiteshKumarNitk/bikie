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
  // ADR-053 — registration is the ONE free choice point for accountType; every later change
  // needs an admin-approved Account Type Change Request. Optional (not defaulted): the service
  // needs to know whether the caller explicitly asked for a type so it can surface a clear
  // error when the write can't apply (established account) instead of silently staying RIDER.
  // `role` kept accepted-and-ignored for older/in-flight clients that may still send it
  // (pre-ADR-053).
  accountType: z.enum(["RIDER", "SERVICE_PROVIDER"]).optional(),
  role: z.enum(["RENTER", "PARTNER"]).optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CompletePhoneSignupInput = z.infer<typeof completePhoneSignupSchema>;

export const updateUserPhoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((value) => value === "" || /^[\d+\s()-]+$/.test(value), {
      message: "Enter a valid phone number",
    }),
});

export type UpdateUserPhoneInput = z.infer<typeof updateUserPhoneSchema>;
