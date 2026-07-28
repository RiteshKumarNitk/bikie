# BIKIE — Architecture Decision Records

## ADR-001: API stays inside `apps/web`, no separate `apps/api`
Route Handlers already deploy independently on Vercel; a second app would add a
domain/CORS/cookie-sharing problem for zero present benefit. Revisit only if the
Flutter app needs the API to scale independently of the website.

## ADR-002: Dark theme is default, not just a toggle option
The product brief calls for a premium dark aesthetic (Dark Navy / Midnight Blue /
Deep Slate) as the primary identity, matching Linear/Notion/Tesla-style dark-first
products. Light mode is kept as an accessibility toggle, not removed.

## ADR-003: Dev server pinned to port 3000 (was 4000)
Originally pinned to 4000 because port 3000 was occupied by an unrelated project on the
original dev machine. Changed back to 3000 because port 4000 falls into a Windows Hyper-V
reserved range (`3909–4008`) on a subsequent machine, making it unusable without admin
privileges. SSR internal fetches derive from request headers (not the env var), so the port
remains a local-only convention with no production impact.

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

## ADR-012: Rider profile onboarding — new `RiderProfile`/`RiderEmergencyContact` models, skippable gate, no Aadhaar/KYC verification
A client meeting requested an extensive KYC-style post-signup form (vehicle details, Aadhaar
number + OTP verification, driving licence, address, medical history, emergency contacts).
Scoped down, per explicit user decision, to what the app can actually back today:
- **New `RiderProfile` (1:1 with `User`) + `RiderEmergencyContact` (many, cascade-deleted with
  the profile)** — driving licence number/expiry, address (line/area/district/pincode/country),
  and 0-3 emergency contacts. Named distinctly from the existing ride-level
  `Trip.emergencyContacts`/`EmergencyContactDTO` (Ride Room, ADR-011) — this is a *profile*-level
  concept, a different thing that happens to share a name; kept as separate models rather than
  reusing the Ride Room shape, since a rider's own contacts aren't scoped to any one ride.
- **No Aadhaar/government-ID verification.** UIDAI doesn't allow direct third-party Aadhaar
  integration — real verification needs a licensed vendor, a cost/compliance decision, not a
  code change. Not built; the form only collects driving-licence-style fields the app already
  has a reason to show back to the user (e.g. on the Settings page).
- **Skippable, not mandatory.** `RiderProfile.onboardingSkipped` (boolean) plus the mere
  existence of a `RiderProfile` row is how `RiderProfileService.needsOnboarding()` decides
  whether to show the gate again — a user who explicitly skips gets an (mostly empty) row
  written so they aren't re-prompted every login, distinct from a user who was never asked yet
  (no row at all).
- **No mobile+OTP login** in this pass either (a separate, larger ask from the same meeting) —
  real OTP delivery needs an SMS provider (Twilio/MSG91/etc.), and none is configured
  (`apps/web/.env.local` has no SMS vendor, only email via Resend). Deferred until a provider
  is chosen; email/password (plus the existing bearer-token mobile auth) is unchanged.

## ADR-013: Mobile number + OTP login, for both Rider and Partner — Better Auth's `phoneNumber` plugin, console-logged OTP until a real SMS vendor is chosen
Follow-up to ADR-012, once the SMS-provider question came back "build it now anyway." Three
decisions:
- **Better Auth's built-in `phoneNumber` plugin** (already present in the installed
  `better-auth` version, no new dependency) rather than hand-rolling OTP storage/expiry/retry
  logic — it owns OTP generation, expiry (5 min), and attempt-limiting (3 tries), and exposes
  `POST /phone-number/send-otp` / `POST /phone-number/verify`. `signUpOnVerification` auto-
  creates the `User` row on a brand-new phone number's first successful verification (with a
  placeholder email/name — see `tempEmailForPhone`/`getTempName` in `packages/auth/src/server.ts`),
  auto-logging them in with a session in the same call. New `User.phoneNumber` (unique) /
  `phoneNumberVerified` columns are the plugin's own required schema, added alongside — not
  merged into — the pre-existing plain `User.phone` field (used by SOS profile-completeness
  and the mobile app before this ADR), which a `callbackOnVerification` hook keeps in sync so
  none of those existing call sites needed to change.
