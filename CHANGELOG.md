# Changelog

## Milestone 7 — Rides: Community v1
- Pivoted product framing toward "find riders, plan adventures, ride together" — a
  request-then-approve group ride flow layered on the existing `Trip` model (previously had
  no working join mechanism at all; the web "Join Trip" button was a no-op stub). See
  ADR-010 for the scoping decisions (keep `Trip` internally, reuse `Conversation` for group
  chat, defer reviews/badges/tiers/clubs).
- `ParticipantStatus` changed from `JOINED | CANCELLED` to
  `PENDING | APPROVED | REJECTED | CANCELLED`; `seatsLeft` now decrements atomically on
  approval (race-safe conditional update) instead of on request, and reverses on a later
  cancellation. Migration remapped the 2 existing live `JOINED` rows to `APPROVED`.
- New: `POST /api/trips` (ride creation, membership-gated), request/approve/reject/leave
  routes, `/api/trips/[slug]/group` (ride Group conversation lookup), `/api/trips/mine`
  extended with `requested` rides and computed reputation stats.
- Web: ride creation form (`/trips/create`), a real join/request/approve UI
  (`RideActionsPanel`) replacing the old stub, Ride Group entry into the existing messaging
  UI via a `?conversation=` deep link, "My Rides" dashboard page extended with a Requested
  section and stats. Nav copy relabeled "Trips" → "Rides" throughout (cosmetic only — the
  `Trip` model name is unchanged).
- Verified end-to-end in a real browser (Playwright, since no project-specific run skill or
  `chromium-cli` was available in this environment): full loop from ride creation through
  request, organizer approval, and opening the shared group chat, with zero console errors.
  Caught and fixed one real bug this way — the create-ride form rendered fully for
  unauthenticated visitors before a `useEffect` redirect fired; now gated on session state
  before the form renders at all.

## Rebrand — accent color changed to indigo (`#3B3A91`)
- Web and mobile brand accent changed from orange to `#3B3A91` across both apps (ADR-009).
- Split into `--color-accent` (solid fills — buttons, badges, backgrounds) vs.
  `--color-accent-text` (links/labels/icons/star-ratings) since the literal color fails
  WCAG AA contrast as text against the dark-mode background; dark mode uses a lighter tint
  (`#8482D6`) for the text variant, light mode uses the literal color for both.
- Web: `text-accent` renamed to `text-accent-text` across ~32 files (Tailwind utility
  classes); `bg-accent`/`border-accent`/etc. unchanged.
- Mobile: bike/review star icons, "Instant booking" badge text, and membership plan
  checkmarks now use `AppTheme.accentTextOf(context)`; button/badge/avatar backgrounds
  keep `colorScheme.primary` (the literal accent).
- Fixed two real bugs found while implementing the mobile app: `BikeRepository.getBySlug`,
  `DestinationRepository.getBySlug`, and `TripRepository.getBySlug` were parsing detail API
  responses as if unwrapped, when they're actually wrapped in a singular key
  (`{ bike: ... }`, `{ destination: ... }`, `{ trip: ... }`) — this was the root cause of
  bike/destination/trip detail pages always showing a retry error. `.docs/API.md` corrected
  to match.

## Milestone 6 — Mobile App, Phases 1-5
- Flutter app (`apps/mobile`) built end-to-end: Riverpod + go_router + dio, feature-first
  structure mirroring `packages/*`. Dark-navy/orange theme ported from
  `.docs/UI_GUIDELINES.md` tokens; Inter font bundled locally as
  `assets/fonts/Inter-Variable.ttf` rather than fetched at runtime via `google_fonts` —
  the runtime-fetch approach crashed on an Android emulator with no general internet DNS
  during verification, a realistic failure mode for any offline/restricted-network device
  at first launch (see ADR-008).
- Auth: sign up/in/out via Better Auth's bearer flow, session bootstrap + token persistence
  via `flutter_secure_storage`, auth-gated routing via `go_router` redirects.
