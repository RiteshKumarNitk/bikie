# Changelog

## Fix — SOS unblocked; channel selection follows configuration (ADR-029)
- `RateLimitService` no longer fails closed without Upstash: it falls back to a per-instance
  in-memory window (also when a Redis check throws), so a limiter outage can't block
  `POST /api/sos/alerts`. Fixes "Rate limiting is unavailable" on the SOS confirm dialog.
- Channel ports gained optional `isConfigured()`; SOS fan-out now sends SMS/WhatsApp/email only
  where the provider is configured **and** the recipient has that contact detail, reporting the
  live channels in `SOSDispatchSummary.channels` and the dispatch log line.
- Unconfigured WhatsApp still returns a `wa.me` click-to-send link for manual escalation.
- Twilio SMS accepts `TWILIO_PHONE_NUMBER` as an alias for `TWILIO_FROM_NUMBER`.

## Modular Monolith Phase 9 — OpenAPI v1 + contract gates (ADR-028)
- Published OpenAPI 3.1 for all Route Handlers (`pnpm openapi:generate`) with route inventory
  and Vitest sync checks; served at `GET /api/openapi` and `/openapi-v1.json`.
- Added contract helpers (`x-request-id`, `x-api-version`, Deprecation/Sunset) without mass
  route rewrites; `/api/v2` and facade deletion remain explicitly gated.
- Documented auth matrix and facade removal registry under `.docs/openapi/`.

## Modular Monolith Phase 8 — Platform foundation (ADR-027)
- Added `modules/platform`: sync in-process `JobQueuePort`, Redis/memory `IdempotencyPort`,
  and `withRetry` (exponential backoff + jitter).
- SOS fan-out claims `sos-dispatch:{alertId}` before side effects and remembers the summary.
- Message history bounded to newest 200 (max 500), still returned chronological.
- Production `RateLimitService` fails closed when Upstash is unset; dev remains a no-op.
- NFR baseline scaffold for domain hot paths; Kafka/Bull/outbox still deferred.

## Modular Monolith Phase 7 — Admin + Trust/Safety (ADR-026)
- Extracted `modules/administration` (Admin CRUD + formula-safe, size-bounded CSV export)
  and `modules/trust-safety` (reports, moderation ledger, audit).
- CSV export capped at 10,000 rows; formula sanitization also covers leading `\t`/`\r`.
- `AdminService`, `ReportService`, `ModerationService`, `AuditService` remain facades.

## Modular Monolith Phase 6 — Rides + Messaging (ADR-025)
- P0 fix: ride approval is now one DB transaction (`approveParticipantAtomically`) —
  seat decrement + APPROVED status + ride conversation creation cannot partially commit.
- Extracted `modules/rides-community` (join/decide/leave + Ride Room access) and
  `modules/messaging` (encrypt/send/receipts/reactions via crypto + realtime ports).
- `TripService`, `RideRoomService`, and `MessageService` remain compatibility facades.
- Characterization tests cover participation rules, room access, atomic approve path, mute policy.

## Modular Monolith Phase 5 — Catalog / Rentals / Partners (ADR-024)
- Extracted `modules/catalog`, `modules/rentals-bookings`, and `modules/partners` with
  ports/adapters and compatibility facades for `BikeService`, `DestinationService`,
  `CategoryService`, `TestimonialService`, `BookingService`, `ReviewService`,
  `WishlistService`, and `PartnerService`.
- Booking pricing/date/status and review eligibility are pure domain functions with
  characterization tests; overlap locking remains in `createBookingIfAvailable`.
- Added additive indexes: `Booking(bikeId,startDate,endDate)`, `Partner(city)`,
  `Bike(city)`, `Bike(ownerId)`, `TripParticipant(userId)`.
- No `/api/*` or Flutter contract changes.

## Modular Monolith Phase 4 — Identity-Access Module (ADR-023)
- Added `packages/services/src/modules/identity-access` holding the account-status,
  role, permission, and membership policies as pure domain functions plus an
  `AccessDecision` result type that knows nothing about HTTP.
- `apps/web/lib/require-role.ts` is now transport mapping only. `assertAccountActive`,
  `requireSession`, `requireMembership`, and `requireRole` keep identical signatures and
  return byte-identical status codes and bodies across all ~50 gated routes.
- Added opt-in `requirePermission()` with a permission catalog derived from `User.role` —
  no schema, session, or token change, and no permission can exceed its role.
- Better Auth OTP delivery now goes through the module's `sendLoginOtp` use case
  (communications `SmsPort` + dev echo store); `callbackOnVerification` uses
  `userRepository.updatePhone` instead of a direct `prisma.user.update`.