- **OTP delivery reuses the existing `SMSService`** (`packages/services/src/sms.service.ts`)
  rather than a new one — it already has the exact dev-safe posture needed: if
  `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER` aren't set, it logs
  `[SMS][DEV] To: ... | Message: ...` to the server console instead of failing. Per explicit
  user decision, that's the shipped behavior for now — real SMS delivery is a one-time env-var
  addition away, no code change, whenever a Twilio (or compatible) account is set up.
  Email/password sign-in is unchanged server-side and still works side by side — **but the
  first pass of `/login` replaced the UI wholesale with phone/OTP fields and lost the only UI
  path to it**, which would have locked out the seeded admin account (`admin@bikie.app`,
  created via email/password, no `phoneNumber` set — admins aren't created through the public
  phone-based signup at all). Fixed by adding an "Admin or existing email account? Log in with
  email instead" toggle on `/login` (not `/signup`, which stays phone-only by design — new
  account creation is the part that moved to OTP, not every login path).
- **Role upgrade (Rider → Partner) is self-service, not admin-approved**: an existing user can
  sign back in via the same phone number through the Partner path on `/welcome`, then supply
  business details, which calls the new `POST /api/user/become-partner` — sets `User.role` to
  `PARTNER` and upserts a `Partner` profile in one step (`UserService.becomePartner`, guarded
  to refuse if already `PARTNER`/`ADMIN`). This is a narrower, explicitly-scoped version of the
  "one account, multiple modes" principle from ADR-005 — a real admin-reviewed partner
  application queue (the existing signup flow's "will be reviewed by our team" copy) is a
  separate, larger feature not built here.

## ADR-014: Onboarding field list from a second reference doc — fields only, not the doc's parallel schema
A second reference document arrived with its own full technical spec (`Biker`/`Provider`/
`Trip`/`Booking`/`PanicAlert` Prisma models, NextAuth-based auth, a different API surface) —
a complete, different design for the same product, not a diff against what's actually built.
Per explicit user confirmation ("I just want onboarding from this"), only the onboarding field
*list* was adopted, layered onto the existing models — the doc's architecture was not adopted:
- **`RiderProfile` gains**: `fatherName`/`motherName`, `dateOfBirth`, `gender`, `bloodGroup`,
  `medicalHistory`, `allergies`, `vehicleType`/`vehicleBrand`/`vehicleModel`, a
  `GovernmentIdType` (`AADHAAR | PASSPORT`) + `governmentIdNumber` (raw text, no verification —
  same reasoning as ADR-012: real Aadhaar verification needs a licensed vendor, not a code
  change), `RiderFrequency` (`OCCASIONAL | WEEKLY | DAILY`, named to avoid colliding with any
  future "rider type" concept), and `RidingClubType` (`SOLO | CLUB_MEMBER`) + `clubName`. All
  optional, all part of the existing skippable onboarding gate (ADR-012) — not a new gate.
- **`Partner` gains**: `aadhaarNumber` and two optional contact-person name/mobile pairs. The
  reference doc's `ServiceType` enum (Rental/Mechanic/Fuel/Puncture/Medical/Towing/Multi-service)
  was deliberately **not** adopted in place of the existing `PartnerType` enum (Rental/Mechanic/
  Fuel Delivery/Tour Guide/Hotel/Camping/Accessories/Photography) — swapping it would silently
  drop categories the current `/partners/services` marketing page already advertises; that's a
  business-scope decision, not something to infer from a reference doc.
- **What was explicitly not built**: a parallel `Biker`/`Provider` model set, a separate
  `PanicAlert` system (the existing `SOSAlert` Red/Amber-equivalent flow already exists),
  `RentalRequest`/`RentalResponse` marketplace matching, or a `Trip`/`TripOption`/`TripMember`
  redesign (the existing `Trip`/`TripParticipant` — Rides — already covers this per ADR-010).
  These would replace working systems for no stated gain; revisit only if a real gap in the
  *existing* systems is identified, not because a reference doc modeled the same idea twice.
- **`/welcome` flow**: role selection no longer drops the visitor straight onto the
  homepage/marketing page — both paths now route to `/login` (which already offers a
  "no account yet? sign up" fallback), so a role is chosen *and then* the visitor authenticates
  before seeing any dashboard content. Anonymous marketing-site browsing without picking a role
  is unaffected (the role cookie is separate from being logged in).

## ADR-015: Name moves from the OTP signup step to the onboarding/partner-onboarding form; Panic UI becomes modal-based and moves above the Hero
Per a third reference doc (a full rider-registration mockup) plus explicit user instructions:
- **Full name is no longer collected on `/signup`'s OTP step.** It previously appeared inline
  in the OTP-entry form for brand-new phone numbers and was sent to
  `PATCH /api/user/complete-phone-signup` alongside the chosen role. That endpoint's `name`
  field is now optional (`completePhoneSignupSchema`, `UserService.completePhoneSignup`) — the
  call is still made immediately after OTP verify, but now only to apply the Rider/Partner role
  picked on `/welcome`; the account keeps Better Auth's placeholder name (the raw phone number,
  `getTempName`) until the user reaches onboarding. Name is instead collected as a plain field
  in the "Rider profile" section of `/onboarding` (and a new "Your details" section on
  `/partner-onboarding`, since both roles share the same OTP step), saved via
  `authClient.updateUser({ name, image })` directly from the client — no new backend route,
  reusing the same Better Auth `updateUser` call `ProfileSettings.tsx` already uses for the
  profile picture. Per explicit user decision, the whole onboarding form — including the name
  field — stays skippable exactly as it was before (ADR-012); an account can still end up keeping
  its phone-number placeholder name if the user skips.
