# BIKIE ? Architecture Decision Records

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
reserved range (`3909?4008`) on a subsequent machine, making it unusable without admin
privileges. SSR internal fetches derive from request headers (not the env var), so the port
remains a local-only convention with no production impact.

## ADR-004: Prisma 7 config split (`prisma.config.ts` + driver adapter)
Prisma 7 removed `datasource.url`; migrations run via `prisma.config.ts` against
Neon's **unpooled** `DIRECT_URL`, while the runtime `PrismaClient` uses
`@prisma/adapter-neon` against the **pooled** `DATABASE_URL`.

## ADR-005: Booking/Review/Trip/Partner modeled as first-class Prisma models
Added in this pass specifically to support seed data and the dashboards. `Partner`
is a profile attached 1:1 to a `User` with `role = PARTNER` (not a separate auth
identity) ? one account, a partner profile unlocks partner-mode UI, matching the
"one account, multiple modes" principle from the original product vision.

## ADR-006: Font substitution ? Geist Sans + Inter instead of Satoshi/General Sans
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
route-handler changes ? cookie and bearer auth now work side by side against the same API.

## ADR-008: Flutter font ? Inter, bundled locally (not `google_fonts` runtime fetch)
No Flutter/Dart package exists for Geist Sans (see ADR-006 for why the web uses it), so the
Flutter app uses Inter instead ? closest available geometric-grotesque match, same
rationale as ADR-006. Initially wired up via the `google_fonts` package's default runtime
fetch (downloads the TTF from fonts.gstatic.com on first use); this **crashed the app**
during Phase 1 verification on a fresh Android emulator with no general internet DNS
(reachable the host loopback for API calls, but not `fonts.gstatic.com`) ? a realistic
failure mode for any device that's offline or on a restricted network at first launch, not
just an emulator artifact. Fixed by downloading `Inter[opsz,wght].ttf` (OFL-licensed, from
Google's official `google/fonts` GitHub repo) and bundling it directly as
`apps/mobile/assets/fonts/Inter-Variable.ttf`, declared in `pubspec.yaml`'s `fonts:`
section ? zero runtime network dependency for text rendering.

## ADR-009: Brand accent changed to indigo (`#3B3A91`), split into fill vs. text tokens
Requested rebrand from the orange CTA accent to `#3B3A91` across both web and mobile.
`#3B3A91` contrasts well as a solid fill with white text (~7.5:1) and as text against the
light-mode background (~9.8:1), but as text/icon color against the dark-mode background
(the default theme, ADR-002) it's only ~1.8:1 ? well under WCAG AA's 4.5:1 minimum. Rather
than accept that regression or water down the requested color, the accent was split into
two tokens: `--color-accent` (`#3B3A91` literal, for solid fills ? buttons, badges, avatar
and chat-bubble backgrounds) and `--color-accent-text` (`#3B3A91` in light mode, `#8482D6`
? a lighter tint of the same hue ? in dark mode, for links/labels/star-ratings/badge text).
Web: Tailwind classes `bg-accent` vs. `text-accent-text` (swapped project-wide from the
prior single `text-accent`). Mobile: `Theme.of(context).colorScheme.primary` for fills vs.
`AppTheme.accentTextOf(context)` for text/icons.

## ADR-010: Rides ? request/approve join, keep the `Trip` model name, reuse `Conversation` for group chat, defer reputation/badges/tiers/clubs
Product direction shifted from "rent a bike" toward "find riders, plan adventures, ride
together" ? a community layer on top of the existing `Trip` concept (which previously had no
working join mechanism at all; the web "Join Trip" button was a literal no-op stub). Four
scoped decisions, each chosen to minimize new surface area:
- **Keep `Trip`/`TripParticipant` as the model names** (DB table, API routes, DTOs) and only
  relabel user-facing copy to "Ride"/"Rides". A full rename would touch the DB schema, every
  route path, the DTOs, and the already-working Flutter trip screens for zero functional
  gain ? Prisma model names aren't user-visible.
- **Request-then-approve, not instant join.** `ParticipantStatus` changed from
  `JOINED | CANCELLED` to `PENDING | APPROVED | REJECTED | CANCELLED` (migration:
  `packages/database/prisma/migrations/20260710120000_ride_request_flow` ? the 2 existing
  `JOINED` rows in the live DB were remapped to `APPROVED` inline during the enum type swap).
  `seatsTotal`/`seatsLeft` unchanged; `seatsLeft` now decrements atomically on approval
  instead of on request.
- **Reuse `Conversation`/`ConversationParticipant`/`Message` for the "Ride Group" chat**
  instead of a new `RideChat` model ? those models already support N participants with zero
  schema changes (only addition: a nullable `Conversation.tripId` FK). See ARCHITECTURE.md.
- **Deferred to a later pass, not built now:** rider-to-rider reviews (the existing `Review`
  model is hard-locked to `Bike`+`Booking`, can't flex ? would need a new `RideReview` model),
  badges, membership tiers (Guest/Member/Verified Member ? membership today is binary
  active/inactive, reused as-is via the existing `requireMembership()` gate for ride
  creation), and clubs. Reputation in v1 is a simple computed stat
  (`ridesOrganized`/`requestsSent`/`requestsApproved`/`ridesCancelled`/`approvalRate`), not a
  stored field.

## ADR-011: Community Platform v2 ? Groups/Communities/Clubs/Events terminology, Ride Room composition, message encryption, moderation, realtime

A full-project audit (before Milestone 8) confirmed `Communities`, `Groups`, `Clubs`,
`Events`, `Reports`, `Moderation`, `Notification` had **no Prisma models at all** ? not
missing UI, missing data models ? while the spec listed them as five separate
admin-manageable concepts alongside the existing `Trip`-based Rides. Seven scoped decisions,
continuing ADR-010's "reuse over new surface area" precedent:

- **`Group` is one new model** (`Group` + `GroupMember`, `GroupType { COMMUNITY, CLUB }`),
  not three. Admin nav "Groups" = full CRUD table; "Communities"/"Clubs" are the same table
  pre-filtered by `type`, not separate models or pages. Reuses `Conversation`/`Message` for
  group chat via a nullable unique `Group.conversationId` ? identical shape to
  `Trip.conversation`, zero new chat infrastructure.
- **User-facing Group creation/joining is deferred (Milestone 8b).** Nothing in the
  functional spec describes a user creating or requesting to join a persistent group, only
  rides. Groups ship admin-seeded only in this pass ? the same posture `Destination`,
  `Category`, and `Testimonial` already have (admin-created-only content, no user-facing
  creation flow). A future request/approve flow can reuse `TripParticipant`'s
  `PENDING ? APPROVED|REJECTED` pattern directly.
- **"Events" is a new `TripType` enum value (`EVENT`), not a new model.** Same shape as a
  Ride (title, date range, location, capacity, organizer) ? a separate `Event` model would
  duplicate `Trip` for zero structural gain, the exact anti-pattern ADR-010 already rejected
  once. Admin "Events" nav is `/admin/trips?type=EVENT`, reusing the Trips admin page.
- **Ride Room is a composition, not a new top-level entity**: the existing `Trip` ?
  `Conversation` pair (ADR-010) plus a new `Announcement` model, `Trip.emergencyContacts`
  (`Json?`, following the existing `Bike.gallery: String[]`/`MembershipPlan.benefits: String[]`
  precedent for small structured lists that don't need their own table), `Trip.meetingLat`/
  `meetingLng`, and "Shared Media" as a filtered view over `MessageAttachment` joined through
  the room's conversation ? not a parallel media-library table. One shared guard function
  (`assertRideRoomAccess`) is called on every Ride Room route: Organizer + Approved Riders +
  Admin only. Polls and Live Location are explicitly deferred (documented extension points:
  `MessageType.POLL`, `Trip.liveLocationEnabled`), not built now.
- **Message encryption: AES-256-GCM via Node's built-in `crypto`, server-only key.** New env
  var `MESSAGE_ENCRYPTION_KEY` (32-byte base64), same posture as `BETTER_AUTH_SECRET` ? no
  KMS, no new npm dependency for crypto itself. `message.repository.ts` stays a dumb
  ciphertext-in/ciphertext-out store (per the existing layering rule); `message.service.ts`
  (+ new `lib/message-crypto.ts`) owns encrypt-on-write/decrypt-on-read, including the admin
  moderation decrypt path ? which goes through the *same* `getMessages` call as every other
  read, gated by a role branch and an `logAdminAction("VIEW_CONVERSATION")` audit write, not
  a separate code path that could drift out of sync. Deleting a message nulls
  `ciphertext`/`iv`/`authTag`/`content` outright (true erasure), not a soft-delete flag.
- **Realtime: Upstash Redis, REST-client inbox-drain ? not raw TCP `SUBSCRIBE`.** The
  existing `apps/web/lib/sse-manager.ts` in-process `Map` is confirmed broken across
  Vercel's independent serverless function instances (ADR-001). Vercel functions can't hold
  long-lived TCP subscriptions cleanly, so `@upstash/redis`'s REST client (not `ioredis`) is
  used: each user gets an `inbox:<userId>` Redis list, publishers `RPUSH`, the SSE route
  drains+deletes on a 2s poll. This list-per-user design is also the authorization
  boundary ? there is no shared "conversation channel" an unauthorized listener could
  subscribe to. Mobile has no SSE client and stays on polling (tightened to 3s for an open
  Ride Room thread), per the existing Milestone 6b decision.
- **Moderation state: hybrid `User.accountStatus` (denormalized fast-path) + `ModerationAction`
  (audit-trail source of truth), on top of the existing `AuditLog`, not instead of it.**
  `AuditLog`/`logAdminAction()` remains the generic cross-feature ledger (unchanged, still
  feeds CSV export and the Audit Logs page); `ModerationAction` is the trust-and-safety-specific
  state machine with `expiresAt` semantics (mute/suspend durations) that hot paths
  (`requireSession`, `sendMessage`) query directly, without joining history on every request.

## ADR-012: Rider profile onboarding ? new `RiderProfile`/`RiderEmergencyContact` models, skippable gate, no Aadhaar/KYC verification
A client meeting requested an extensive KYC-style post-signup form (vehicle details, Aadhaar
number + OTP verification, driving licence, address, medical history, emergency contacts).
Scoped down, per explicit user decision, to what the app can actually back today:
- **New `RiderProfile` (1:1 with `User`) + `RiderEmergencyContact` (many, cascade-deleted with
  the profile)** ? driving licence number/expiry, address (line/area/district/pincode/country),
  and 0-3 emergency contacts. Named distinctly from the existing ride-level
  `Trip.emergencyContacts`/`EmergencyContactDTO` (Ride Room, ADR-011) ? this is a *profile*-level
  concept, a different thing that happens to share a name; kept as separate models rather than
  reusing the Ride Room shape, since a rider's own contacts aren't scoped to any one ride.
- **No Aadhaar/government-ID verification.** UIDAI doesn't allow direct third-party Aadhaar
  integration ? real verification needs a licensed vendor, a cost/compliance decision, not a
  code change. Not built; the form only collects driving-licence-style fields the app already
  has a reason to show back to the user (e.g. on the Settings page).
- **Skippable, not mandatory.** `RiderProfile.onboardingSkipped` (boolean) plus the mere
  existence of a `RiderProfile` row is how `RiderProfileService.needsOnboarding()` decides
  whether to show the gate again ? a user who explicitly skips gets an (mostly empty) row
  written so they aren't re-prompted every login, distinct from a user who was never asked yet
  (no row at all).
- **No mobile+OTP login** in this pass either (a separate, larger ask from the same meeting) ?
  real OTP delivery needs an SMS provider (Twilio/MSG91/etc.), and none is configured
  (`apps/web/.env.local` has no SMS vendor, only email via Resend). Deferred until a provider
  is chosen; email/password (plus the existing bearer-token mobile auth) is unchanged.

## ADR-013: Mobile number + OTP login, for both Rider and Partner ? Better Auth's `phoneNumber` plugin, console-logged OTP until a real SMS vendor is chosen
Follow-up to ADR-012, once the SMS-provider question came back "build it now anyway." Three
decisions:
- **Better Auth's built-in `phoneNumber` plugin** (already present in the installed
  `better-auth` version, no new dependency) rather than hand-rolling OTP storage/expiry/retry
  logic ? it owns OTP generation, expiry (5 min), and attempt-limiting (3 tries), and exposes
  `POST /phone-number/send-otp` / `POST /phone-number/verify`. `signUpOnVerification` auto-
  creates the `User` row on a brand-new phone number's first successful verification (with a
  placeholder email/name ? see `tempEmailForPhone`/`getTempName` in `packages/auth/src/server.ts`),
  auto-logging them in with a session in the same call. New `User.phoneNumber` (unique) /
  `phoneNumberVerified` columns are the plugin's own required schema, added alongside ? not
  merged into ? the pre-existing plain `User.phone` field (used by SOS profile-completeness
  and the mobile app before this ADR), which a `callbackOnVerification` hook keeps in sync so
  none of those existing call sites needed to change.