- OTP expiry is a single shared constant, so the plugin config and SMS copy can't disagree.
- Better Auth remains the session authority — no parallel JWT/refresh-token stack.

## Modular Monolith Phase 3 — Safety-Location Module (ADR-022)
- Extracted `packages/services/src/modules/safety-location` with domain helpers (maps,
  alert kind, dispatch message builders), application use cases (SOS CRUD, rider location,
  Places, fan-out), and ports/adapters for repositories, partner dispatch DTOs, emergency
  contacts, Places (Google + Redis), and in-app notifications.
- `SOSService`, `SOSDispatchService`, `RiderLocationService`, `PlacesService`, and `sos-maps`
  remain compatibility facades — no `/api/*` or Flutter contract changes; business rules
  preserved (RED/AMBER prefixes, dispatch summary fields, PostGIS stale windows, Places
  cache key formula).
- Characterization tests cover alert kind, message builders, rider-location mapping, profile
  warning, fan-out accounting, and `@bikie.local` email skip.

## Security + Layering P0 Hardening (Audit Follow-up)
- `requireRole` / `requireMembership` now share `requireSession`'s banned/suspended account check.
- Better Auth `user.role` is no longer client-writable (`input: false`); Partner/Admin changes stay on server paths only.
- `/api/dev/otp` and `DevOtpStore` are opt-in (`SHOW_OTP_TOAST=true`) and always disabled in production.
- Removed direct Prisma from `user/phone`, `users/me/presence`, `sos/alerts`, and `admin/export` routes; added `UserService`/`SOSService`/`AdminService.exportCsv`/`AuditService` facades.
- Added `updateUserPhoneSchema` + `adminExportQuerySchema` validation.

## Modular Monolith Foundation — Communications Ports (ADR-021)
- Added Cursor agent/rule/skill governance under `.cursor/` and the audit-first plan in
  `project doc/MODULAR_MONOLITH_IMPLEMENTATION_PLAN.md`.
- Introduced communications ports/adapters (`EmailPort` / `SmsPort` / `WhatsAppPort` /
  `PushPort`) under `packages/services/src/modules/communications`. Legacy
  `EmailService` / `SMSService` / `WhatsAppService` / `PushService` remain as compatibility
  facades — no API/import breakage.
- SOS dispatch now uses communications ports and `partnerRepository.findPartnersByCityForDispatch`
  instead of importing Prisma in the service layer.
- Provider HTTP calls share a timeout helper (`PROVIDER_HTTP_TIMEOUT_MS`, default 10s).
- Added Vitest (`pnpm test` / `pnpm test:watch`) with characterization tests for SOS map/phone
  helpers and DEV adapter fallbacks.

## SOS Email + WhatsApp Sent Directly (SMTP / Meta Cloud API)
- `EmailService` now delivers over plain SMTP via `nodemailer` (`SMTP_HOST`/`SMTP_USER`/
  `SMTP_PASS` — a Gmail App Password is enough), so alerts reach real inboxes from local.
  Resend is demoted to a fallback used only when SMTP is unset.
- `WhatsAppService` now sends through Meta's WhatsApp Cloud API (`WHATSAPP_ACCESS_TOKEN` +
  `WHATSAPP_PHONE_NUMBER_ID`) and follows the text with a **native WhatsApp location card**.
  Twilio WhatsApp is the fallback; outside the 24h window the send retries as an approved
  template (`WHATSAPP_TEMPLATE_NAME`).
- With no credentials, WhatsApp emits a `wa.me` click-to-send link per recipient (logged as
  `[SOS][DISPATCH][WA-LINK]` and returned as `whatsappClickToSend`) so alerts can still be
  pushed by hand during testing.
- Delivery is now measured, not assumed: SMS/email/WhatsApp services return
  `{ ok, provider, error }`, and the dispatch summary reports `smsSent` / `whatsappSent` /
  `emailSent` alongside the attempt counts plus an `errors` list with the provider's own
  rejection text.
- Docs: ADR-020 in `.docs/DECISIONS.md`, credential walkthrough + provider-selection Mermaid
  diagram in `project doc/SOS_E2E_TESTING.md`, new env vars in `.env.example`.

## SOS Map Links + Live Test Contacts
- SOS messages (SMS / WhatsApp / email / in-app) now include WhatsApp-style location sharing:
  a Maps **pin** plus a **navigate** link (`/maps/dir/?api=1&destination=…`) so recipients see
  distance/route from their own GPS. Nearby riders also get PostGIS approx distance in copy.
- Notifications UI: clickable Maps URLs + orange "Open in Maps" CTA for `SOS_ALERT`.
- Seed nearby riders updated to live test WhatsApp `+918107800370` / `+919664361738` and
  emails `arun8107800370@gmail.com` / `sharmamo@gmail.com`.