- **Rider photo upload added to onboarding**, reusing the existing `/api/upload` → Cloudinary
  pipeline (`UploadService`) and the same `authClient.updateUser({ image })` pattern as
  `ProfileSettings.tsx` — no new upload route or DB column; the photo is stored on `User.image`,
  the same field the dashboard Settings page already reads/writes.
- **Onboarding form reordered** to match the reference mockup's section order (Vehicle details →
  Rider profile → Driving licence → Address → Emergency contacts → Government ID → Riding
  details). `RiderProfileExtraFields` (`components/shared/RiderProfileExtraFields.tsx`) was
  split into four exported sub-components (`VehicleDetailsFields`, `RiderPersonalFields`,
  `GovernmentIdFields`, `RidingDetailsFields`) so `/onboarding` can interleave them with its own
  Full Name/DL/Address/Emergency-contacts sections in that order; the original combined
  `RiderProfileExtraFields` export is unchanged (same fields, same original order) so the
  Settings "Rider Details" section needed no changes.
- **Panic Button restructured to a modal-based confirm flow**, matching the reference mockup:
  the two cards (`PanicButtonSection.tsx`) are now purely presentational (icon/tagline/category
  badges/channels), and tapping either opens a centered modal overlay instead of expanding an
  inline panel — Red shows a single "Are you sure?" confirm (category defaults to `ACCIDENT`,
  since the mockup's Red flow is one-tap with no picker); Amber shows the same category buttons
  moved into the modal; both fall through to the existing login-required / membership-required /
  sending / success states, now rendered as modal content instead of inline. GPS location is
  captured silently in the background the moment the modal opens (falls back to a small city
  input only if geolocation fails or is denied) rather than requiring the user to tap "share
  location" — same `POST /api/sos/alerts` call, membership gate, and rate limit as before.
- **Panic section moved above the Hero** on the homepage (`apps/web/app/(main)/page.tsx`) —
  per explicit user decision, it's now the first thing a visitor sees, ahead of the marketing
  hero banner.
- **Twilio**: no code change — `SMSService` (ADR-013) already sends real SMS through Twilio's
  REST API whenever `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER` are set, for
  both OTP delivery and SOS alerts. The only actual gap found was that `.env.example` never
  documented those three variables even though the code already reads them — added under the
  "ACTIVE" section. Real delivery still requires a real Twilio account's credentials in
  `apps/web/.env.local`, which is out of scope for a code change.

## ADR-016: Nearby Riders (PostGIS), Google Places "Nearby Help", Firebase push notifications

Per explicit user decision, three previously future-roadmapped features were pulled into scope
on top of the existing Next.js/Vercel/Prisma/Neon stack (no ASP.NET Core/VPS split — ADR-001's
reasoning still holds and was re-confirmed against a competing stack proposal):

- **"Nearby riders within Xkm" un-defers ADR-011's Live Location extension point** (which was
  explicitly descoped — see `.docs/TASKS.md`). New `RiderLocation` model: one row per user,
  `location Unsupported("geography(Point, 4326)")?` (nullable — Prisma has no native geometry
  type, so this column is only ever read/written via `$queryRaw`/`$executeRaw` in
  `rider-location.repository.ts`, never the normal Client API) plus an explicit
  `sharingEnabled` opt-in boolean, default off. The `postgis` extension and this table's GiST
  index (required for `ST_DWithin` to be fast) are **both hand-written into this migration's
  SQL and are permanently invisible to `schema.prisma`/`prisma migrate dev`'s diff engine** —
  do not "clean up" `packages/database/prisma/migrations/20260717094251_add_missing_columns_rider_location_push/migration.sql`
  expecting Prisma to regenerate it correctly; it can't. Consent design: the "nearby riders"
  query (`GET /api/riders/nearby`) self-joins on the *caller's own* location row as the search
  center rather than accepting an external lat/lng — this makes "you must have your own
  location on file (i.e. sharing must be on) to search" a natural side effect of the query
  (`ST_DWithin`/`ST_Distance` against a null geography evaluate to null, filtering out every
  row) rather than a bolted-on rule, and gives reciprocity for free. A `staleMinutes` filter (15
  min) hides abandoned-but-still-"on" rows from query results, and a new cron
  (`GET /api/cron/rider-location-cleanup`, same `Bearer CRON_SECRET` pattern as
  `cron/sos-resolve`) flips `sharingEnabled` off after 30 minutes of no fix, so opting in doesn't
  silently assert consent at the DB level forever after the client stops reporting. Gated behind
  `requireMembership()`, matching the existing SOS "membership perk" precedent.
