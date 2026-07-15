import type { z } from "zod";

/** Turns a Zod `safeParse` failure into a flat list of human-readable messages — used by
 * forms that validate client-side before submitting, importing the exact same schema the
 * API route validates with server-side (so the two can never drift apart). */
export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}
