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

## ADR-007: Better Auth `bearer` plugin for mobile auth
The web app was built cookie-session-only (Better Auth default). A native Flutter app
can't reasonably manage a browser-style cookie jar, so rather than build a separate
mobile auth service, `packages/auth/src/server.ts` adds Better Auth's built-in `bearer()`
plugin. Sign-in/sign-up responses gain a `set-auth-token` header; the Flutter app stores
that token (`flutter_secure_storage`) and sends `Authorization: Bearer <token>`. Every
existing route handler already resolves sessions via `auth.api.getSession({ headers })`
(through `requireSession`/`requireRole`/`requireMembership`), so this required zero
route-handler changes — cookie and bearer auth now work side by side against the same API.

## ADR-008: Flutter font — Inter, bundled locally (not `google_fonts` runtime fetch)
No Flutter/Dart package exists for Geist Sans (see ADR-006 for why the web uses it), so the
Flutter app uses Inter instead — closest available geometric-grotesque match, same
rationale as ADR-006. Initially wired up via the `google_fonts` package's default runtime
fetch (downloads the TTF from fonts.gstatic.com on first use); this **crashed the app**
during Phase 1 verification on a fresh Android emulator with no general internet DNS
(reachable the host loopback for API calls, but not `fonts.gstatic.com`) — a realistic
failure mode for any device that's offline or on a restricted network at first launch, not
just an emulator artifact. Fixed by downloading `Inter[opsz,wght].ttf` (OFL-licensed, from
Google's official `google/fonts` GitHub repo) and bundling it directly as
`apps/mobile/assets/fonts/Inter-Variable.ttf`, declared in `pubspec.yaml`'s `fonts:`
section — zero runtime network dependency for text rendering.

## ADR-009: Brand accent changed to indigo (`#3B3A91`), split into fill vs. text tokens
Requested rebrand from the orange CTA accent to `#3B3A91` across both web and mobile.
`#3B3A91` contrasts well as a solid fill with white text (~7.5:1) and as text against the
light-mode background (~9.8:1), but as text/icon color against the dark-mode background
(the default theme, ADR-002) it's only ~1.8:1 — well under WCAG AA's 4.5:1 minimum. Rather
than accept that regression or water down the requested color, the accent was split into
two tokens: `--color-accent` (`#3B3A91` literal, for solid fills — buttons, badges, avatar
and chat-bubble backgrounds) and `--color-accent-text` (`#3B3A91` in light mode, `#8482D6`
— a lighter tint of the same hue — in dark mode, for links/labels/star-ratings/badge text).
Web: Tailwind classes `bg-accent` vs. `text-accent-text` (swapped project-wide from the
prior single `text-accent`). Mobile: `Theme.of(context).colorScheme.primary` for fills vs.
`AppTheme.accentTextOf(context)` for text/icons.

## ADR-010: Rides — request/approve join, keep the `Trip` model name, reuse `Conversation` for group chat, defer reputation/badges/tiers/clubs
Product direction shifted from "rent a bike" toward "find riders, plan adventures, ride
together" — a community layer on top of the existing `Trip` concept (which previously had no
working join mechanism at all; the web "Join Trip" button was a literal no-op stub). Four
scoped decisions, each chosen to minimize new surface area:
- **Keep `Trip`/`TripParticipant` as the model names** (DB table, API routes, DTOs) and only
  relabel user-facing copy to "Ride"/"Rides". A full rename would touch the DB schema, every
  route path, the DTOs, and the already-working Flutter trip screens for zero functional
  gain — Prisma model names aren't user-visible.
- **Request-then-approve, not instant join.** `ParticipantStatus` changed from
  `JOINED | CANCELLED` to `PENDING | APPROVED | REJECTED | CANCELLED` (migration:
  `packages/database/prisma/migrations/20260710120000_ride_request_flow` — the 2 existing
  `JOINED` rows in the live DB were remapped to `APPROVED` inline during the enum type swap).
  `seatsTotal`/`seatsLeft` unchanged; `seatsLeft` now decrements atomically on approval
  instead of on request.
- **Reuse `Conversation`/`ConversationParticipant`/`Message` for the "Ride Group" chat**
  instead of a new `RideChat` model — those models already support N participants with zero
  schema changes (only addition: a nullable `Conversation.tripId` FK). See ARCHITECTURE.md.
