/**
 * Canonical public site origin — used for sitemap/robots URLs and JSON-LD
 * absolute URLs, where we need a stable canonical host rather than whatever
 * `host` header a particular request happened to arrive on (see lib/api.ts
 * for that request-derived variant, used for internal SSR fetches instead).
 *
 * Mirrors the fallback chain already used for `metadataBase` in app/layout.tsx.
 */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:4000")
  );
}
