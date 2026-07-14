import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@bikie/database";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: true,
        defaultValue: "RENTER",
      },
      accountStatus: {
        type: "string",
        input: false,
        defaultValue: "ACTIVE",
      },
      accountStatusExpiresAt: {
        type: "date",
        input: false,
        required: false,
      },
    },
  },
  // Cookie sessions remain the primary mechanism for the web app; bearer()
  // additionally lets non-browser clients (the Flutter app) authenticate via
  // `Authorization: Bearer <token>` using the same session/getSession machinery.
  plugins: [bearer()],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.VERCEL_PROJECT_PRODUCTION_URL 
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.BETTER_AUTH_URL || "http://localhost:4000",
  trustedOrigins: [
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
    "https://bikie-web-rs8i.vercel.app" // explicitly trust the current preview URL to be safe
  ],
});