- **OTP delivery reuses the existing `SMSService`** (`packages/services/src/sms.service.ts`)
  rather than a new one ? it already has the exact dev-safe posture needed: if
  `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER` aren't set, it logs
  `[SMS][DEV] To: ... | Message: ...` to the server console instead of failing. Per explicit
  user decision, that's the shipped behavior for now ? real SMS delivery is a one-time env-var
  addition away, no code change, whenever a Twilio (or compatible) account is set up.
  Email/password sign-in is unchanged server-side and still works side by side ? **but the
  first pass of `/login` replaced the UI wholesale with phone/OTP fields and lost the only UI
  path to it**, which would have locked out the seeded admin account (`admin@bikie.app`,
  created via email/password, no `phoneNumber` set ? admins aren't created through the public
  phone-based signup at all). Fixed by adding an "Admin or existing email account? Log in with
  email instead" toggle on `/login` (not `/signup`, which stays phone-only by design ? new
  account creation is the part that moved to OTP, not every login path).
- **Role upgrade (Rider ? Partner) is self-service, not admin-approved**: an existing user can
  sign back in via the same phone number through the Partner path on `/welcome`, then supply
  business details, which calls the new `POST /api/user/become-partner` ? sets `User.role` to
  `PARTNER` and upserts a `Partner` profile in one step (`UserService.becomePartner`, guarded
  to refuse if already `PARTNER`/`ADMIN`). This is a narrower, explicitly-scoped version of the
  "one account, multiple modes" principle from ADR-005 ? a real admin-reviewed partner
  application queue (the existing signup flow's "will be reviewed by our team" copy) is a
  separate, larger feature not built here.

## ADR-014: Onboarding field list from a second reference doc ? fields only, not the doc's parallel schema
A second reference document arrived with its own full technical spec (`Biker`/`Provider`/
`Trip`/`Booking`/`PanicAlert` Prisma models, NextAuth-based auth, a different API surface) ?
a complete, different design for the same product, not a diff against what's actually built.
Per explicit user confirmation ("I just want onboarding from this"), only the onboarding field
*list* was adopted, layered onto the existing models ? the doc's architecture was not adopted:
- **`RiderProfile` gains**: `fatherName`/`motherName`, `dateOfBirth`, `gender`, `bloodGroup`,
  `medicalHistory`, `allergies`, `vehicleType`/`vehicleBrand`/`vehicleModel`, a
  `GovernmentIdType` (`AADHAAR | PASSPORT`) + `governmentIdNumber` (raw text, no verification ?
  same reasoning as ADR-012: real Aadhaar verification needs a licensed vendor, not a code
  change), `RiderFrequency` (`OCCASIONAL | WEEKLY | DAILY`, named to avoid colliding with any
  future "rider type" concept), and `RidingClubType` (`SOLO | CLUB_MEMBER`) + `clubName`. All
  optional, all part of the existing skippable onboarding gate (ADR-012) ? not a new gate.
- **`Partner` gains**: `aadhaarNumber` and two optional contact-person name/mobile pairs. The
  reference doc's `ServiceType` enum (Rental/Mechanic/Fuel/Puncture/Medical/Towing/Multi-service)
  was deliberately **not** adopted in place of the existing `PartnerType` enum (Rental/Mechanic/
  Fuel Delivery/Tour Guide/Hotel/Camping/Accessories/Photography) ? swapping it would silently
  drop categories the current `/partners/services` marketing page already advertises; that's a
  business-scope decision, not something to infer from a reference doc.
- **What was explicitly not built**: a parallel `Biker`/`Provider` model set, a separate
  `PanicAlert` system (the existing `SOSAlert` Red/Amber-equivalent flow already exists),
  `RentalRequest`/`RentalResponse` marketplace matching, or a `Trip`/`TripOption`/`TripMember`
  redesign (the existing `Trip`/`TripParticipant` ? Rides ? already covers this per ADR-010).
  These would replace working systems for no stated gain; revisit only if a real gap in the
  *existing* systems is identified, not because a reference doc modeled the same idea twice.
- **`/welcome` flow**: role selection no longer drops the visitor straight onto the
  homepage/marketing page ? both paths now route to `/login` (which already offers a
  "no account yet? sign up" fallback), so a role is chosen *and then* the visitor authenticates
  before seeing any dashboard content. Anonymous marketing-site browsing without picking a role
  is unaffected (the role cookie is separate from being logged in).

## ADR-015: Name moves from the OTP signup step to the onboarding/partner-onboarding form; Panic UI becomes modal-based and moves above the Hero
Per a third reference doc (a full rider-registration mockup) plus explicit user instructions:
- **Full name is no longer collected on `/signup`'s OTP step.** It previously appeared inline
  in the OTP-entry form for brand-new phone numbers and was sent to
  `PATCH /api/user/complete-phone-signup` alongside the chosen role. That endpoint's `name`
  field is now optional (`completePhoneSignupSchema`, `UserService.completePhoneSignup`) ? the
  call is still made immediately after OTP verify, but now only to apply the Rider/Partner role
  picked on `/welcome`; the account keeps Better Auth's placeholder name (the raw phone number,
  `getTempName`) until the user reaches onboarding. Name is instead collected as a plain field
  in the "Rider profile" section of `/onboarding` (and a new "Your details" section on
  `/partner-onboarding`, since both roles share the same OTP step), saved via
  `authClient.updateUser({ name, image })` directly from the client ? no new backend route,
  reusing the same Better Auth `updateUser` call `ProfileSettings.tsx` already uses for the
  profile picture. Per explicit user decision, the whole onboarding form ? including the name
  field ? stays skippable exactly as it was before (ADR-012); an account can still end up keeping
  its phone-number placeholder name if the user skips.
- **Rider photo upload added to onboarding**, reusing the existing `/api/upload` ? Cloudinary
  pipeline (`UploadService`) and the same `authClient.updateUser({ image })` pattern as
  `ProfileSettings.tsx` ? no new upload route or DB column; the photo is stored on `User.image`,
  the same field the dashboard Settings page already reads/writes.
- **Onboarding form reordered** to match the reference mockup's section order (Vehicle details ?
  Rider profile ? Driving licence ? Address ? Emergency contacts ? Government ID ? Riding
  details). `RiderProfileExtraFields` (`components/shared/RiderProfileExtraFields.tsx`) was
  split into four exported sub-components (`VehicleDetailsFields`, `RiderPersonalFields`,
  `GovernmentIdFields`, `RidingDetailsFields`) so `/onboarding` can interleave them with its own
  Full Name/DL/Address/Emergency-contacts sections in that order; the original combined
  `RiderProfileExtraFields` export is unchanged (same fields, same original order) so the
  Settings "Rider Details" section needed no changes.
