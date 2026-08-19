import { headers } from "next/headers";

/** Carries the upstream HTTP status so a caller can tell an *expected* authorization refusal
 * (403 from a capability gate) apart from a genuine failure (5xx, network). Without this, a
 * server component's only option was `catch {}`, which hides real outages behind empty state. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
  ) {
    super(`Request to ${path} failed with status ${status}`);
    this.name = "ApiError";
  }
}

export async function getJson<T>(path: string, options?: { auth?: boolean }): Promise<T> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const base = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

  const res = await fetch(`${base}${path}`, {
    ...(options?.auth
      ? { headers: { cookie: requestHeaders.get("cookie") ?? "" }, cache: "no-store" as const }
      : { next: { revalidate: 300 } }),
  });
  if (!res.ok) {
    throw new ApiError(res.status, path);
  }
  return res.json() as Promise<T>;
}

/**
 * Read that degrades to `fallback` when the caller simply isn't entitled to the data yet,
 * and still throws for everything else.
 *
 * ADR-055 — every `/api/partner/**` route is gated by `requirePartnerCapability`, which also
 * requires an *active Service Provider membership* (ADR-051). `/partner/**` page routing, by
 * contrast, gates on `accountType` + `partnerStatus` only (`proxy.ts`, `partner/layout.tsx`) —
 * deliberately, so a provider can reach `/partner/membership` and buy one. That gap is normal
 * and expected: a brand-new Service Provider legitimately sits inside the dashboard with no
 * membership, and every server component that fetched its own data with a bare `getJson` turned
 * that 403 into an unhandled throw and a 500 error page. Use this for those reads.
 *
 * Only 401/403 fall back. A 500 from a broken upstream still propagates, so a real outage
 * surfaces as an error instead of masquerading as "you have no bookings".
 */
export async function getJsonOrFallback<T>(
  path: string,
  fallback: T,
  options?: { auth?: boolean },
): Promise<T> {
  try {
    return await getJson<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      return fallback;
    }
    throw err;
  }
}
