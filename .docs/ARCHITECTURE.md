# BIKIE — Architecture

## Monorepo layout

```
bike/
├── apps/
│   ├── web/                 # Next.js 16 (App Router) — site + API route handlers
│   └── mobile/               # Flutter renter app — NOT a pnpm/turbo workspace member
├── packages/
│   ├── database/           # Prisma schema, generated client, repositories
│   ├── auth/                # Better Auth server config
│   ├── services/           # Business logic wrapping repositories
│   ├── validation/         # Zod schemas
│   ├── types/               # Shared DTOs
│   ├── ui/                  # Design-system primitives (Button, Card, GlassPanel, ...)
│   └── utils/                # cn(), formatCurrency, slugify
├── .docs/                    # This documentation set
└── pnpm-workspace.yaml / turbo.json
```

## Layering rule (enforced, not aspirational)

```
UI (Server/Client Components)
  → Route Handler (apps/web/app/api/**)
    → Service (packages/services)
      → Repository (packages/database/src/repositories)
        → Prisma → Neon Postgres
```

Server Components fetch their own `/api/*` routes rather than importing
`packages/services` directly — this keeps the API boundary real, since it's the
exact contract a future Flutter app will consume. No `@prisma/client` import may
appear anywhere under `apps/web`.

## Why API stays inside `apps/web` (no separate `apps/api`)

Route Handlers already deploy as independent serverless functions on Vercel.
Splitting into a second app would mean a second domain, CORS, and cross-origin
Better Auth cookie handling for no present benefit. If a dedicated API app is ever
needed, it can be extracted later by pointing new route handlers at the same
`@bikie/services` package.

## Auth & roles

Better Auth, backed by Neon via the Prisma adapter. `User.role` is one of
`RENTER | PARTNER | ADMIN`. Dashboard routes are gated by role in a `proxy.ts`
(Next.js 16 renamed `middleware` → `proxy`) plus a server-side session check in
each dashboard's layout.

The web app authenticates via Better Auth's HTTP-only session cookie. The Flutter app
(`apps/mobile`) instead uses **bearer tokens**, enabled by the `bearer()` plugin in
`packages/auth/src/server.ts` (ADR-007). Both mechanisms are active simultaneously —
`auth.api.getSession({ headers })`, which every protected route calls via
`requireSession()`/`requireRole()`/`requireMembership()`, resolves the session from
either the cookie or an `Authorization: Bearer <token>` header with no per-route changes.

## Fonts, theme, animation

- Fonts: Geist Sans (display) via `geist/font/sans`, Inter (body) via
  `next/font/google`.
- Theme: dark-default (see `UI_GUIDELINES.md`), toggle via `next-themes`,
  class-based (`.dark` on `<html>`).
- Animation: Lenis owns global smooth scroll; GSAP + ScrollTrigger is reserved for
  the Hero's parallax; Motion (`motion/react`) handles scroll reveals, hover
  states, carousels, and page transitions.

## Dev server port

Pinned to **4000** (`next dev -p 4000`) rather than the default 3000, because other
local projects on this machine occupy 3000. `NEXT_PUBLIC_APP_URL` /
`BETTER_AUTH_URL` in `.env.local` must match whatever port is actually used.
Internal SSR fetches (`apps/web/lib/api.ts`) derive their origin from the incoming
request's `host` header rather than trusting the env var, so this is robust to
port drift regardless.