- **Panic Button restructured to a modal-based confirm flow**, matching the reference mockup:
  the two cards (`PanicButtonSection.tsx`) are now purely presentational (icon/tagline/category
  badges/channels), and tapping either opens a centered modal overlay instead of expanding an
  inline panel ? Red shows a single "Are you sure?" confirm (category defaults to `ACCIDENT`,
  since the mockup's Red flow is one-tap with no picker); Amber shows the same category buttons
  moved into the modal; both fall through to the existing login-required / membership-required /
  sending / success states, now rendered as modal content instead of inline. GPS location is
  captured silently in the background the moment the modal opens (falls back to a small city
  input only if geolocation fails or is denied) rather than requiring the user to tap "share
  location" ? same `POST /api/sos/alerts` call, membership gate, and rate limit as before.
- **Panic section moved above the Hero** on the homepage (`apps/web/app/(main)/page.tsx`) ?
  per explicit user decision, it's now the first thing a visitor sees, ahead of the marketing
  hero banner.
- **Twilio**: no code change ? `SMSService` (ADR-013) already sends real SMS through Twilio's
  REST API whenever `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER` are set, for
  both OTP delivery and SOS alerts. The only actual gap found was that `.env.example` never
  documented those three variables even though the code already reads them ? added under the
  "ACTIVE" section. Real delivery still requires a real Twilio account's credentials in
  `apps/web/.env.local`, which is out of scope for a code change.

## ADR-016: Nearby Riders (PostGIS), Google Places "Nearby Help", Firebase push notifications

Per explicit user decision, three previously future-roadmapped features were pulled into scope
on top of the existing Next.js/Vercel/Prisma/Neon stack (no ASP.NET Core/VPS split ? ADR-001's
reasoning still holds and was re-confirmed against a competing stack proposal):

- **"Nearby riders within Xkm" un-defers ADR-011's Live Location extension point** (which was
  explicitly descoped ? see `.docs/TASKS.md`). New `RiderLocation` model: one row per user,
  `location Unsupported("geography(Point, 4326)")?` (nullable ? Prisma has no native geometry
  type, so this column is only ever read/written via `$queryRaw`/`$executeRaw` in
  `rider-location.repository.ts`, never the normal Client API) plus an explicit
  `sharingEnabled` opt-in boolean, default off. The `postgis` extension and this table's GiST
  index (required for `ST_DWithin` to be fast) are **both hand-written into this migration's
  SQL and are permanently invisible to `schema.prisma`/`prisma migrate dev`'s diff engine** ?
  do not "clean up" `packages/database/prisma/migrations/20260717094251_add_missing_columns_rider_location_push/migration.sql`
  expecting Prisma to regenerate it correctly; it can't. Consent design: the "nearby riders"
  query (`GET /api/riders/nearby`) self-joins on the *caller's own* location row as the search
  center rather than accepting an external lat/lng ? this makes "you must have your own
  location on file (i.e. sharing must be on) to search" a natural side effect of the query
  (`ST_DWithin`/`ST_Distance` against a null geography evaluate to null, filtering out every
  row) rather than a bolted-on rule, and gives reciprocity for free. A `staleMinutes` filter (15
  min) hides abandoned-but-still-"on" rows from query results, and a new cron
  (`GET /api/cron/rider-location-cleanup`, same `Bearer CRON_SECRET` pattern as
  `cron/sos-resolve`) flips `sharingEnabled` off after 30 minutes of no fix, so opting in doesn't
  silently assert consent at the DB level forever after the client stops reporting. Gated behind
  `requireMembership()`, matching the existing SOS "membership perk" precedent.
- **Google Places "Nearby Help"** (petrol pump/mechanic/hospital), a new tab on the existing SOS
  dashboard page (`/dashboard/sos`) rather than a new page ? reuses the same
  `navigator.geolocation` capture pattern already in `PanicAlertCards.tsx`. Calls the newer
  Places API (New) v1 `searchNearby` (not the legacy `nearbysearch/json`), server-side only via
  a new `PlacesService` (`GOOGLE_PLACES_API_KEY` never reaches the browser ? it's a billable
  key). Cached in the existing Upstash Redis instance on a ~1.1km grid cell (10 min TTL) and
  rate-limited (`enforceRateLimit`), both specifically to bound billing risk from an
  unauthenticated-cost-abuse angle even though the route also sits behind `requireMembership()`.
  No visual map/Maps JS SDK ? results are a list with a `google.com/maps/dir` deep link (needs
  no API key), a deliberately smaller scope than a rendered map widget.
