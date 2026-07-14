import { NextResponse } from "next/server";
import { RateLimitService } from "@bikie/services";

/**
 * Route-handler rate limit guard. Returns a 429 NextResponse when the caller has exceeded
 * `requests` within `windowSeconds`, or `null` when the request may proceed.
 *
 * `name` should be a stable bucket identifier (e.g. "sos-alert-create"); `identifier` should
 * be something the caller can't easily rotate (session user id — these routes all require a
 * session already, so we key on that rather than IP).
 */
export async function enforceRateLimit(
  name: string,
  identifier: string,
  { requests, windowSeconds }: { requests: number; windowSeconds: number },
) {
  const result = await RateLimitService.check(name, identifier, requests, windowSeconds);
  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down and try again shortly." },
      { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
    );
  }
  return null;
}
