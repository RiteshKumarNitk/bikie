import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, phoneNumberClient } from "better-auth/client/plugins";
import type { auth } from "@bikie/auth";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:4000")),
  plugins: [inferAdditionalFields<typeof auth>(), phoneNumberClient()],
});