- Testing docs: Mermaid flow diagrams in `project doc/SOS_E2E_TESTING.md`.

## SOS Dispatch Fan-out (Red / Amber → SMS + WhatsApp + Email)
- Wired `SOSDispatchService.fanOut` into `POST /api/sos/alerts`: after persist + SSE broadcast,
  notifies nearby riders (PostGIS around alert GPS), same-city service providers, and the
  reporter's emergency contacts via SMS (`SMSService`), WhatsApp (`WhatsAppService` — new),
  email (`EmailService`), and in-app/push (`NotificationService` / `SOS_ALERT`).
- New `findNearbyAroundPoint` repository helper so SOS does not require the reporter to have
  opted into live location sharing.
- Seed extended with Premium membership for `rider@bikie.app`, emergency contacts, Bangalore
  partner contact mobiles, and two nearby riders with PostGIS fixes for E2E testing.
- Docs: `project doc/SOS_DISPATCH_PLAN.md`, `project doc/SOS_E2E_TESTING.md`. Live credentials
  remain optional — unset Twilio/Resend keys log `[SMS|WHATSAPP|EMAIL][DEV]`.

## Nav Copy: Explore Bikes → Rent a Bike
- Renamed the user-facing "Explore Bikes" label to "Rent a Bike" across the navbar,
  footer/mega-menu, explore page title/breadcrumbs, 404/error CTAs, and empty states.
  The `/explore-bikes` route path is unchanged.

## Docker Deployment + Brand Mark Consistency
- Added `Dockerfile` / `docker-compose.yml` / `docker/entrypoint.sh` to run the web app in a
  container against the existing Neon database, reading secrets from `apps/.env`. The
  entrypoint applies `prisma migrate deploy` before starting the server.
- The container's internal `PORT` is pinned to the published host port (3001) because Server
  Components self-fetch `/api/*` using the request's `Host` header (`apps/web/lib/api.ts`) — a
  mismatch made every authenticated (uncached) page fail with `ECONNREFUSED` and render the
  500 page after login.
- New `--color-brand` token (`#FF4D1A`) and a shared `LogoMark` component
  (`apps/web/components/layout/LogoMark.tsx`). The navbar, footer, login, signup, onboarding
  and partner-onboarding logos previously used the indigo `bg-accent` fill, which read as a
  blue tile; they now all match the orange "B" mark from the `/welcome` splash.

## "Continue with Google" Sign-In
- Added Google as a Better Auth social provider (`socialProviders.google` in
  `packages/auth/src/server.ts`) — a standard OAuth2 flow, not Firebase Authentication. No
  migration needed; `Account`/`User` already support arbitrary OAuth providers.
- "Continue with Google" button added to both `/login` and `/signup`.
- New Google sign-ups default to `RENTER`; Partner is available afterward via the existing
  self-service upgrade path.
- Filled in the previously-blank client-side Firebase config vars (`NEXT_PUBLIC_FIREBASE_*`) in
  `apps/web/.env.local` from the user's Firebase web app snippet — completes the client half of
  ADR-016's push notifications; sending still needs a separate service account key.
- See `.docs/DECISIONS.md` ADR-017 for why the pasted Firebase config wasn't the credential
  Google login actually needed, and what account-linking/role behavior was chosen.

## Nearby Riders, Nearby Help, Push Notifications
- New `RiderLocation` model (PostGIS `geography(Point,4326)`, opt-in `sharingEnabled` flag,
  default off) powers "Nearby Riders" — `GET /api/riders/nearby?radiusKm=` self-joins on the
  caller's own fix as the search center, `PUT /api/rider-location(/consent)` for updating it,
  all `requireMembership()`-gated. New `/dashboard/nearby` page + a Settings toggle. A new cron
  (`/api/cron/rider-location-cleanup`) auto-disables sharing after 30 minutes of inactivity.
- New "Nearby Help" tab on `/dashboard/sos` — `PlacesService` calls Google's Places API (New)
  `searchNearby` server-side (key never reaches the browser), cached in Upstash Redis and
  rate-limited, listing petrol pumps/mechanics/hospitals with map-key-free directions links.
- Firebase Cloud Messaging wired into every existing notification type at once via a single
  hook in `NotificationService.notify()` — no per-call-site changes needed. New
  `PushSubscription` model, `PushService` (dead-token cleanup included), service worker,
  `push-notifications.ts`, and a Settings toggle.
- `.env.example`: added `GOOGLE_PLACES_API_KEY` and `CRON_SECRET`; moved Firebase config to
  "ACTIVE" and filled in the three vars its client config was missing.