- **Firebase Cloud Messaging**, wired into every existing notification type at once by hooking
  the one existing choke point every notification already passes through ?
  `NotificationService.notify()` (`packages/services/src/notification.service.ts`) ? with a
  fire-and-forget `PushService.sendToUser(...).catch(console.error)` call, rather than adding
  push calls at each of the many call sites (bookings, trip requests, chat, moderation, SOS).
  New `PushSubscription` model (plain, ordinary migration ? a user can have multiple
  tokens/devices). Dead tokens (FCM's `messaging/registration-token-not-registered` error code)
  are deleted automatically after a failed send. **Web only for now** ? a native Flutter app
  would need `firebase_messaging` and native FCM tokens, a different mechanism than the Web
  SDK/VAPID/service-worker path built here; scoped out as a separate later effort. The static
  `public/firebase-messaging-sw.js` service worker can't read `NEXT_PUBLIC_*` env vars at all
  (only code Next actually builds gets them inlined), so it fetches its config from a new
  `GET /api/firebase-config` route at load time instead of hardcoding values.
- **Not built**: a rendered Google Map anywhere in the app (the `NEXT_PUBLIC_MAPBOX_TOKEN`
  placeholder remains unwired ? a visual map, e.g. for the existing unused
  `Trip.meetingLat`/`meetingLng` fields, is a separate future feature), and any push notification
  path for the mobile app.

**Operational note**: applying this migration required resolving pre-existing, unrelated schema
drift on the dev database (a `message_reaction` table, extra `TripStatus` enum values, `message
.metadata`, and `user.lastActiveAt` existed in the live Neon database with no corresponding
migration file ? likely from an earlier `prisma db push`). Per explicit user consent (dev-phase,
no real users yet), this was resolved via `prisma migrate reset`, which reseeded the three
standard test accounts but **did not** restore any ad hoc account created outside the seed
script (e.g. a real phone-OTP signup) ? those are gone and would need to be recreated.

## ADR-017: "Continue with Google" via Better Auth's `socialProviders`, not Firebase Authentication

The user asked for Google login and initially pasted a Firebase Web SDK config snippet
(`apiKey`/`authDomain`/`projectId`/etc.), believing it was the credential needed. It isn't ?
that snippet is Firebase's general app config (used for Cloud Messaging push per ADR-016, and
optionally Analytics), not an OAuth credential. It was used to fill in the previously-blank
`NEXT_PUBLIC_FIREBASE_*` client vars in `apps/web/.env.local` (`apiKey` ? `NEXT_PUBLIC_FIREBASE_API_KEY`,
`projectId` ? both `FIREBASE_PROJECT_ID` and `NEXT_PUBLIC_FIREBASE_PROJECT_ID`,
`messagingSenderId` ? `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `appId` ?
`NEXT_PUBLIC_FIREBASE_APP_ID`) ? push *sending* still needs a separate service account key
(`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`) the user hasn't generated yet, so it still uses
the `[Push][DEV]` console fallback until that's added.

Actual Google login is a standard OAuth2 **Better Auth social provider** ? added as a
`socialProviders.google` block in `packages/auth/src/server.ts`, using a Google OAuth **Client
ID + Client Secret** from Google Cloud Console (a different credential than the Firebase config
above, obtained from APIs & Services ? Credentials ? OAuth client ID, redirect URI
`/api/auth/callback/google`). This does **not** involve Firebase Authentication at all ? the
existing constraint against using Firebase for auth (Firebase is FCM/Analytics-only, per
ADR-016) is unaffected. No schema migration was needed: `Account` (`schema.prisma:330-348`)
already has `providerId`/`accountId`/`accessToken`/`refreshToken`/`idToken`/`scope` ? the
standard Better Auth Prisma-adapter shape for any OAuth provider ? and `User.email`/`image`/
`emailVerified` already cover the profile fields Google returns.

Per explicit user decisions:
- **Account linking**: Better Auth's default behavior is used as-is (no `accountLinking`
  override) ? a Google sign-in whose email matches an existing account's **verified** email
  signs into that same account rather than creating a duplicate.
- **Placement**: "Continue with Google" appears on both `/login` and `/signup`, above the
  existing phone/OTP and admin-email flows, hidden only during the OTP-entry/partner-upgrade
  sub-steps.
- **Role**: a brand-new Google sign-up always lands as `RENTER` (`user.additionalFields.role`'s
  existing default, `server.ts:75-79`) ? the Rider/Partner choice from `/welcome` isn't threaded
  through the OAuth redirect; anyone who wants Partner uses the existing self-service
  `POST /api/user/become-partner` upgrade afterward, same as any phone-signup Rider today.
- **No dev-safe fallback**: unlike SMS/Places/Push, there's no graceful no-op mode for Google
  sign-in ? if `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are unset, Better Auth logs a warning
  and simply never registers the `google` provider/callback route; the login/signup UI shows a
  normal error message if the button is clicked in that state rather than assuming a stub exists.

## ADR-018: Mobile color tokens corrected to the live `globals.css`, not `.docs/UI_GUIDELINES.md`

A Phase 1 audit (ahead of bringing `apps/mobile` to feature parity with the current site,
Milestone 8.8) found `apps/mobile/lib/core/theme/app_colors.dart` and
`.docs/UI_GUIDELINES.md` both describe a near-black dark theme (`#0A0E1A` background,
`#111827` card) that predates ADR-009's indigo rebrand ? the site itself has moved on and
`apps/web/app/globals.css`'s `.dark` block is the actual shipped palette: background/card/
surface `#26258F`/`#1E1D72`/`#1E1D72`, foreground `#EDF0F7`, accent `#3B3A91` (`--color-accent`,
distinct from `:root`'s light-mode `#26258F`), accent-hover `#2E2D74`. Corrected
`AppColors` to these live values (light-mode tokens also corrected: background `#F0F2F5`,
surface `#E2E6ED`, foreground `#0A1628`, secondary `#182244` ? previously generic
slate placeholders, not the site's actual light palette) and added the previously-missing
`darkAccentHover`/`lightAccentHover` pair, wired into `ElevatedButtonThemeData`'s pressed
state. `.docs/UI_GUIDELINES.md` is left as a known-stale doc to be reconciled in a
follow-up docs pass (Milestone 8.9) rather than rewritten mid-mobile-milestone ? the runtime
CSS is the source of truth in the meantime, not the doc describing it.

## ADR-019: Mobile auth rebuilt as a mandatory Splash ? Intro ? Welcome ? Phone-OTP-Login gate; default API target moved to the live `https://bikie.app`

Per explicit user direction, treated as the most urgent outstanding mobile gap. Three
changes:

- **Full pre-auth gate, not free browsing.** `apps/mobile` previously let an unauthenticated
  visitor land straight on Home/Bikes with no onboarding at all, and its `/login`/`/signup`
  were still email/password-only ? never updated after the web moved to phone+OTP as the
  primary flow (ADR-013). The web itself still allows anonymous marketing browsing (ADR-014);
  mobile now deliberately does **not** ? every route except `/intro`, `/welcome`, `/login`,
  `/signup` requires a session (`app_router.dart`'s `redirect`), by explicit product decision
  for this platform, not an oversight or a divergence to be reconciled later. New
  `apps/mobile/lib/features/onboarding/` (mobile-only, no web equivalent): `SplashScreen`
  (shown in `main.dart` while `AuthController.bootstrap()` resolves, replacing a bare spinner),
  `IntroScreen` (first-launch-only 3-slide carousel, gated on a new `AppPreferences`
  (`SharedPreferences`) flag distinct from `SecureStorage`, which stays reserved for the
  bearer token), `WelcomeScreen` (ports the web's `/welcome` role cards ? "I'm a Biker" /
  "Service Provider" ? both leading to `/login`, matching ADR-014's redirect-to-login-not-signup
  behavior exactly, via a new `selectedRoleProvider`).
- **Phone + OTP via Better Auth's `phoneNumber` plugin, called directly** ? no Dart client
  exists for this plugin, so `AuthRepository` calls the raw REST endpoints found in
  `node_modules/better-auth`'s `plugins/phone-number/routes.mjs`: `POST
  /api/auth/phone-number/send-otp` `{phoneNumber}` and `POST /api/auth/phone-number/verify`
  `{phoneNumber, code}`. The verify response carries the session token in its **JSON body's
  `token` field** (Better Auth's own documented shape for this endpoint) rather than the
  `set-auth-token` header the email routes use ? `AuthRepository.verifyOtp` reads it from
  there instead. `GET /api/auth-helpers/phone-exists` (pre-OTP existence check, login flow
  only) and `PATCH /api/user/complete-phone-signup` (role application, brand-new numbers only)
  are wired the same as web. Email/password sign-in is kept as a same-screen fallback toggle
  ("Admin or existing email account? Log in with email instead") for the identical reason web
  keeps it ? the seeded `admin@bikie.app` account has no `phoneNumber` at all.
  **Deliberately not ported**: the mid-login "existing Rider signs in via the Partner path
  ? show a Become-a-Partner mini-form" upgrade step (ADR-013's self-service upgrade edge
  case), and the post-signup rider-profile `/onboarding` form (ADR-012/014/015's large field
  set) ? a brand-new mobile signup goes straight to Home with just the chosen role applied,
  keeping Better Auth's phone-number placeholder name until a future Settings/onboarding
  milestone. Both are separate, larger features, not silently dropped scope.
- **Default API target changed to the live production site.** `app_config.dart` previously
  had no production fallback at all ? release builds threw unless `--dart-define=API_BASE_URL`
  was passed, because the production Vercel deploy genuinely lagged `origin/master` on several
  routes at the time (Milestone 6). Per explicit user confirmation that `https://bikie.app` is
  now live, and independent verification in this pass (`GET /api/bikes/featured` ? 200 with
  real bike data), both debug and release builds now default to `https://bikie.app` with no
  `--dart-define` needed. `--dart-define=API_BASE_URL=http://10.0.2.2:4000` (or the LAN-IP/
  localhost equivalents) still overrides it for local `pnpm dev` iteration.

## ADR-018: SOS multi-channel fan-out (SMS / WhatsApp / Email)

- **Context.** The Panic Button UI already promised SMS, WhatsApp, fellow riders, and service
  providers, but `POST /api/sos/alerts` only persisted the alert, published an SSE event, and
  emailed the *reporter*. Emergency contacts and Twilio `sendSOSAlert` existed but were never
  called from the create path.
- **Decision.** Introduce `SOSDispatchService.fanOut` as the single post-create side-effect
  owner. Recipients: nearby riders (new PostGIS `findNearbyAroundPoint` around the alert's
  own lat/lng ? not the reporter's sharing consent), same-city `Partner` rows (+ contact
  person mobiles), `RiderEmergencyContact` rows, and optional `SOS_EMERGENCY_SERVICES_*`
  env targets. Channels: `SMSService`, new `WhatsAppService` (Twilio WhatsApp),
  `EmailService`, plus `NotificationService.notify(..., "SOS_ALERT")` for platform users.
  Unset credentials keep the existing `[DEV]` console fallback so E2E works before go-live.
- **Consequences.** Going live is an env swap only (superseded in part by ADR-020). Seed fixtures cover membership, Bangalore
  partner phones, two nearby riders with GPS, and emergency contacts ? see
  `project doc/SOS_E2E_TESTING.md`.

## ADR-020: SOS email/WhatsApp send directly (SMTP + Meta Cloud API), with per-recipient delivery results

- **Context.** ADR-018 shipped the fan-out behind Resend (email) and Twilio (WhatsApp). Neither
  could be exercised locally without signing up for a reseller, so local tests only ever
  produced `[DEV]` logs, and the API's `dispatch` summary counted *attempts* ? it could not
  distinguish "provider accepted it" from "no credentials, nothing happened".
- **Decision.** Send over the lowest-level transport each channel offers.
  - Email: plain SMTP via `nodemailer` (`SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`), so a personal
    Gmail App Password is enough to deliver for real. Resend stays as a fallback for hosted
    environments and is only consulted when SMTP is unconfigured.
  - WhatsApp: Meta's own WhatsApp Cloud API (`WHATSAPP_ACCESS_TOKEN` +
    `WHATSAPP_PHONE_NUMBER_ID`), which also unlocks the native **location message** ? the same
    card a person sends via Attach ? Location ? alongside the text. Twilio's WhatsApp channel
    drops to a fallback. Outside the 24h customer-service window the send is retried as an
    approved template when `WHATSAPP_TEMPLATE_NAME` is set.
  - With no credentials at all, WhatsApp emits a `wa.me` click-to-send deep link (logged and
    returned as `whatsappClickToSend`) so an alert can still be delivered by hand in testing.
- **Consequences.** `SMSService`/`EmailService`/`WhatsAppService` now return
  `{ ok, provider, error }` instead of `void`, and `SOSDispatchSummary` gained `smsSent`,
  `whatsappSent`, `emailSent`, `whatsappClickToSend`, and `errors` carrying the provider's own
  rejection text. `nodemailer` is listed in `serverExternalPackages` because it opens raw TCP
  sockets and must not be bundled.

## ADR-021: Communications ports/adapters + Vitest foundation (modular monolith Phase 1–2)

- **Context.** The modular-monolith prompt requires hexagonal boundaries and tests before
  broad refactors. SMS/email/WhatsApp/push logic lived as concrete singletons with vendor
  HTTP and env selection inside `@bikie/services`, and SOS dispatch queried `prisma.partner`
  directly.
- **Decision.** Introduce `packages/services/src/modules/communications` with
  `EmailPort`/`SmsPort`/`WhatsAppPort`/`PushPort`, SMTP/Resend/Twilio/Meta/FCM adapters, and
  `createCommunicationsPorts()` composition. Keep `EmailService`/`SMSService`/
  `WhatsAppService`/`PushService` as compatibility facades. SOS fan-out injects the ports and
  uses `partnerRepository.findPartnersByCityForDispatch` instead of Prisma in the service.
  Add Vitest (`pnpm test`) with characterization tests for phone/map helpers and DEV
  adapter fallbacks. Provider HTTP calls use a shared timeout (`PROVIDER_HTTP_TIMEOUT_MS`,
  default 10s).
- **Consequences.** Existing import paths and API contracts are unchanged. Later modules
  (safety-location, identity, bookings) follow the same Strangler pattern. Do not add
  Kafka/JWT/CQRS in this pass.

## ADR-022: Safety-location module extraction (modular monolith Phase 3)

- **Context.** SOS CRUD, dispatch fan-out, rider location, and Places lived as flat services
  importing `@bikie/database` repositories and (for Places) Google/Redis vendors directly.
  Phase 3 of the Strangler plan migrates this bounded context without changing business
  rules or `/api/*` contracts.
- **Decision.** Introduce `packages/services/src/modules/safety-location` with:
  - domain: map URL helpers, `alertKind`, dispatch text/HTML builders;
  - ports: SOS alert / rider-location repositories, partner-dispatch DTOs, emergency
    contacts, user contact fields, Places, in-app notification;
  - application: SOS, rider-location, Places, and fan-out use cases;
  - infrastructure adapters wrapping existing repositories + Google Places (timeout-aware)
    + Upstash cache + `NotificationService`;
  - `createSafetyLocationModule()` / `getSafetyLocationModule()` composition root.
  Keep `SOSService` / `SOSDispatchService` / `RiderLocationService` / `PlacesService` /
  `sos-maps` as compatibility facades at existing import paths.
- **Consequences.** Business behavior (recipient resolution, channel accounting, RED/AMBER
  prefixes, Places DEV empty array, PostGIS stale windows) is unchanged. Application code
  no longer imports Prisma or Google Places SDK details. Next slices: identity-access,
  then catalog/bookings. Async dispatch/outbox remains deferred to Phase 8.

## ADR-023: Identity-access policy centralization (modular monolith Phase 4)

- **Context.** Authorization logic lived entirely in `apps/web/lib/require-role.ts`: the
  banned/suspended window, the ADMIN membership bypass, and the role-list comparison were
  inline alongside `NextResponse` construction, so the policy could not be unit-tested
  without Next.js and could not be reused by any non-HTTP caller. Better Auth's OTP hook
  also called `SMSService` and `DevOtpStore` directly and wrote `prisma.user.update` inside
  `callbackOnVerification`. The generic prompt asks for JWT/refresh-token/session
  management, most of which Better Auth already owns.
- **Decision.** Add `packages/services/src/modules/identity-access`:
  - domain: `isAccountRestricted`, `hasRole`/`isAdmin`, a **derived** permission catalog
    (`permissionsForRole`), `buildOtpMessage`, and a transport-neutral `AccessDecision`
    with reasons `UNAUTHENTICATED | ACCOUNT_RESTRICTED | FORBIDDEN | MEMBERSHIP_REQUIRED`;
  - ports: `MembershipPort`, `OtpEchoStorePort`, plus the communications `SmsPort`;
  - application: `access.evaluateSession/evaluateRole/evaluatePermission/evaluateMembership`
    and `otp.sendLoginOtp`;
  - `createIdentityAccessModule()` / `getIdentityAccessModule()` composition.

  `require-role.ts` keeps its exported signatures and becomes pure HTTP mapping. Permissions
  are derived from `User.role` rather than stored, so there is no schema, session, or token
  change and a permission check can never grant more than the equivalent role check.
  Better Auth stays the session authority — **no** parallel JWT/refresh implementation.
- **Consequences.** Every 401/403 status and body is unchanged (`{ error: "Unauthorized" }`,
  `{ error: "ACCOUNT_RESTRICTED" }`, `{ error: "Forbidden" }`, `MEMBERSHIP_REQUIRED` with its
  upsell message), including `requireMembership` still returning the session alongside a
  `MEMBERSHIP_REQUIRED` error. `requirePermission()` is available but not yet wired into
  routes; rewiring is a separate reviewable change per route. Resource-ownership policies
  remain with their owning modules until Phases 5–7.

## ADR-024: Catalog, rentals-bookings, and partners modules (modular monolith Phase 5)

- **Context.** Bike search, booking creation, review eligibility, wishlist, and partner
  profile lived as flat services importing `@bikie/database` repositories directly. Booking
  pricing/date/status rules and review eligibility were embedded in service methods with no
  unit tests. Audit P1 called out missing indexes for booking overlap, `Partner.city`, and
  `TripParticipant.userId`.
- **Decision.** Extract three modules under `packages/services/src/modules/`:
  - `catalog` — bikes / destinations / categories / testimonials; search defaults
    (`page=1`, `pageSize=12`) in domain;
  - `rentals-bookings` — booking pricing (`rentalDaysBetween`, `computeBookingTotal`,
    `initialBookingStatus`), review eligibility policy, wishlist; overlap locking stays in
    `createBookingIfAvailable` (row lock + transaction unchanged);
  - `partners` — profile upsert and dashboard stats.
  Keep existing `*Service` exports as compatibility facades. Add additive btree indexes via
  migration `20260802000000_phase5_query_indexes` (Booking composite date range, Partner.city,
  Bike.city/ownerId, TripParticipant.userId).
- **Consequences.** API envelopes and error reasons (`BIKE_NOT_FOUND` → 404,
  `BIKE_UNAVAILABLE` → 409, `INVALID_DATES` → 400, review eligibility → 403/400/404) are
  unchanged. Route `revalidate` / Next.js caching stays at the edge. Search Redis caching and
  Razorpay payment ports remain deferred until measured need / Milestone 4. Next: rides /
  messaging (Phase 6) and the P0 ride-approval atomic transaction.

## ADR-025: Rides-community + messaging modules; atomic ride approval (Phase 6)

- **Context.** Ride join approval ran as three separate writes (`decrementSeatsLeft` →
  `decideParticipant` → `getOrCreateRideConversation`). A failure after the seat decrement
  could leave capacity permanently reduced without an approved rider (audit P0). Trip,
  Ride Room, and Message services were flat and cross-imported each other.
- **Decision.**
  1. Add `tripRepository.approveParticipantAtomically` — one Postgres transaction:
     `FOR UPDATE` on Trip → re-check PENDING → conditional seat decrement → APPROVED →
     get-or-create conversation. Side effects (system message, notification) stay outside.
  2. Extract `modules/rides-community` (participation + room-access domain; trip & ride-room
     applications) and `modules/messaging` (mute policy; crypto/realtime/account-status ports).
  3. Keep `TripService` / `RideRoomService` / `MessageService` as facades.
- **Consequences.** Approve/reject HTTP contracts unchanged. Concurrent double-approves cannot
  oversell seats or leave orphan conversations. Messaging encryption and SSE/polling paths
  unchanged. Next: administration / trust-safety (Phase 7).

## ADR-026: Administration + trust-safety modules; bounded CSV export (Phase 7)

- **Context.** Admin CRUD, CSV export, reports/moderation, and audit logging lived as flat
  services. CSV formula injection was already sanitized, but exports were unbounded
  (`findMany()` with no `take`). Moderation expiry math and action ledger writes were
  embedded in `ModerationService` without unit tests.
- **Decision.**
  1. Extract `modules/administration` with CSV domain (`sanitizeCsvCell`, `buildCsv`,
     `MAX_ADMIN_CSV_ROWS = 10_000`) and an Admin application facade for `AdminService`.
  2. Extract `modules/trust-safety` for reports, moderation (WARN/MUTE/SUSPEND/BAN/UNBAN +
     message/room actions), and audit; facades for `ReportService` / `ModerationService` /
     `AuditService`.
  3. Cap export queries at 10k rows (`orderBy createdAt desc`) in `admin.repository`.
- **Consequences.** Admin/moderation API contracts unchanged. Large exports are truncated at
  10k rather than OOM. Next measured work is Phase 8 (async/outbox) only after NFR baselines.

## ADR-027: Platform foundation — retry, idempotency, sync job queue (Phase 8)

- **Context.** Phase 8 in the modular-monolith plan calls for outbox/queues/workers only after
  measured NFR baselines. SOS fan-out could still double-send on retries; message history was
  unbounded; production rate limiting could silently no-op without Upstash.
- **Decision.**
  1. Add `modules/platform` with `JobQueuePort` (default: in-process sync), `IdempotencyPort`
     (Upstash SET NX when configured, else process memory), and `withRetry` (exponential + jitter).
  2. Gate SOS fan-out with idempotency key `sos-dispatch:{alertId}` (claim → work → remember);
     duplicate calls replay the remembered summary or skip side effects.
  3. Bound conversation history to the newest 200 messages (hard max 500), still returned
     oldest→newest.
  4. Mandate Upstash for `RateLimitService` in production (fail closed); keep no-op in non-prod.
  5. Ship an NFR baseline scaffold (domain hot-path timings); defer Kafka/Bull/outbox workers
     until load evidence warrants them. `SOS_ASYNC_DISPATCH=true` reserves a future enqueue path
     without changing the current sync HTTP contract.
- **Consequences.** No `/api/*` contract break. Side-effect fan-out is safer under retries.
  Full async outbox remains backlog pending staging baselines.

## ADR-028: OpenAPI v1 contract snapshot; no premature `/api/v2` or facade deletion (Phase 9)

- **Context.** Phase 9 calls for publishing OpenAPI, optional `/api/v2`, deprecation windows,
  and removing compatibility facades after zero-use proof. Flutter and web still depend on
  the unversioned `/api/*` surface and on `*.service.ts` facades.
- **Decision.**
  1. Treat current `/api/*` as **stable v1**. Do not create `/api/v2` until an ADR approves a
     specific breaking change with a consumer migration window.
  2. Publish OpenAPI 3.1 via `pnpm openapi:generate` → `.docs/openapi/openapi-v1.json`,
     mirrored to `apps/web/public/openapi-v1.json`, served at `GET /api/openapi`.
  3. Keep a filesystem-derived `route-inventory.json` and a Vitest contract check so new
     routes cannot silently drift from the snapshot.
  4. Add `apps/web/lib/api-contract.ts` helpers (`x-request-id`, `x-api-version`, Deprecation /
     Sunset / successor `Link`) for gradual adoption — no mass route rewrite.
  5. Document auth classes (`.docs/openapi/auth-matrix.md`) and facade removal gates
     (`.docs/openapi/facade-registry.md`). **Do not delete facades** until zero-use proof.
- **Consequences.** Contract discovery is machine-readable without breaking clients.
  Schema detail remains incremental (narratives in `.docs/API.md`). Legacy facade cleanup
  stays gated.

## ADR-029: Rate limits degrade instead of failing closed; channels chosen by configuration

- **Context.** ADR-027 made `RateLimitService` fail closed in production when Upstash was
  unset. In the Docker deployment that turned into a hard block on `POST /api/sos/alerts`
  ("Rate limiting is unavailable"), i.e. a rate limiter outage could stop an emergency alert.
  Separately, SOS fan-out fired SMS/WhatsApp/email at every recipient regardless of which
  providers were actually configured, so DEV-only fallbacks were counted as delivery attempts.
- **Decision.**
  1. Replace fail-closed with a per-instance in-memory fixed-window fallback, used both when
     Upstash is unconfigured and when a Redis check throws mid-request. Results carry
     `degraded: true`. Availability wins over perfect accounting on safety-critical paths.
  2. Add optional `isConfigured()` to `EmailPort` / `SmsPort` / `WhatsAppPort`. A port without
     it counts as configured, so existing adapters and test fakes are unaffected.
  3. SOS fan-out resolves channel availability once per dispatch and, per recipient, requires
     both a configured provider and the matching contact detail (phone → SMS/WhatsApp,
     email → email). Unconfigured channels are skipped rather than attempted; an unconfigured
     WhatsApp still returns a `wa.me` click-to-send link for manual escalation.
  4. `SOSDispatchSummary.channels` reports which channels were live, and the dispatch log line
     ends with `channels=sms:…,wa:…,email:…`.
  5. Twilio SMS accepts `TWILIO_PHONE_NUMBER` as an alias for `TWILIO_FROM_NUMBER`, matching
     the variable name already used by existing deployment env files.
- **Consequences.** Emergency alerts are never blocked by limiter infrastructure; abuse limits
  still apply per instance while degraded (under-counting across replicas is accepted). Channel
  counters now reflect real delivery attempts. Supersedes the fail-closed rule in ADR-027.

## ADR-030: An SOS must never silently reach nobody

- **Context.** Field testing produced three consecutive alerts logging
  `nearby=0 providers=0 contacts=0 sms=0/0 wa=0/0 email=0/0 inApp=0 channels=sms:on,wa:off,email:off`
  while the UI showed "Alert Sent! GPS shared via SMS, WhatsApp, and email to nearby riders,
  service providers, and your emergency contacts." Nothing was misfiring in the dispatch code —
  the recipient set was genuinely empty (no saved emergency contacts, nobody sharing location
  in range, no same-city partner, `SOS_EMERGENCY_SERVICES_*` unset) and the email/WhatsApp
  providers had no credentials. `RiderEmergencyContact` also stored only `name`/`phone`, so
  contacts were structurally unreachable by email even once SMTP was configured.
- **Decision.**
  1. The success screen reports the actual `SOSDispatchSummary` instead of a fixed sentence:
     recipient counts, per-channel `sent/attempted`, which channels are unconfigured, and a
     distinct "nobody reached" state that tells the rider to call emergency services and links
     to the emergency-contacts form. A null summary (fan-out threw) is its own error state.
  2. `RiderEmergencyContact.email` — nullable, additive. SOS fan-out emails contacts who have
     one; phone-only contacts behave exactly as before.
  3. A dispatch that resolves to zero recipients escalates to up to five `ADMIN` users through
     a new `EscalationPort`, logs `[SOS][DISPATCH][NO-RECIPIENTS]`, and reports
     `escalatedToAdmins` in the summary. Admins are an escalation path only — they are never
     added to a dispatch that already found responders.
  4. The reporter always receives an in-app notification confirming the alert is live (with the
     responder count, or an explicit "no responders could be reached" instruction), independent
     of whether any provider is configured.
  5. `getProfileWarning` also flags missing emergency contacts, not just a missing phone number,
     so the gap is visible before an emergency rather than during one.
- **Consequences.** A misconfigured or thinly-populated deployment now fails loudly and
  actionably instead of showing a false success. `escalatedToAdmins > 0` in logs is the signal
  that recipient coverage — not the delivery code — is what needs attention.

## ADR-031: SMS provider switched from Twilio to MSG91

- **Context.** Per explicit product decision, Twilio is replaced as the SMS provider. ADR-018's
  ports/adapters design (`SmsPort`) meant the swap is contained entirely to
  `packages/services/src/modules/communications/infrastructure/sms.adapter.ts` — every caller
  (`SMSService`, the identity-access OTP flow, SOS fan-out) goes through `SmsPort.send(to, message)`
  and is provider-agnostic already.
- **Decision.** `createSmsAdapter()` now calls MSG91's v2 `sendsms` API
  (`POST https://api.msg91.com/api/v2/sendsms`, `authkey` header) instead of Twilio's REST API.
  New env vars: `MSG91_AUTH_KEY`, `MSG91_SENDER_ID`, `MSG91_ROUTE` (default `4`, transactional),
  `MSG91_TEMPLATE_ID`. `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_MESSAGING_SERVICE_SID`/
  `TWILIO_FROM_NUMBER`/`TWILIO_PHONE_NUMBER` are no longer read for SMS. `isConfigured()` still
  gates SOS channel selection (ADR-029) the same way, just against MSG91 credentials.
- **Known gap.** OTP and SOS-alert bodies are built as free text in TypeScript
  (`buildOtpMessage`, `SMSService.sendSOSAlert`), but India's TRAI DLT rules require the SMS body
  sent through MSG91 to match a pre-registered template per sender ID. `MSG91_TEMPLATE_ID` is a
  single env var today; if OTP and SOS need different registered templates, this will need to
  become per-message-type config, not a single shared ID. Not yet load-bearing until real DLT
  templates are registered and delivery is tested end-to-end.
- **Consequences.** `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` are still read by
  `whatsapp.adapter.ts`'s Twilio-WhatsApp fallback (separate from this change, ADR-018) — if that
  fallback is ever activated, its credentials need to be reintroduced independently of the SMS vars
  removed here.

## ADR-032: Phone-OTP hardening stays on Better Auth, not MSG91's OTP API

- **Context.** A request came in to "integrate MSG91's OTP API" with production-grade OTP
  security (rate limits, resend cooldown, attempt caps, logging). Before building anything, the
  existing `phoneNumber()` plugin (`better-auth/plugins/phone-number`) was checked directly against
  its shipped source: it already does race-safe OTP generation, storage, and wrong-attempt
  counting (`verifyPhoneNumberOTP` in `routes.mjs` — an atomic consume-then-recreate pattern), and
  its default 5-minute expiry already matched the requested spec exactly. There was no dummy/mock
  OTP logic anywhere in `identity-access` to replace.
- **Decision.** Better Auth remains the OTP system of record (generation, expiry, wrong-attempt
  counting via its built-in `allowedAttempts`, bumped 3→5). MSG91 stays a pure SMS-delivery
  channel behind `SmsPort` (ADR-031) — the plugin's `verifyOTP` override (built for "SMS providers
  that handle their own OTP generation and verification") was deliberately **not** used, since
  switching to it would discard Better Auth's already-correct atomic attempt counting in favor of
  trusting MSG91's own OTP product as a second, untested source of truth for the same state.
  Everything the spec asked for that Better Auth doesn't already do — resend cooldown, per-window
  send caps, phone+IP rate limiting, structured logging, Indian-number validation — is layered on
  top instead:
  - `phoneNumberValidator: isValidIndianMobile` (new, `communications/domain/phone.ts`) rejects
    non-Indian/malformed numbers before Better Auth even generates a code.
  - `apps/web/app/api/auth/[...all]/route.ts` gates `/phone-number/send-otp` and
    `/phone-number/verify` before delegating to Better Auth's handler: a 60s per-phone resend
    cooldown (also covers "no duplicate OTP while one is active"), a 3-per-10-minute per-phone
    send cap, a 10-per-10-minute per-IP send cap, and a 20-per-10-minute per-IP verify cap, all via
    the existing `RateLimitService`/`enforceRateLimit` (ADR-027/029) — no new rate-limit mechanism.
    This had to happen at the route layer, not inside the `sendOTP` callback, because Better Auth's
    `send-otp` endpoint always returns 200 once the request body is valid regardless of what that
    callback does (it awaits it, but there's no built-in path from callback failure to an HTTP
    error status).
  - Every send/verify request is logged with phone number, IP, and outcome/status — never the OTP
    code itself (SMS delivery success/failure is already logged separately by the MSG91 adapter).
  - `apps/web/lib/use-resend-countdown.ts` drives the resend button's 60s countdown client-side on
    both `/login` and `/signup`, so the server-side cooldown is a backstop, not the primary UX.
- **Consequences.** OTP state lives in exactly one place (Better Auth's `verification` table), so
  there's no cross-system drift to reason about. The tradeoff: MSG91's own OTP-specific dashboard
  analytics (if any) won't reflect this flow, since MSG91 only ever sees an SMS send request, not
  an OTP verification. Revisit only if a hard requirement emerges to keep OTP state on MSG91's side.

## ADR-033: SOS becomes a staged Community Emergency Response System (Phase A — backend core)

- **Context.** The SOS module was Phase 1: `POST /api/sos/alerts` fanned out to nearby riders,
  same-city partners, and emergency contacts **all at once**, with no accept/assignment flow —
  the only responder action was a dashboard "I'm Nearby" button that wrote one
  `SOSAlertResponse` row and never notified the reporter. A full redesign was requested toward
  "the community responds first, providers are secondary," with staged escalation, mutual
  helper/rider confirmation, a live session, and a real audit timeline. Before writing any code,
  the existing implementation was audited directly against its source (schema, `fan-out.application.ts`,
  routes, UI, Flutter) — see the current-implementation analysis delivered ahead of this ADR.
  Four scope questions were confirmed with the client up front: (1) auth stays OTP-only for
  Riders/Partners, Admin keeps email+password — out of scope here; (2) implementation proceeds in
  phases, backend core first; (3) ETA uses a straight-line-distance + assumed-average-speed
  estimate, not a paid routing API; (4) reputation ships minimal (counters + rating) in a later
  phase, no badges/trust-tier yet.
- **Decision — extend `modules/safety-location`, don't replace it.** Per ARCHITECTURE.md's
  Strangler-fig convention, every change below extends the existing ports/adapters module rather
  than standing up a parallel system.
  - **Schema (additive only).** `SOSAlert` gains `severity` (server-derived from `type`, never
    client-trusted — prevents a reporter jumping tiers by mislabeling a case),
    `assignedHelperId`, `escalationTier`, `currentRadiusMeters` (default 5000, was a hardcoded
    10000 in `fan-out.application.ts`), `nextEscalationAt`. `SOSAlertType` gains
    `LIFE_THREATENING`/`FLAT_TYRE`/`BATTERY_ISSUE` (existing values untouched — no backfill on
    historical rows). `SOSAlertResponse.status` moves from a free-text `String` (100% of existing
    rows literally `"RESPONDING"`) to a real `SOSResponseStatus` enum — this **required a
    hand-written migration** (`prisma migrate dev`'s shadow-DB step hung indefinitely against
    this project's Neon instance, so the migration was hand-authored matching Prisma's exact
    naming conventions and applied via `prisma migrate deploy`, verified zero-drift afterward via
    `prisma migrate status`). New `SOSSession` (rider, helper, offer, status, `conversationId`
    reusing the Community Platform's existing `Conversation`/`Message` — no new chat system) and
    `SOSTimelineEvent` (deliberately separate from the moderation-only `AuditLog`) models.
    `SOSEscalationTier` includes `NEARBY_RIDERS_COMMUNITY` — reserved now, unused until the
    community-prioritization phase, so that phase needs no further migration.
  - **Duplicate-assignment prevention (client's explicit "use database transactions"
    requirement).** `sos-session.repository.ts`'s `acceptOffer` is one `prisma.$transaction`:
    `UPDATE sos_alert SET assignedHelperId=? WHERE id=? AND assignedHelperId IS NULL` is the
    guard, embedded in the mutating statement itself, not a separate read-then-write. Under
    Postgres's default Read Committed isolation, concurrent accept transactions serialize on the
    row lock; the loser's conditional update genuinely affects 0 rows once the winner commits —
    no Serializable isolation needed. A thrown `AlreadyAssignedError`/`OfferNotAvailableError`
    rolls back the whole transaction, so no partial assignment can persist; routes map these to
    409.
  - **Staged escalation, not simultaneous fan-out.** `dispatch.application.ts` is the new
    orchestrator: on alert creation it runs the "always fire" leg (emergency contacts, optional
    `SOS_EMERGENCY_SERVICES_*`, reporter confirmation/receipt — unchanged in spirit, now in
    `fan-out.application.ts`) together with `escalation.application.ts`'s `seedEscalation` (tier-1
    nearby riders, 5km). If nearby riders/providers don't respond, `GET /api/cron/sos-escalate`
    (same `Bearer CRON_SECRET` pattern as the existing `sos-resolve` cron, polled ~1min) drives
    `tickEscalation`: widen radius in `SOS_RADIUS_STEP_KM` steps up to `SOS_RADIUS_MAX_KM` (only
    notifying newly-in-range riders, de-duped via the `Notification` table's existing
    `entity='sos_alert'` rows — no new join table), then advance tier
    `NEARBY_RIDERS_GENERAL → SERVICE_PROVIDERS → ADMIN`. `SERVICE_PROVIDERS` now uses
    `Partner.type`/`isVerified` to target relevant, verified partners first (a breakdown pages
    `MECHANIC`s, not every partner type in the city — the fan-out never did this before),
    broadening to any partner if the strict search is empty. `ADMIN` is terminal, matching
    ADR-030's original behavior. A cron-poll ticker was chosen over precise per-alert scheduling
    (e.g. Upstash QStash) because it needs zero new vendor dependency and matches the existing
    `sos-resolve` precedent — QStash is a clearly-scoped, additive follow-up behind the same
    `tickEscalation` interface if poll-interval latency ever becomes a real problem.
  - **ADR-030's zero-recipient escalation is preserved, not silently weakened, but its trigger
    changed shape.** Previously the immediate-admin-escalation check spanned all four legs
    (riders+providers+contacts+services) synchronously in one request. Providers are no longer
    resolved synchronously (`SERVICE_PROVIDERS` is tier 2, reached later), so
    `dispatch.application.ts` now escalates to admin **immediately** only when contacts +
    emergency-services + tier-1 nearby riders are *all* empty (the rider's personal safety net
    plus the first responder search both come up empty) — otherwise the staged engine still
    reaches `ADMIN` as its terminal tier if nothing else works out. This is a deliberate,
    documented behavior change, not an oversight: the degenerate "reaches literally nobody" case
    still pings admins synchronously; a merely-slow case now waits for tier timeouts instead of
    firing an admin ping the same second SOS_ALERT is fired.
  - **Helper-acceptance flow.** New routes: `POST .../offer` ("I'm Coming" — replaces `/respond`,
    which becomes a thin deprecated alias per ADR-028, no facade deletion without zero-use proof),
    `.../offer/withdraw`, `GET .../offers` (reporter/admin only — **helper phone stays hidden
    until their specific offer is `ACCEPTED`**, symmetric with the reporter's own contact info
    already being hidden from non-city-matching members), `.../offers/[id]/accept`,
    `.../offers/[id]/reject`. Accepting creates the `SOSSession` and expires every other open
    offer on that alert.
  - **Session status ownership** (flagged to the client as a product call, not purely
    architectural, then implemented with the sensible default): helper drives
    `HELPER_ARRIVED`/`ASSISTANCE_IN_PROGRESS` (they're the one physically there to say so), rider
    drives `COMPLETED` (confirming the emergency is actually over), either drives `CANCELLED`,
    admin always overrides. Cancelling releases `assignedHelperId` so the alert re-opens.
  - **Security fix shipped independently of the rest:** `POST /api/sos/alerts/[id]/resolve` used
    `requireSession()` with **zero ownership check anywhere in the chain** — confirmed by reading
    both the route and `sos.repository.ts`'s `resolveAlert` directly — meaning any authenticated
    user could resolve *any* SOS alert, not just their own. Fixed to `requireMembership()` +
    reporter/assigned-helper/admin check, enforced in the application layer (not just the route)
    so Flutter can't bypass it either.
  - **ETA** is `domain/eta.ts`'s `estimateEtaMinutes(distanceMeters, avgSpeedKmph=25)` — pure,
    synchronous, no external call. A future Google Distance Matrix implementation is a drop-in
    replacement behind the same signature.
  - **Deliberately deferred, hooks only:** `CommunityMembershipPort.findSharedGroupMemberIds` is
    fully implemented against `GroupMember` but not yet wired into `seedEscalation`'s tier
    selection — that's the community-prioritization phase. `SOSSession.rating`/`ratingComment`
    columns exist so something can capture a rating now, but nothing aggregates them into
    `User.emergencyResponseCount`/`helperRatingAvg` until the reputation phase (deliberately
    minimal per the client's call — no badges/trust-tier).
- **Consequences.** OTP-style ports/adapters discipline held throughout — no route imports
  Prisma, no application method imports a repository directly. Test coverage added at the
  application layer (offer/accept/reject ownership, `AlreadyAssignedError` mapping, radius
  widening only notifying fresh riders, tier advancement, resolve-route ownership) rather than
  only at the route layer, since Flutter exercises the same application methods through the same
  routes — no duplicate API surface.
- **Update (Phases B–D, same pass).** All three remaining phases shipped:
  - **B (web UI):** new `/dashboard/sos/[id]` session page. Found two more real gaps while
    building it — `acceptOffer` never created the session's `Conversation` (chat had nothing to
    attach to) and `createOffer` didn't handle the `[alertId,responderId]` unique constraint (a
    duplicate offer attempt would 500) — both fixed as part of Phase A's own files.
  - **C (Flutter):** full parity, same routes. Found two *more* pre-existing bugs while porting —
    `getActive()` was called with no `city` param (the API requires one for non-admins), and
    `getHistory()` force-parsed the history response as a full `SOSAlertDTO` even though that
    endpoint returns a smaller, different shape (would throw on every required-field mismatch);
    fixed with a dedicated `SOSHistoryEntry` model. Chat needed zero new code — the existing
    `ConversationThreadBody` widget is already fully self-contained and was just embedded
    directly, mirroring the web's `ChatArea` reuse.
  - **D (reputation + community):** minimal counters only, as scoped (no badges/trust-tier).
    Community/Club members among the nearby-rider pool get first crack via a
    `NEARBY_RIDERS_COMMUNITY` tier (shorter timeout) using the port reserved in Phase A, then the
    tier advances to the full general pool with already-notified riders excluded via the same
    `Notification`-table de-dup radius-widening already used — no new dedup mechanism needed.
  - Final state: 9/9 packages typecheck clean, 102/102 vitest passing, 73/73 flutter tests
    passing, `flutter analyze` clean. Not done: a full authenticated browser click-through — typecheck/build/compile-verified only, real interactive testing needs a browser session.

## ADR-034: MSG91 becomes the OTP system of record, superseding ADR-032

- **Supersedes ADR-032** ("Phone-OTP hardening stays on Better Auth, not MSG91's OTP API").
  ADR-032 explicitly rejected switching to Better Auth's `verifyOTP` override, reasoning that it
  would "discard Better Auth's already-correct atomic attempt counting in favor of trusting
  MSG91's own OTP product as a second, untested source of truth," while noting: *"Revisit only if
  a hard requirement emerges to keep OTP state on MSG91's side."* That requirement has now
  emerged: MSG91's Widget SDK (browser-only, already configured in the MSG91 dashboard) for web,
  for the bot/fraud-signal properties it provides over a self-rolled code; and, since the widget
  has no Flutter equivalent, MSG91's native server-to-server OTP API for mobile. This ADR
  resolves ADR-032's core fear directly: MSG91 becomes the **sole** OTP generator on **both**
  platforms — Better Auth never generates a code again, so there is exactly one source of truth
  per verification, not two running concurrently.
- **Decision.** Better Auth's `phoneNumber()` plugin exposes a documented extension point,
  `verifyOTP?: (data: {phoneNumber, code}) => Awaitable<boolean>` — "useful when using SMS
  providers that handle their own OTP generation and verification." Confirmed directly in
  `better-auth/dist/plugins/phone-number/routes.mjs`: when set, it replaces Better Auth's internal
  code comparison, but the rest of the pipeline (find-or-create user via `signUpOnVerification`,
  mark `phoneNumberVerified: true`, run `callbackOnVerification`, create the session, mint the
  mobile `set-auth-token` header via `bearer()`) runs completely unchanged. `packages/auth/src/server.ts`
  now wires `verifyOTP` to `identity-access`'s `verifyLoginOtp`, which asks MSG91 instead of
  comparing against a Better-Auth-generated code — Better Auth still owns every account/session
  decision, it just no longer decides *whether a code was right*.
  - **Web:** the widget (`apps/web/lib/use-msg91-widget.ts`, `exposeMethods: true`) drives our
    existing PhoneNumberInput/OTP form — no new UI, only new wiring. `window.sendOtp`/`retryOtp`
    (explicit `channel: 'text'`, since MSG91's own default for that call is a voice call) talk to
    MSG91 directly from the browser; our backend never sees that leg. `window.verifyOtp` returns
    an opaque access token, which is then sent through the **unchanged**
    `authClient.phoneNumber.verify({phoneNumber, code: accessToken})` call — `code` here is the
    token, not a 6-digit OTP.
  - **Mobile:** a new backend-only endpoint, `POST /api/otp/mobile/send`
    (`apps/web/app/api/otp/mobile/send/route.ts`), calls MSG91's native OTP API
    (`POST/GET https://control.msg91.com/api/v5/otp{,/verify}`, `otp_length=6` to match existing
    UI copy everywhere). Verify stays on the exact same unchanged
    `POST /api/auth/phone-number/verify` endpoint web uses — this is the entire point: one shared
    verify path, one session-issuance pipeline, for both platforms.
  - **Discriminator.** The verify endpoint's body is fixed to `{phoneNumber, code}` with no room
    for a third "which transport" field, so `verifyLoginOtp`
    (`packages/services/src/modules/identity-access/application/otp-verify.application.ts`)
    decides by shape: `/^\d{4,9}$/` → MSG91's native OTP (mobile), otherwise → widget access token
    (web), re-verified server-side via `POST .../widget/verifyAccessToken` and cross-checked
    against the claimed phone number when MSG91's response includes one. This is a heuristic, not
    a cryptographic proof — MSG91's own APIs remain the actual trust boundary; a client's claim of
    widget success is never trusted alone.
  - **`sendOTP` is required-but-neutralized, not deleted.** `PhoneNumberOptions.sendOTP` has no
    `?` — it can't be omitted — so it's now a hard-fail trip-wire (`throw`) instead of generating
    a code. Belt-and-suspenders alongside `apps/web/app/api/auth/[...all]/route.ts` returning
    **410** on `/phone-number/send-otp` itself: both exist so nothing can silently run a second
    OTP system, whether reached via HTTP or a future internal call.
  - **Dead configuration, accepted.** The moment `verifyOTP` is set, Better Auth's own
    `otpLength`/`expiresIn`/`allowedAttempts` stop doing anything — the internal attempt-counting
    branch that reads them simply never runs (confirmed in `routes.mjs`). Left in place as
    documentation of intended shape, not because they're functional. Brute-force protection on
    verify now rests on MSG91's own (undocumented) limits plus the existing
    `otp-verify-phone`/`otp-verify-ip` route-level rate limits — sized as a coarse abuse guard
    originally, not a precise per-OTP attempt cap. Accepted gap, not a silent regression.
  - **Dev workflow, mobile-only now.** `SHOW_OTP_TOAST`'s local-code bypass
    (`sendNativeLoginOtp`/`verifyLoginOtp` checking `DevOtpStore` first) only exists for mobile's
    custom send endpoint, which we fully control. Web's widget talks to MSG91 directly from the
    browser, bypassing our backend for the send leg entirely — there's no interception point left
    to fake a code, so local web dev now needs a real MSG91 send. Accepted regression, not fixed
    with a second, web-specific simulation path.
  - **Env vars.** New: `MSG91_OTP_TEMPLATE_ID` (server-only — a DLT-approved template for OTP
    content specifically, distinct from `MSG91_TEMPLATE_ID` which stays scoped to SOS alert SMS),
    `NEXT_PUBLIC_MSG91_WIDGET_ID`/`NEXT_PUBLIC_MSG91_WIDGET_TOKEN_AUTH` (client-exposed **by
    design** — the widget is a browser `<script>` tag, so these are visible in page source; MSG91
    scopes/restricts the widget by domain in its own dashboard, not by keeping this value hidden,
    unlike `MSG91_AUTH_KEY` which stays server-only).
  - **Dead code removed.** `identity-access`'s old `otp.application.ts`
    (`sendLoginOtp`)/`domain/otp-message.ts` (`buildOtpMessage`) had exactly one caller — Better
    Auth's old `sendOTP` callback — and zero remaining callers once it's neutralized; deleted
    rather than left as an unused second OTP-message code path.
- **Consequences.** Exactly one OTP authority (MSG91) per platform, exactly one verify pipeline
  (Better Auth's, unchanged endpoint/session/bearer-token logic) for both. Known gaps, not yet
  load-bearing until live-verified: MSG91 wallet balance (last confirmed 0 — blocks real delivery
  regardless of which system is used), `MSG91_OTP_TEMPLATE_ID` still needs DLT registration in the
  MSG91 dashboard, the exact `verifyAccessToken` success-response schema (does it always echo a
  phone number?) wasn't confirmed from renderable MSG91 docs at implementation time, and the
  widget's real CSP network origins (`apps/web/next.config.ts`) are a starting allow-list
  (`verify.msg91.com`/`verify.phone91.com`/`control.msg91.com`) to be captured from the Network
  tab and tightened on first live test, not guessed-and-shipped as final.

## ADR-035: Android push notifications (FCM) — reuse the existing pipeline, no separate mobile system; iOS explicitly out of scope

- **Context.** ADR-016 shipped push for web only; native Flutter push (`firebase_messaging` +
  real FCM device tokens, not the Web SDK/VAPID/service-worker path) was explicitly deferred.
  Requested now for Android only — riders and service providers need SOS/ride/chat pushes to
  reach them even with the app backgrounded or fully closed.
- **Decision — extend, don't duplicate.** `NotificationService.notify()` stays the single choke
  point every notification type already passes through (bookings, SOS, rides, chat, moderation)
  — Android is a new *delivery leg* inside the existing `PushPort`/`push.adapter.ts`, not a
  parallel system, and registers against the **same** `PUT/DELETE /api/notifications/push-token`
  route the web client has always used.
  - **Schema (additive).** `PushSubscription` gains `platform` (`PushPlatform: WEB | ANDROID |
    IOS`, default `WEB` — existing rows keep working unchanged), `deviceId`/`deviceName`/
    `appVersion` (nullable — meaningless for a browser), `notificationsEnabled` (default `true`).
    One row per physical device per user, keyed by `token` as before — multi-device support
    falls out of that for free, no separate "device" model needed. Migration
    `20260805100000_push_device_metadata` is hand-authored (`CREATE TYPE` + additive
    `ALTER TABLE`), matching the precedent set by ADR-016/ADR-033's PostGIS/enum migrations —
    **not yet applied to the live database**, pending the user running `pnpm db:migrate`
    (or equivalent `prisma migrate deploy`) themselves; `prisma generate` (local codegen only,
    no DB write) was run so the rest of the stack typechecks against the new fields already.
  - **`push.adapter.ts`'s `sendEachForMulticast` gains a per-platform `android` override block**
    (`priority`, `notification.channelId`) computed from the notification's `NotificationType`
    via a new pure domain helper, `channelIdForNotificationType`
    (`communications/domain/push-channel.ts`). FCM applies platform-specific blocks (`android`/
    `webpush`/`apns`) only to tokens actually registered on that platform, so one multicast call
    safely covers a user's mixed web+Android devices — no branching in the adapter itself. The
    Flutter app mirrors the identical type→channel mapping client-side (`push_channels.dart`,
    for the foreground case, which the OS doesn't auto-display) — the two can't share code
    across TS/Dart, kept in sync by a doc comment on both sides pointing at each other.
  - **Two real gaps found and fixed while wiring this up**, both pre-existing and unrelated to
    Android specifically (they'd have been silently broken for web push too):
    1. `POST /api/sos/alerts/[id]/resolve` never notified anyone — resolving an alert (by the
       reporter, the assigned helper, or an admin override) now notifies whichever party didn't
       do the resolving; the cron auto-resolve path (`GET /api/cron/sos-resolve`) now notifies
       both. Reuses the existing `SOS_ALERT` notification type (no new enum value) — SOS
       notifications have always been differentiated by title/body text, not by type.
    2. `MessageService.sendMessage` never called `NotificationService.notify` at all — a
       `Notification` row (and therefore a push) was never created for a new chat message,
       including Ride Room chat (the same `Message`/`Conversation` models, per ADR-011/ADR-010).
       Fixed by adding a `notifications: InAppNotificationPort` to `MessagingPorts` (same
       adapter-to-`NotificationService` pattern as `safety-location`'s own notification port),
       wired into `sendMessage` with the existing `NEW_MESSAGE` enum value (already present in
       schema, unused until now) and a new `"conversation"` entity convention.
  - **Deep-link bug fixed at the source, not patched around on the client.** Ride notifications
    (`RIDE_REQUEST_RECEIVED`/`APPROVED`/`REJECTED`/`RIDE_ANNOUNCEMENT`) stored the trip's `id` as
    `entityId`, but `/trips/[slug]` is slug-keyed — every "View Trip" link (web) and mobile
    equivalent has 404'd since these notifications shipped. `trip.application.ts`/
    `ride-room.application.ts`'s four `notify()` call sites now pass the trip's `slug` (already
    in scope at each call site, or added as `tripSlug` to `ApproveAtomicResult`/
    `ParticipantWithTrip` — no new query, `include: { trip: {...} }` already fetches it).
    Discovered because Android's tap-to-navigate depends on `entityId` actually resolving.
  - **`sos_session`-entity notifications need a resolve hop.** Several SOS lifecycle
    notifications (`HELPER_ARRIVED`/`ASSISTANCE_STARTED`/etc., `session.application.ts`) carry a
    *session* id as `entityId`, but the only SOS route is alert-keyed (`/sos/[id]`). Rather than
    changing what the notification stores (the web dashboard's SOS page doesn't need a specific
    session's alert id — it links to the SOS list generically), the mobile
    `NotificationDeepLinkResolver` resolves session → alert via the existing
    `GET /api/sos/sessions/[id]` route before navigating. One extra network hop, only on tap, not
    a new endpoint.
- **Android client (`apps/mobile`).** `firebase_core`/`firebase_messaging`/
  `flutter_local_notifications`/`device_info_plus`/`package_info_plus`, new
  `lib/core/push/` module:
  - `push_bootstrap.dart` — Firebase init, the required top-level background message handler,
    local-notification channel creation, and the three listeners (foreground/background-tap/
    terminated-launch) that normalize every path into one `notificationTapController` stream.
    Deliberately has zero Riverpod dependency, because the isolate FCM spawns to run the
    background handler for a killed app has no `ProviderContainer` at all.
  - `notification_deep_link.dart` — `NotificationDeepLinkResolver` (the `entity`/`entityId` → route
    map above) shared by *both* the push-tap path and the existing in-app `/notifications` list
    (`notifications_screen.dart` was rewired to call it too, replacing its own narrower
    Trip-only inline logic) — one routing table, not two that could drift apart.
  - `push_registration_service.dart` — requests the Android 13+ `POST_NOTIFICATIONS` runtime
    permission, obtains/registers the FCM token (with device id/name/app version), re-registers
    on `onTokenRefresh`, and unregisters + deletes the local token on logout. Wired into
    `AuthController` (sign-in/sign-up/OTP-verify/bootstrap → register; sign-out/forced-logout →
    unregister) — the same lifecycle points that already own session state, not a separate
    "enable push" screen/toggle. Every method no-ops on non-Android platforms and swallows its
    own errors — push registration must never be able to break login.
  - `google-services.json` **is not committed and does not exist yet** — the Android app isn't
    registered in Firebase console. The Gradle plugin (`android/app/build.gradle.kts`) is applied
    **conditionally** (`if (file("google-services.json").exists())`), not via the normal
    `plugins {}` block, specifically so the app keeps building and running exactly as before for
    anyone who hasn't added that file yet — the plugin throws a hard build error otherwise.
    Dropping the real file in at that exact path is the only remaining step to go live; no further
    Gradle changes needed.
  - **No custom monochrome notification icon.** Android notifications want a white-silhouette
    small icon; none exists in the asset set. Falls back to `@mipmap/launcher_icon` (functional —
    renders as a colored square/box on the notification, not the ideal look). Flagged as a known
    polish item, not fabricated.
- **iOS is explicitly out of scope for this pass**, per the request — every push code path above
  is Android-only (`Platform.isAndroid` guards in the Dart registration service; no APNs
  entitlements/certs touched). Extending to iOS later is additive (the backend's `PushPlatform`
  enum already has an `IOS` value reserved) but needs its own APNs setup, not assumed to fall out
  of this work for free.
- **Consequences.** Every notification type already flowing through `NotificationService.notify()`
  reaches Android automatically once a device registers — no per-feature push code to write
  going forward. `channelIdForNotificationType`'s mapping must be kept in sync manually across
  `push-channel.ts` and `push_channels.dart` if a new `NotificationType` is ever added. The
  Android app cannot actually deliver a push until (1) the pending migration is applied and (2)
  a real `google-services.json` is added — both are one-time, user-side setup steps, not code
  gaps.