- Renter feature set: browse/search bikes (filters, detail), destinations, trips; bookings
  (create with date range + pickup city, list, status display); reviews (view + create,
  gated on completed bookings); wishlist (toggle add/remove); SOS emergency (send with
  device geolocation, respond, resolve, membership-gated upsell); membership (view active
  plan, purchase via a dummy `DUMMY-<uuid>` checkout mirroring the web's
  `PaymentModal.tsx`); referrals (view/copy code, link a code); messaging (polling-based,
  a deliberate scope trim vs. the web's SSE — see ROADMAP.md Milestone 6b); profile
  (phone number update, logout).
- App default API base URL points at the deployed production API
  (`https://bikie-web-rs8i.vercel.app`), overridable via `--dart-define=API_BASE_URL=...`
  for local dev.

## Milestone 6 — Mobile App, Phase 0
- Better Auth `bearer` plugin so non-browser clients (the Flutter app) can authenticate via
  `Authorization: Bearer <token>` alongside the web app's existing cookie sessions — zero
  route-handler changes needed since session resolution already reads from headers.
- Real booking creation (`POST /api/bookings`, previously GET-only): computes `totalPrice`
  from the bike's `pricePerDay` × day count, defaults to `CONFIRMED` for instant-booking
  bikes and `PENDING` otherwise.
- Real review creation (`POST /api/bikes/[slug]/reviews`, previously GET-only), gated on a
  completed booking owned by the caller, one review per booking.
- Wishlist add/remove (`POST`/`DELETE /api/wishlist/[bikeId]`) — previously read-only on
  both web and mobile.
- Reconciled `.docs/API.md` with the real route inventory and documented the mobile
  bearer-auth flow.

## Milestone 3b
- SOS alerts now show complete reporter info (email, phone, exact coordinates with a Google Maps link) in both the dashboard and admin feeds.
- SOS Emergency (send, view, respond) gated behind an active membership; admins bypass the gate. Non-members see an upsell instead of the form.
- Referral system: auto-generated per-user referral code (`User.referralCode`, `User.referredById`), signup accepts an optional code (or `?ref=` link), dashboard Referrals page to share the link and see who joined, admin Referrals page listing all referrer/referee pairs. Tracking only — no automatic reward.
- Dummy payment checkout modal for membership purchase (simulated card form, fake processing delay, generates a `DUMMY-*` paymentId) replacing the instant-activate button.
- Admin Membership Plans management (create/toggle active/delete plans) — previously plans could only be seeded, not managed.

## Milestone 3
- SSE endpoint (`GET /api/sse`) + React hook (`useSSE`)
- `AuditLog` model, migration, repository, API route (`/api/admin/audit-logs`)
- Audit logging instrumented on all admin CRUD routes (users, partners, bikes, bookings, testimonials)
- Admin dashboard charts (recharts): monthly bookings bar chart, bookings-by-status pie chart, bikes-by-city bar chart
- CSV export API (`/api/admin/export?type=users|bookings|partners`)
- Email service (Resend-compatible) with admin compose page
- SMS gateway (Twilio-compatible) with admin compose page
- SOS auto-resolve cron endpoint (`/api/cron/sos-resolve`)
- SOS history API (`/api/sos/alerts/history`)
- Testimonial CMS management (admin CRUD API + management UI)
- New admin nav items: SOS, Audit Logs, Testimonials, Email, SMS

## Milestone 2
- Added `.docs/` governance scaffolding and root `CLAUDE.md`.
- Extending Prisma schema with Booking, Review, Trip, TripParticipant, Partner.
- Full seed data: Super Admin, Demo Partner, Demo User, realistic sample content.
- Dark-default theme with refined navy/midnight/slate palette.
- Converted single-page homepage into a full multi-page site per the sitemap.
- Added User/Partner/Admin dashboards with role-gated routing.
- Messages (Conversation, ConversationParticipant, Message models; real-time chat UI with SSE)
- Membership (MembershipPlan, UserMembership models; landing page with purchase flow)
- SOS emergency (SOSAlert, SOSAlertResponse models; emergency page with type selector + location capture)
- Partner fleet management (add/delete bikes)
- SSE manager singleton

## Milestone 1
- Monorepo scaffold (pnpm + Turborepo), Prisma schema for core content models,
  Better Auth wired to Neon, polished animated homepage with real seeded data.