- **Deferred to a later pass, not built now:** rider-to-rider reviews (the existing `Review`
  model is hard-locked to `Bike`+`Booking`, can't flex — would need a new `RideReview` model),
  badges, membership tiers (Guest/Member/Verified Member — membership today is binary
  active/inactive, reused as-is via the existing `requireMembership()` gate for ride
  creation), and clubs. Reputation in v1 is a simple computed stat
  (`ridesOrganized`/`requestsSent`/`requestsApproved`/`ridesCancelled`/`approvalRate`), not a
  stored field.

## ADR-011: Community Platform v2 — Groups/Communities/Clubs/Events terminology, Ride Room composition, message encryption, moderation, realtime

A full-project audit (before Milestone 8) confirmed `Communities`, `Groups`, `Clubs`,
`Events`, `Reports`, `Moderation`, `Notification` had **no Prisma models at all** — not
missing UI, missing data models — while the spec listed them as five separate
admin-manageable concepts alongside the existing `Trip`-based Rides. Seven scoped decisions,
continuing ADR-010's "reuse over new surface area" precedent:

- **`Group` is one new model** (`Group` + `GroupMember`, `GroupType { COMMUNITY, CLUB }`),
  not three. Admin nav "Groups" = full CRUD table; "Communities"/"Clubs" are the same table
  pre-filtered by `type`, not separate models or pages. Reuses `Conversation`/`Message` for
  group chat via a nullable unique `Group.conversationId` — identical shape to
  `Trip.conversation`, zero new chat infrastructure.
- **User-facing Group creation/joining is deferred (Milestone 8b).** Nothing in the
  functional spec describes a user creating or requesting to join a persistent group, only
  rides. Groups ship admin-seeded only in this pass — the same posture `Destination`,
  `Category`, and `Testimonial` already have (admin-created-only content, no user-facing
  creation flow). A future request/approve flow can reuse `TripParticipant`'s
  `PENDING → APPROVED|REJECTED` pattern directly.
- **"Events" is a new `TripType` enum value (`EVENT`), not a new model.** Same shape as a
  Ride (title, date range, location, capacity, organizer) — a separate `Event` model would
  duplicate `Trip` for zero structural gain, the exact anti-pattern ADR-010 already rejected
  once. Admin "Events" nav is `/admin/trips?type=EVENT`, reusing the Trips admin page.
- **Ride Room is a composition, not a new top-level entity**: the existing `Trip` ↔
  `Conversation` pair (ADR-010) plus a new `Announcement` model, `Trip.emergencyContacts`
  (`Json?`, following the existing `Bike.gallery: String[]`/`MembershipPlan.benefits: String[]`
  precedent for small structured lists that don't need their own table), `Trip.meetingLat`/
  `meetingLng`, and "Shared Media" as a filtered view over `MessageAttachment` joined through
  the room's conversation — not a parallel media-library table. One shared guard function
  (`assertRideRoomAccess`) is called on every Ride Room route: Organizer + Approved Riders +
  Admin only. Polls and Live Location are explicitly deferred (documented extension points:
  `MessageType.POLL`, `Trip.liveLocationEnabled`), not built now.
- **Message encryption: AES-256-GCM via Node's built-in `crypto`, server-only key.** New env
  var `MESSAGE_ENCRYPTION_KEY` (32-byte base64), same posture as `BETTER_AUTH_SECRET` — no
  KMS, no new npm dependency for crypto itself. `message.repository.ts` stays a dumb
  ciphertext-in/ciphertext-out store (per the existing layering rule); `message.service.ts`
  (+ new `lib/message-crypto.ts`) owns encrypt-on-write/decrypt-on-read, including the admin
  moderation decrypt path — which goes through the *same* `getMessages` call as every other
  read, gated by a role branch and an `logAdminAction("VIEW_CONVERSATION")` audit write, not
  a separate code path that could drift out of sync. Deleting a message nulls
  `ciphertext`/`iv`/`authTag`/`content` outright (true erasure), not a soft-delete flag.
- **Realtime: Upstash Redis, REST-client inbox-drain — not raw TCP `SUBSCRIBE`.** The
  existing `apps/web/lib/sse-manager.ts` in-process `Map` is confirmed broken across
  Vercel's independent serverless function instances (ADR-001). Vercel functions can't hold
  long-lived TCP subscriptions cleanly, so `@upstash/redis`'s REST client (not `ioredis`) is
  used: each user gets an `inbox:<userId>` Redis list, publishers `RPUSH`, the SSE route
  drains+deletes on a 2s poll. This list-per-user design is also the authorization
  boundary — there is no shared "conversation channel" an unauthorized listener could
  subscribe to. Mobile has no SSE client and stays on polling (tightened to 3s for an open
  Ride Room thread), per the existing Milestone 6b decision.
- **Moderation state: hybrid `User.accountStatus` (denormalized fast-path) + `ModerationAction`
  (audit-trail source of truth), on top of the existing `AuditLog`, not instead of it.**
  `AuditLog`/`logAdminAction()` remains the generic cross-feature ledger (unchanged, still
  feeds CSV export and the Audit Logs page); `ModerationAction` is the trust-and-safety-specific
  state machine with `expiresAt` semantics (mute/suspend durations) that hot paths
  (`requireSession`, `sendMessage`) query directly, without joining history on every request.
