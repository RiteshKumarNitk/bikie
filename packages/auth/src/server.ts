import { betterAuth } from "better-auth";
import { bearer, phoneNumber } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Redis } from "@upstash/redis";
import { prisma, userRepository } from "@bikie/database";
import { getIdentityAccessModule, isValidIndianMobile } from "@bikie/services";

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

/** Turns a raw phone number into a syntactically-valid, RFC-safe local-part for a
 * placeholder email — real uniqueness is guaranteed by the phone number itself being
 * `@unique` on `User.phoneNumber`, this is just a value `emailAndPassword`'s schema needs
 * populated at signup time. Never shown to the user, never used to actually contact them. */
function tempEmailForPhone(phoneNumber: string) {
  return `phone-${phoneNumber.replace(/[^a-zA-Z0-9]/g, "")}@bikie.local`;
}

/** Shared by the plugin's own expiry and the OTP SMS copy so the two can't disagree. */
const OTP_EXPIRES_IN_SECONDS = 300;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        // Never accept role from client signup/update. RENTER is the creation-time default for
        // every account, including a Service Provider signup — Better Auth creates the row
        // before the app knows which account type was picked. ADR-055: the very next call,
        // `PATCH /api/user/complete-phone-signup`, promotes it to PARTNER through
        // `userRepository.setAccountType`, which is the one place `role` and `accountType` are
        // kept in step. ADMIN is only ever set by AdminService.
        input: false,
        defaultValue: "RENTER",
      },
      // ADR-046b — denormalized copy of Partner.verificationStatus, kept in sync on every
      // verification-state write (application submit/withdraw, admin approve/reject/etc.).
      // Exposes session.user.partnerStatus for cheap capability checks (middleware, route
      // guards) without a join, same mechanism as role/accountStatus above. `null` means no
      // Partner application has ever been started ("NOT_APPLIED"). ADR-053: means ONLY
      // verification/trust status now — see accountType below for the routing/capability signal.
      partnerStatus: {
        type: "string",
        input: false,
        required: false,
      },
      // ADR-053 — server-authoritative, mutually-exclusive Rider/Service-Provider selector.
      // Never client-writable; set only via identity-access's switchAccountType.
      accountType: {
        type: "string",
        input: false,
        defaultValue: "RIDER",
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
  // Google sign-in (ADR-017) — a standard OAuth2 social provider through Better Auth itself,
  // NOT Firebase Authentication (Firebase is used only for Cloud Messaging push, ADR-016).
  // Unset GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET simply means the `google` provider/callback
  // route never registers — there's no dev-safe stub here the way SMS/Places/Push have one,
  // so the login/signup UI must handle a failed `signIn.social` call with a normal error.
  // Account linking uses Better Auth's default: a Google email matching an existing *verified*
  // email signs into that same account rather than creating a duplicate.
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  // Cookie sessions remain the primary mechanism for the web app; bearer()
  // additionally lets non-browser clients (the Flutter app) authenticate via
  // `Authorization: Bearer <token>` using the same session/getSession machinery.
  // phoneNumber() adds mobile-number + OTP sign-up/sign-in (ADR-013). As of ADR-034, MSG91 is
  // the sole OTP generator on both platforms (its Widget SDK on web, its native OTP API on
  // mobile) — Better Auth verifies by asking identity-access's `verifyLoginOtp`, which in turn
  // asks MSG91, instead of comparing against a Better-Auth-generated code. This supersedes
  // ADR-032's "Better Auth stays the OTP system of record" decision; see ADR-034 for why.
  //
  // `otpLength`/`expiresIn`/`allowedAttempts` below are now INERT — confirmed in
  // better-auth/dist/plugins/phone-number/routes.mjs, setting `verifyOTP` replaces the internal
  // comparison entirely, so the attempt-counting branch that reads these never runs. Left in
  // place as documentation of the intended shape (and so they're not silently wrong if
  // `verifyOTP` is ever removed again), not because they still do anything.
  //
  // Send/verify rate limiting (phone + IP + resend cooldown) lives in front of this plugin's
  // HTTP endpoints — see apps/web/app/api/auth/[...all]/route.ts and
  // apps/web/app/api/otp/mobile/send/route.ts.
  plugins: [
    bearer(),
    phoneNumber({
      otpLength: 6,
      expiresIn: OTP_EXPIRES_IN_SECONDS,
      allowedAttempts: 5,
      phoneNumberValidator: (phone) => isValidIndianMobile(phone),
      // `sendOTP` is a required option of PhoneNumberOptions (can't be omitted), but nothing
      // should ever call it: web sends via the MSG91 widget (browser talks to MSG91 directly),
      // mobile sends via POST /api/otp/mobile/send. Both bypass Better Auth's own send-otp
      // endpoint entirely, and that endpoint itself returns 410 at the route-gate layer
      // (apps/web/app/api/auth/[...all]/route.ts) — this throw is belt-and-suspenders against
      // any other caller reaching this callback and silently running a second OTP system.
      sendOTP: async () => {
        throw new Error(
          "Better Auth's phone-number send-otp is disabled (ADR-034) — MSG91 owns OTP delivery on both platforms.",
        );
      },
      verifyOTP: async ({ phoneNumber, code }) => getIdentityAccessModule().otp.verifyLoginOtp({ phoneNumber, code }),
      signUpOnVerification: {
        getTempEmail: tempEmailForPhone,
        getTempName: (phoneNumber) => phoneNumber,
      },
      // Keep the plain `User.phone` field (used elsewhere — SOS profile completeness,
      // mobile app) in sync with the verified login phone number, rather than making
      // every existing caller of `user.phone` learn about a second field. `phone` isn't
      // part of Better Auth's own `UserWithPhoneNumber` type (it's not one of the plugin's
      // declared fields), so this write is unconditional/idempotent rather than compared.
      callbackOnVerification: async ({ phoneNumber, user }) => {
        await userRepository.updatePhone(user.id, phoneNumber);
      },
    }),
  ],
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

/**
 * ADR-055 — re-publishes a user's live DB row into every cached session blob.
 *
 * `secondaryStorage` above doesn't only hold rate-limit counters: Better Auth's
 * `internalAdapter.findSession` reads the WHOLE `{ session, user }` document out of it and
 * returns that cached `user` verbatim, never touching Postgres (confirmed in
 * better-auth/dist/db/internal-adapter.mjs). So `session.user.role` / `.accountType` /
 * `.partnerStatus` / `.accountStatus` are a *snapshot taken when the session was created*.
 * Better Auth keeps its own writes coherent by calling `refreshUserSessions` inside
 * `updateUser`, but BIKIE writes those columns through Prisma repositories (ADR-053 made
 * `accountType` a server-only field precisely so it could never be a client `updateUser` call),
 * which bypasses that hook entirely.
 *
 * Result before this helper: a phone signup that picked Service Provider got the right row in
 * Postgres and a session still saying `accountType: "RIDER"` — so `proxy.ts` and
 * `/partner-onboarding`'s client-side guard both routed the account as a Rider until the session
 * happened to be recreated. Invisible in local dev, where Upstash is unset and `findSession`
 * falls through to the DB join.
 *
 * Call this from the API route layer after any write that changes a session-exposed `User`
 * column. It is a no-op when `secondaryStorage` isn't configured, so local dev is unaffected.
 * Lives here rather than in `@bikie/database` because `@bikie/auth` already depends on that
 * package — the reverse import would be a cycle.
 */
export async function refreshCachedUserSessions(userId: string): Promise<void> {
  if (!secondaryStorage) return;

  // Selected explicitly rather than passed the whole Prisma row: this object is JSON-serialized
  // straight into the cache, and the full `User` model carries `Decimal` columns
  // (`helperRatingAvg`) plus relations that don't round-trip. These are exactly the Better Auth
  // core fields + the `additionalFields` declared above + the phone-number plugin's fields.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      phoneNumber: true,
      phoneNumberVerified: true,
      role: true,
      partnerStatus: true,
      accountType: true,
      accountStatus: true,
      accountStatusExpiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) return;

  const ctx = await auth.$context;
  await ctx.internalAdapter.refreshUserSessions(user as never);
}
