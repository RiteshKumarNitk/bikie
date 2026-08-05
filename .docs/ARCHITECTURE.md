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
    → Service / Application (packages/services)
      → Port (module interface)
        → Repository (packages/database) | Adapter (Twilio/Meta/SMTP/FCM/…)
          → Prisma / vendor API
```

External vendors (Twilio, Meta WhatsApp, SMTP/Resend, FCM, Cloudinary, Google Places)
must be reached only through adapters behind ports. Compatibility facades
(`EmailService`, `SMSService`, `WhatsAppService`, `PushService`, `SOSService`,
`SOSDispatchService`, `RiderLocationService`, `PlacesService`, `BikeService`,
`BookingService`, `PartnerService`, …) keep existing imports stable while the
modular-monolith migration proceeds (see ADR-021–024).

First extracted modules under `packages/services/src/modules/`:

| Module | Owns | Facade entry points |
|---|---|---|
| `communications` | Email/SMS/WhatsApp/push ports + adapters | `EmailService`, `SMSService`, `WhatsAppService`, `PushService` |
| `safety-location` | SOS alerts, staged escalation, helper-acceptance sessions, rider location, Places (ADR-033) | `SOSService`, `SOSDispatchService`, `SOSSessionService`, `RiderLocationService`, `PlacesService` |
| `reputation` | Minimal SOS-helper reputation — assist counter + rating avg only, no badges (ADR-033 Phase D) | consumed by `safety-location`'s `session.application.ts` via `getReputationModule()`, no facade of its own yet |
| `identity-access` | Account status, roles, permissions, membership gate, login OTP | `apps/web/lib/require-role.ts`, Better Auth `sendOTP` hook |
| `catalog` | Bikes, destinations, categories, testimonials | `BikeService`, `DestinationService`, `CategoryService`, `TestimonialService` |
| `rentals-bookings` | Booking pricing/lifecycle, review eligibility, wishlist | `BookingService`, `ReviewService`, `WishlistService` |
| `partners` | Partner profile and dashboard stats | `PartnerService` |
| `rides-community` | Trips/rides, join/approve/leave, Ride Room | `TripService`, `RideRoomService` |
| `messaging` | Conversations, encrypted messages, receipts/reactions | `MessageService` |
| `administration` | Admin CRUD, bounded CSV export | `AdminService` |
| `trust-safety` | Reports, moderation actions, audit log | `ReportService`, `ModerationService`, `AuditService` |
| `platform` | Retry, idempotency, sync job queue | used by SOS fan-out + future workers |

Authorization policy lives in `identity-access` and returns a transport-neutral
`AccessDecision`; `apps/web/lib/require-role.ts` maps each denial reason to the HTTP status
and body it has always returned (ADR-023). Permissions are derived from `User.role`, not
stored, so they can never grant more than the equivalent role check.

Server Components fetch their own `/api/*` routes rather than importing
`packages/services` directly — this keeps the API boundary real, since it's the
exact contract a future Flutter app will consume. No `@prisma/client` import may
appear anywhere under `apps/web`.

## Modular monolith migration (in progress)

Bounded contexts are being extracted under `packages/services/src/modules/*` using a
Strangler pattern: characterization tests → ports/adapters → compatibility facades →
caller migration → delete legacy paths. Plan:
`project doc/MODULAR_MONOLITH_IMPLEMENTATION_PLAN.md`. Phases 1–9 foundation landed
(ADR-021–028); OpenAPI v1 is generated from Route Handlers. Full async outbox/workers and
facade deletion remain deferred until staging NFR baselines / zero-use proof.

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

## Rides (community rides)

User-organized group rides (`Trip`/`TripParticipant` models — internal name unchanged,
user-facing copy says "Ride", see ADR-010) follow a request-then-approve flow instead of
instant join: `TripParticipant.status` moves `PENDING → APPROVED|REJECTED`, with `CANCELLED`
for withdrawals. `Trip.seatsLeft` is a real counter, decremented atomically on approval
(conditional `UPDATE ... WHERE seatsLeft > 0`, not a naive read-then-write) and incremented
back if an approved rider later leaves.

The "Ride Group" chat is **not** a new subsystem — it's the existing `Conversation` /
`ConversationParticipant` / `Message` models (already group-capable, see
`packages/database/src/repositories/message.repository.ts`), linked to its ride via a
nullable `Conversation.tripId` FK. The conversation is created on the ride's first approval
and subsequent approvals just add a `ConversationParticipant` row — the group chat UI is the
same `/dashboard/messages` page used for partner 1:1 chats, entered via a
`?conversation=<id>` deep link.

## Community Platform v2 (Milestone 8 — in progress, see ADR-011)

Ride Rooms, encrypted group chat, moderation, and mobile parity are being built on top of
the existing Rides feature above. This section is a stub, filled in as each phase lands —
see `.docs/TASKS.md` Milestone 8 for phase status and `.docs/DECISIONS.md` ADR-011 for the
full architecture (schema, encryption, realtime, moderation).

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