- **Google Places "Nearby Help"** (petrol pump/mechanic/hospital), a new tab on the existing SOS
  dashboard page (`/dashboard/sos`) rather than a new page — reuses the same
  `navigator.geolocation` capture pattern already in `PanicAlertCards.tsx`. Calls the newer
  Places API (New) v1 `searchNearby` (not the legacy `nearbysearch/json`), server-side only via
  a new `PlacesService` (`GOOGLE_PLACES_API_KEY` never reaches the browser — it's a billable
  key). Cached in the existing Upstash Redis instance on a ~1.1km grid cell (10 min TTL) and
  rate-limited (`enforceRateLimit`), both specifically to bound billing risk from an
  unauthenticated-cost-abuse angle even though the route also sits behind `requireMembership()`.
  No visual map/Maps JS SDK — results are a list with a `google.com/maps/dir` deep link (needs
  no API key), a deliberately smaller scope than a rendered map widget.
- **Firebase Cloud Messaging**, wired into every existing notification type at once by hooking
  the one existing choke point every notification already passes through —
  `NotificationService.notify()` (`packages/services/src/notification.service.ts`) — with a
  fire-and-forget `PushService.sendToUser(...).catch(console.error)` call, rather than adding
  push calls at each of the many call sites (bookings, trip requests, chat, moderation, SOS).
  New `PushSubscription` model (plain, ordinary migration — a user can have multiple
  tokens/devices). Dead tokens (FCM's `messaging/registration-token-not-registered` error code)
  are deleted automatically after a failed send. **Web only for now** — a native Flutter app
  would need `firebase_messaging` and native FCM tokens, a different mechanism than the Web
  SDK/VAPID/service-worker path built here; scoped out as a separate later effort. The static
  `public/firebase-messaging-sw.js` service worker can't read `NEXT_PUBLIC_*` env vars at all
  (only code Next actually builds gets them inlined), so it fetches its config from a new
  `GET /api/firebase-config` route at load time instead of hardcoding values.
- **Not built**: a rendered Google Map anywhere in the app (the `NEXT_PUBLIC_MAPBOX_TOKEN`
  placeholder remains unwired — a visual map, e.g. for the existing unused
  `Trip.meetingLat`/`meetingLng` fields, is a separate future feature), and any push notification
  path for the mobile app.

**Operational note**: applying this migration required resolving pre-existing, unrelated schema
drift on the dev database (a `message_reaction` table, extra `TripStatus` enum values, `message
.metadata`, and `user.lastActiveAt` existed in the live Neon database with no corresponding
migration file — likely from an earlier `prisma db push`). Per explicit user consent (dev-phase,
no real users yet), this was resolved via `prisma migrate reset`, which reseeded the three
standard test accounts but **did not** restore any ad hoc account created outside the seed
script (e.g. a real phone-OTP signup) — those are gone and would need to be recreated.

## ADR-017: "Continue with Google" via Better Auth's `socialProviders`, not Firebase Authentication

The user asked for Google login and initially pasted a Firebase Web SDK config snippet
(`apiKey`/`authDomain`/`projectId`/etc.), believing it was the credential needed. It isn't —
that snippet is Firebase's general app config (used for Cloud Messaging push per ADR-016, and
optionally Analytics), not an OAuth credential. It was used to fill in the previously-blank
`NEXT_PUBLIC_FIREBASE_*` client vars in `apps/web/.env.local` (`apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`,
`projectId` → both `FIREBASE_PROJECT_ID` and `NEXT_PUBLIC_FIREBASE_PROJECT_ID`,
`messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `appId` →
`NEXT_PUBLIC_FIREBASE_APP_ID`) — push *sending* still needs a separate service account key
(`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`) the user hasn't generated yet, so it still uses
the `[Push][DEV]` console fallback until that's added.

Actual Google login is a standard OAuth2 **Better Auth social provider** — added as a
`socialProviders.google` block in `packages/auth/src/server.ts`, using a Google OAuth **Client
ID + Client Secret** from Google Cloud Console (a different credential than the Firebase config
above, obtained from APIs & Services → Credentials → OAuth client ID, redirect URI
`/api/auth/callback/google`). This does **not** involve Firebase Authentication at all — the
existing constraint against using Firebase for auth (Firebase is FCM/Analytics-only, per
ADR-016) is unaffected. No schema migration was needed: `Account` (`schema.prisma:330-348`)
already has `providerId`/`accountId`/`accessToken`/`refreshToken`/`idToken`/`scope` — the
standard Better Auth Prisma-adapter shape for any OAuth provider — and `User.email`/`image`/
`emailVerified` already cover the profile fields Google returns.

Per explicit user decisions:
- **Account linking**: Better Auth's default behavior is used as-is (no `accountLinking`
  override) — a Google sign-in whose email matches an existing account's **verified** email
  signs into that same account rather than creating a duplicate.
- **Placement**: "Continue with Google" appears on both `/login` and `/signup`, above the
  existing phone/OTP and admin-email flows, hidden only during the OTP-entry/partner-upgrade
  sub-steps.
- **Role**: a brand-new Google sign-up always lands as `RENTER` (`user.additionalFields.role`'s
  existing default, `server.ts:75-79`) — the Rider/Partner choice from `/welcome` isn't threaded
  through the OAuth redirect; anyone who wants Partner uses the existing self-service
  `POST /api/user/become-partner` upgrade afterward, same as any phone-signup Rider today.
- **No dev-safe fallback**: unlike SMS/Places/Push, there's no graceful no-op mode for Google
  sign-in — if `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are unset, Better Auth logs a warning
  and simply never registers the `google` provider/callback route; the login/signup UI shows a
  normal error message if the button is clicked in that state rather than assuming a stub exists.

## ADR-018: Mobile color tokens corrected to the live `globals.css`, not `.docs/UI_GUIDELINES.md`

A Phase 1 audit (ahead of bringing `apps/mobile` to feature parity with the current site,
Milestone 8.8) found `apps/mobile/lib/core/theme/app_colors.dart` and
`.docs/UI_GUIDELINES.md` both describe a near-black dark theme (`#0A0E1A` background,
`#111827` card) that predates ADR-009's indigo rebrand — the site itself has moved on and
`apps/web/app/globals.css`'s `.dark` block is the actual shipped palette: background/card/
surface `#26258F`/`#1E1D72`/`#1E1D72`, foreground `#EDF0F7`, accent `#3B3A91` (`--color-accent`,
distinct from `:root`'s light-mode `#26258F`), accent-hover `#2E2D74`. Corrected
`AppColors` to these live values (light-mode tokens also corrected: background `#F0F2F5`,
surface `#E2E6ED`, foreground `#0A1628`, secondary `#182244` — previously generic
slate placeholders, not the site's actual light palette) and added the previously-missing
`darkAccentHover`/`lightAccentHover` pair, wired into `ElevatedButtonThemeData`'s pressed
state. `.docs/UI_GUIDELINES.md` is left as a known-stale doc to be reconciled in a
follow-up docs pass (Milestone 8.9) rather than rewritten mid-mobile-milestone — the runtime
CSS is the source of truth in the meantime, not the doc describing it.