- Resolved pre-existing migration drift on the dev database (undocumented `message_reaction`
  table, `TripStatus` enum values, `message.metadata`, `user.lastActiveAt`) via `prisma migrate
  reset`, per explicit user consent — see ADR-016 for what that did and didn't restore.
- See `.docs/DECISIONS.md` ADR-016 for the full design, including why native mobile push and a
  rendered Google Map are explicitly out of scope for now.

## Rider Registration Restructure + Modal Panic UI
- Removed the "Full name" field from `/signup`'s OTP step — name is no longer collected during
  phone+OTP verification for either Rider or Partner. `PATCH /api/user/complete-phone-signup`
  now only applies the role picked on `/welcome`; `name` is optional in its schema/service.
- `/onboarding`: added a Full Name field and a rider photo upload (via the existing
  `/api/upload` Cloudinary route + `authClient.updateUser`), and reordered the form to Vehicle
  details → Rider profile → Driving licence → Address → Emergency contacts → Government ID →
  Riding details, matching a provided rider-registration reference mockup. The form stays fully
  skippable, name included, per explicit user decision.
- Split `RiderProfileExtraFields` into 4 exported sub-components (`VehicleDetailsFields`,
  `RiderPersonalFields`, `GovernmentIdFields`, `RidingDetailsFields`) so onboarding can reorder
  them independently; the combined `RiderProfileExtraFields` export (used by Settings) is
  unchanged.
- `/partner-onboarding`: added a Full Name field, since Partner signups also stopped getting a
  name from the OTP step.
- `PanicButtonSection`: replaced the inline expanding panel with a modal confirm flow — Red is a
  single "Are you sure?" tap, Amber picks a category inside the modal — and moved the section
  above the Hero on the homepage. GPS is captured silently when the modal opens; a city field
  only appears if geolocation fails.
- Documented `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER` in `.env.example` —
  `SMSService` already used them, they just weren't listed; no code change to SMS delivery.

## OTP Toast for Testing Builds
- Removed `NODE_ENV === "production"` guards from `DevOtpStore` and `/api/dev/otp` route —
  now gated by `SHOW_OTP_TOAST` env var (defaults to enabled in `.env.example`).
- Added `ToastProvider` to root layout so auth pages can display toasts.
- Replaced the dashed-border "Dev mode" OTP box on `/login` and `/signup` with a toast
  notification that shows the verification code automatically after "Send code" is clicked.

## Homepage Panic Button
- Replaced the small "Ride Safe" link in the Hero with a full Red Alert / Amber Alert section
  (`apps/web/components/home/PanicButtonSection.tsx`) right below the Hero, matching a
  provided reference design — category chips per alert kind, GPS/city capture, and a real
  submit flow through the existing `POST /api/sos/alerts` (same membership gate, rate limit,
  and profile-completeness warning as the dashboard SOS page).
- Category mapping: the backend's `SOSAlertType` enum has no dedicated Puncture or Fire/Hazard
  value, so Puncture maps to `BIKE_BREAKDOWN` and Fire/Hazard to `OTHER` — the specific label
  is preserved in the alert's description text so responders still see it.
- Not real: the WhatsApp and "Emergency Services"/"Service Provider" pill labels match the
  reference design's copy but aren't wired to any integration — only SMS (via the existing
  dev-console-log-fallback `SMSService`) and in-app "Fellow Riders" alerting are functional.
- Noted, not changed: `apps/web/middleware.ts` (pre-existing, unmodified this session) already
  redirects every route except `/welcome`/`/login`/`/signup` to `/login` when there's no
  session — so this new section, like the rest of the homepage, isn't actually reachable by a
  logged-out visitor today.

## Rider Profile Validation
- Added real validation to `riderProfileSchema` (`packages/validation/src/rider-profile.schema.ts`),
  used both server-side (`PUT /api/rider-profile`) and client-side (`/onboarding`, the
  Settings "Rider Details" section) so the two can't drift apart: date of birth must put the
  rider between 18-100 years old, pincode must be 6 digits, driving licence expiry can't be
  in the past, Aadhaar must be exactly 12 digits / passport a plausible format (cross-checked
  against whichever ID type is selected), and emergency-contact phone numbers must be 10-15
  digits (spaces/hyphens stripped before checking, matching the form's placeholder format).
  Found via a real test submission with a 2020 date-of-birth (making the "rider" 5 years old)
  and an 8-digit "Aadhaar" number — both now caught client-side before ever reaching the API,
  with the actual validation messages shown instead of a generic "Something went wrong."
- The onboarding/settings forms now build a `body` object, run it through
  `riderProfileSchema.safeParse()`, and send `parsed.data` (not the raw body) — new shared
  `apps/web/lib/format-zod-error.ts` turns a validation failure into a plain-language message
  list.

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
