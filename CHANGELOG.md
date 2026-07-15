# Changelog

## Onboarding Field Expansion + Welcome/Login Fixes (ADR-014)
- Fixed a `/login` regression from the phone-OTP rewrite: email/password sign-in had no UI
  path left at all, which would have locked out the seeded admin account. Added a "Log in
  with email instead" fallback.
- Phone input on `/login` and `/signup` is now a country-code dropdown (India +91 default,
  USA +1) + 10-digit number field, instead of a free-form text box.
- `/welcome`: choosing a role now routes to `/login` for both Rider and Partner (previously
  went straight to the homepage/marketing page with no login required); visuals updated to
  match a client-provided reference more closely (circular logo badge, tagline, background
  image) while keeping the existing dark theme.
- Added a second reference doc's onboarding field list to the existing `RiderProfile`
  (father/mother name, DOB, gender, blood group, medical history, allergies, vehicle
  type/brand/model, government ID type+number, rider frequency, riding club) and `Partner`
  (Aadhaar number, 2 contact persons) models — not the doc's separate parallel schema, which
  would have duplicated/replaced working systems (see ADR-014).

## Phone Number + OTP Login (ADR-013)
- Replaced email+password with phone+OTP as the login/signup mechanism for both Rider and
  Partner accounts, using Better Auth's built-in `phoneNumber` plugin — OTP delivery reuses
  the existing `SMSService`, which console-logs the code when no Twilio credentials are
  configured (true today) instead of failing, so the whole flow works end-to-end right now
  with zero SMS vendor signup.
- New `User.phoneNumber`/`phoneNumberVerified` columns; the pre-existing `phone` field (SOS,
  mobile app) is kept in sync automatically rather than replaced.
- New self-service Rider → Partner upgrade: sign out, re-verify the same phone number via the
  Partner path on `/welcome`, supply business details, done — no admin approval step.
- Fixed a real bug found while wiring this up: the signup page's hardcoded partner-type list
  was missing `FUEL_DELIVERY`, out of sync with the schema's actual 8-value enum.
- Not built: Aadhaar/government-ID verification (needs a licensed third-party vendor, a
  cost/compliance decision not a code change).

## Product Requests — Homepage, Welcome Page, Rider Onboarding
- Fixed a real bug: `/dashboard/requests` approve/reject called a non-existent `PATCH`
  endpoint and silently no-op'd on every click (405). Now calls the real approve/reject
  routes with error feedback on failure.
- Homepage: added a real "Upcoming Rides" section (there was none) and a prominent SOS CTA
  in the Hero linking to the existing SOS feature.
- `/welcome` redesigned from full-bleed photo panels to a compact centered-logo + two-card
  layout, keeping the existing dark-navy/indigo theme.
- New skippable rider onboarding (`/onboarding`, gated only on new rider signups) collecting
  driving licence, address, and up to 3 emergency contacts (`RiderProfile`/
  `RiderEmergencyContact`); the dashboard Settings page's dead "Emergency Contacts" stub is
  now wired to the same data.

## Milestone 8.4 — Chat UI: reply/edit/delete/reactions/typing/read receipts
- Built the missing web chat UI on top of the already-complete 8.3 backend
  (`apps/web/components/chat/ChatArea.tsx`, `MessageItem.tsx`): inline reply with a
  quoted preview, inline edit (Enter to save / Escape to cancel) with an "(edited)"
  indicator, a 6-emoji reaction picker (👍❤️😂😮😢🙏) with add/remove toggle, a
  debounced typing indicator, and WhatsApp-style single/double read-receipt
  checkmarks. Delete-own-message already existed from a prior pass and was left as-is.
- No server-side changes were needed — `MessageService` already fanned out
  `message_edited`/`message_deleted`/`reaction_added`/`reaction_removed`/`message_read`/`typing`
  over the existing SSE stream; only the client had never subscribed to those event types.
- Not built in this pass: the Cloudinary image/file attachment composer UI (backend
  attachment support already exists via `MessageAttachmentDTO`, no picker wired in yet).

## Pre-Launch Audit Fixes
- Ran a full cross-functional audit (architecture, product/UX, security, performance,
  mobile, community/admin) across the whole codebase: 42 findings (2 Critical, 12 High,
  19 Medium, 9 Low), all fixed in this pass. See `.docs/TASKS.md` for the itemized list.
- Fixed a booking double-booking race (no transaction/overlap check previously existed) via
  a row-locked transaction in `createBookingIfAvailable`, returning 409 on conflict instead
  of allowing two confirmed bookings on the same bike for overlapping dates.
- Fixed the public navbar rendering no navigation at all for logged-out visitors/crawlers —
  the nav config now has a real default instead of an empty array.
- Added rate limiting (Upstash-backed, durable across serverless instances) on auth, SOS
  alert creation, and messaging; rewrote the upload endpoint to validate size/MIME/magic
  bytes and upload to Cloudinary instead of a local filesystem that never persisted in
  production; added security headers, closed ~15 routes' Zod validation gaps, fixed a CSV
  formula-injection risk in admin export, and stopped leaking a chat participant's email in
  ordinary 1:1 conversations.
- Fixed admin "delete user" crashing with an unhandled FK-constraint error; added missing
  indexes on `Trip.organizerId`/`Review.userId`/`Report.reporterId`/`ConversationParticipant.userId`/`GroupMember.userId`;
  closed a review-creation race and a trip-slug-generation race.
- Consolidated two competing `Skeleton` components into one; added route-level loading/error
  boundaries; fixed several accessibility and design-token issues; added `robots.ts`/
  `sitemap.ts` and structured data (JSON-LD) to bike/destination/blog pages.
- Wired the already-built (but unreachable) notification feed to `/dashboard/notifications`
  and added a navbar bell; added a rider-facing report action (message/ride) on top of the
  already-built Reports backend; added search/filters to ride discovery; removed two dead-end
  "manage" stub pages and fixed a hardcoded "Pending Approvals" stat.
- Built the admin Reports/Moderation UI and admin Groups CRUD on top of already-complete,
  previously UI-less backends; made the Admin Trips page editable (edit/cancel/delete).
- Mobile: fixed the release build silently defaulting to a known-broken production API;
  added real unit test coverage (booking, SOS, auth) where only one trivial smoke test
  existed before; corrected the roadmap to reflect a partial, previously-undocumented Rides
  browse port that already existed in the Flutter app.

## Milestone 8 — Community Platform v2 (in progress)
- Ran a full-project audit before starting (per explicit request): confirmed Communities,
  Groups, Clubs, Events, Reports, Moderation, and Notifications have no Prisma models at
  all, chat messages are stored as plain text with zero encryption infrastructure, and
  realtime delivery is an in-process `Map` confirmed broken across Vercel's independent
  serverless function instances. ~15 smaller pre-existing bugs also found (Partner Fleet
  CRUD 403s, `/community`/`/clubs` fake data, dead Contact form, etc.) — logged to
  `.docs/TASKS.md` as a tracked backlog, explicitly deferred rather than folded into this
  milestone.
- ADR-011 written: resolves the Groups/Communities/Clubs/Events terminology (one `Group`
  model with a type filter, `Events` becomes a `TripType` value, not new models), Ride Room
  composition (existing `Trip`↔`Conversation` pair + Announcements + emergency
  contacts/meeting point + shared media), AES-256-GCM server-side message encryption
  (Node's built-in `crypto`, no KMS), Upstash Redis for realtime (replacing the broken
  in-process SSE manager), and a hybrid `User.accountStatus` + `ModerationAction` design for
  moderation state, layered on top of the existing `AuditLog`.

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
