# BIKIE — Architecture Decision Records

## ADR-001: API stays inside `apps/web`, no separate `apps/api`
Route Handlers already deploy independently on Vercel; a second app would add a
domain/CORS/cookie-sharing problem for zero present benefit. Revisit only if the
Flutter app needs the API to scale independently of the website.

## ADR-002: Dark theme is default, not just a toggle option
The product brief calls for a premium dark aesthetic (Dark Navy / Midnight Blue /
Deep Slate) as the primary identity, matching Linear/Notion/Tesla-style dark-first
products. Light mode is kept as an accessibility toggle, not removed.

## ADR-003: Dev server pinned to port 4000
Port 3000 is occupied by an unrelated project on this machine. Rather than fight
for the default port, `apps/web` always runs on 4000. SSR internal fetches derive
their origin from request headers (not the env var) so this doesn't create a
fragile dependency on the exact port number.

## ADR-004: Prisma 7 config split (`prisma.config.ts` + driver adapter)
Prisma 7 removed `datasource.url`; migrations run via `prisma.config.ts` against
Neon's **unpooled** `DIRECT_URL`, while the runtime `PrismaClient` uses
`@prisma/adapter-neon` against the **pooled** `DATABASE_URL`.

## ADR-005: Booking/Review/Trip/Partner modeled as first-class Prisma models
Added in this pass specifically to support seed data and the dashboards. `Partner`
is a profile attached 1:1 to a `User` with `role = PARTNER` (not a separate auth
identity) — one account, a partner profile unlocks partner-mode UI, matching the
"one account, multiple modes" principle from the original product vision.

## ADR-006: Font substitution — Geist Sans + Inter instead of Satoshi/General Sans
Satoshi/General Sans (Fontshare) require self-hosted licensing; Geist Sans (MIT,
official Vercel `next/font` package) is a close geometric-grotesque match and adds
zero licensing friction. Documented upgrade path: swap via `next/font/local` later
if brand assets are finalized.
