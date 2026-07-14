import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Redis } from "@upstash/redis";
import { prisma } from "@bikie/database";

// Rate limiting needs shared state across serverless function instances (Vercel), so
// Better Auth's default "memory" storage (per-instance, in-process) can't actually enforce
// a limit in production — every cold invocation gets its own empty counter. Reusing the
// same Upstash Redis REST client credentials as RealtimeService (packages/services/src/lib/realtime.ts)
// gives Better Auth's built-in rate limiter (see getDefaultSpecialRules: sign-in/sign-up
// already capped at 3 requests / 10s by the library itself) a durable, cross-instance store
// via the `secondaryStorage` hook instead of hand-rolling auth throttling.
let redisClient: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return redisClient;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
}

const redis = getRedis();

// Implements Better Auth's `SecondaryStorage` interface. Left `undefined` (Better Auth then
// falls back to its in-memory store) when Upstash isn't configured, e.g. local dev — same
// dev-safe posture as RealtimeService.
const secondaryStorage = redis
  ? {
      get: async (key: string) => redis!.get<string>(key),
      set: async (key: string, value: string, ttl?: number) => {
        if (ttl) await redis!.set(key, value, { ex: ttl });
        else await redis!.set(key, value);
      },
      delete: async (key: string) => {
        await redis!.del(key);
      },
      increment: async (key: string, ttl: number) => {
        const count = await redis!.incr(key);
        if (count === 1) await redis!.expire(key, ttl);
        return count;
      },
    }
  : undefined;

// Preview/production URLs the app is actually deployed under. `VERCEL_URL` /
// `VERCEL_PROJECT_PRODUCTION_URL` are populated automatically by Vercel; anything beyond
// that (e.g. a stable preview alias) goes in `ADDITIONAL_TRUSTED_ORIGINS` (comma-separated,
// see .env.example) rather than being hardcoded here.
const additionalTrustedOrigins = (process.env.ADDITIONAL_TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

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
    ...additionalTrustedOrigins,
  ],
  // Rate limiting: enabled everywhere (not just production, which is Better Auth's own
  // default via `isProduction`) since this also needs to cover Vercel preview deployments.
  // Sign-in/sign-up/change-password/change-email are already capped at 3 requests per 10s
  // by Better Auth's built-in special rules (see getDefaultSpecialRules in
  // better-auth/dist/api/rate-limiter); `secondaryStorage` above makes that limit durable
  // across serverless instances instead of silently resetting on every cold start.
  rateLimit: {
    enabled: true,
    storage: secondaryStorage ? "secondary-storage" : "memory",
  },
  secondaryStorage,
  advanced: {
    // Secure cookies in production HTTPS; local dev stays on plain http://localhost:4000
    // (ADR-003) where `Secure` would silently drop the cookie.
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
});
