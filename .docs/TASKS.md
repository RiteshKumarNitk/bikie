# BIKIE — Tasks

Status values: Backlog, Planned, In Progress, Blocked, Review, Completed.

## Onboarding Field Expansion + Welcome/Login Fixes (2026-07-16, ADR-014)

Follow-up round: a crash fix, an admin-login gap fix, and a second reference doc's onboarding
field list adopted onto the existing models (not its parallel schema — see ADR-014).

| Task | Status |
|---|---|
| Bug fix: stale Turbopack cache crash (`phoneInput is not defined`) on `/login` — confirmed source was already clean, no code change needed beyond a dev-server/browser refresh | Completed |
| Bug fix: `/login`'s full rewrite to phone/OTP had silently dropped the only UI path to email/password sign-in, which would have locked out the seeded admin account (email/password, no phone number). Added an "Log in with email instead" fallback toggle | Completed |
| `PhoneNumberInput` shared component: country-code dropdown (India +91 default, USA +1) + 10-digit number field, replacing the old free-form phone text input on both `/login` and `/signup` | Completed |
| `/welcome`: role selection now routes to `/login` for both roles (was: straight to homepage/marketing, no login required) — matches the client's described flow; visuals updated to a circular glowing logo badge + tagline + background image, closer to a provided reference mockup, still on the existing dark-navy/indigo theme | Completed |
| `RiderProfile` extended with father/mother name, DOB, gender, blood group, medical history, allergies, vehicle type/brand/model, government ID type+number (raw text, no verification), rider frequency, riding club type+name — migration applied live. New fields added to both `/onboarding` and the Settings "Rider Details" section | Completed |
| `Partner` extended with Aadhaar number + 2 contact persons (name+mobile) — migration applied live. New fields added to the shared partner-signup component, wired through both the signup and login-upgrade flows | Completed |
| Not built (explicit user decision): the reference doc's parallel `Biker`/`Provider`/`PanicAlert`/`Trip`/`Booking` schema — the existing `User`/`Partner`/`SOSAlert`/`Trip`/`Booking` models already cover this, adopting the doc's models too would duplicate/replace working systems for no gain | Deferred |

## Product Requests (2026-07-15)

Real bug report plus a batch of product asks from a client meeting, scoped down per explicit
user decisions (see ADR-012 in `.docs/DECISIONS.md` for what was descoped and why — no
Aadhaar/KYC verification, no mobile+OTP login, dark theme kept as-is).

| Task | Status |
|---|---|
| Bug fix: `/dashboard/requests` approve/reject called a `PATCH` method that doesn't exist on `/api/trips/[slug]/requests` (405, silently no-op) — now calls the real `POST .../requests/[id]/approve\|reject` routes, with error feedback surfaced on failure (e.g. `NO_SEATS`) | Completed |
| Homepage: new "Upcoming Rides" section (`components/home/UpcomingRides.tsx`, backed by `GET /api/trips?tab=upcoming`) — previously the homepage had zero ride content | Completed |
| Homepage: SOS CTA added to the Hero, linking to the existing `/dashboard/sos` feature (no new "nearby riders" live-location system built — explicitly descoped) | Completed |
| `/welcome` role-select page redesigned from full-bleed photo panels to a compact centered-logo + two-card layout, dark theme kept (no orange/purple) | Completed |
| New `RiderProfile`/`RiderEmergencyContact` schema + migration (applied live) + full API (`GET/PUT /api/rider-profile`, `POST /api/rider-profile/skip`) — driving licence, address, up to 3 emergency contacts | Completed |
| New skippable onboarding form (`/onboarding`), gated only on new rider signups (partner signups unaffected) | Completed |
| Dashboard Settings: dead "Emergency Contacts... coming soon" stub replaced with a real editable "Rider Details" section wired to the RiderProfile API. "Documents" upload stub intentionally left as-is (separate, larger feature) | Completed |
| Chat UI (Milestone 8.4): reply/edit/delete/reactions/typing/read-receipts — see that milestone's row below for detail | In Progress |
| Not built (explicit user decision): Aadhaar/government-ID verification (needs a licensed third-party vendor) | Deferred |
| **Follow-up (2026-07-15): mobile number + OTP login built after all** — see ADR-013 below | Completed |

## Phone Number + OTP Login (2026-07-15, ADR-013)

Reversed the "hold off on OTP" call from the row above once asked to build it anyway, for
both Rider and Partner. See ADR-013 in `.docs/DECISIONS.md` for the full design.

| Task | Status |
|---|---|
| Schema: `User.phoneNumber` (unique) / `phoneNumberVerified`, migration applied live (user-approved after an auto-mode safety check on the direct-DB-write step) | Completed |
| Better Auth `phoneNumber` plugin wired (`packages/auth/src/server.ts`): send/verify OTP, auto-register on first verification with a placeholder name/email, `callbackOnVerification` keeps the pre-existing `User.phone` field in sync | Completed |
| OTP delivery via the existing `SMSService` — console-logs the code when Twilio isn't configured (true today), sends real SMS the moment `TWILIO_*` env vars are added, zero code change needed either way | Completed |
| `GET /api/auth-helpers/phone-exists`, `PATCH /api/user/complete-phone-signup` (sets real name + role once, right after a brand-new phone's first verification), `POST /api/user/become-partner` (self-service Rider → Partner upgrade) | Completed |
| `/signup` and `/login` rewritten from email+password to phone+OTP for both roles; Settings gained a "Become a Service Provider" action (sign out → `/welcome` → re-verify same phone → business details → upgraded) | Completed |
| Fixed in passing: the partner-type list on signup was missing `FUEL_DELIVERY` (out of sync with the schema's 8-value enum) — now sourced from the same validated enum everywhere | Completed |

## Pre-Launch Audit Fixes (2026-07-14)

A full cross-functional audit (architecture, product/UX, security, performance, mobile,
community/admin) was run against the whole codebase and produced 42 findings (2 Critical,
12 High, 19 Medium, 9 Low). All 42 were fixed in this pass. Highlights:

- **Critical**: booking creation had no protection against two renters double-booking the
  same bike for overlapping dates — fixed with a transaction that locks the `Bike` row and
  checks for overlapping non-cancelled bookings before creating (`createBookingIfAvailable`
  in `booking.repository.ts`), returning a clean 409 instead of racing. The public navbar
  rendered no navigation at all for logged-out visitors/crawlers (nav config was keyed off a
  role-selection cookie with no default) — now defaults to the rider/public nav.
- **High**: added rate limiting (Better Auth's built-in limiter now backed by Upstash Redis
  `secondaryStorage` so it survives across serverless instances, plus per-route limits on SOS
  alert creation and message sending); rewrote the upload endpoint to validate size/MIME/magic
  bytes and upload to Cloudinary instead of writing to Vercel's ephemeral local filesystem;
  fixed admin "delete user" throwing an unhandled FK-constraint error (now a clean 409); added
  route-level loading/error boundaries; consolidated two competing `Skeleton` implementations
  down to one (`@bikie/ui`); added `robots.ts`/`sitemap.ts`; fixed the mobile app's release
  build silently defaulting to a known-broken production API; added real mobile test coverage
  (was a single trivial smoke test); built the Reports/Moderation admin UI and wired the
  already-existing notification feed to its expected `/dashboard/notifications` URL with a
  navbar bell — both were previously complete on the backend with no UI in front of them.
- **Medium/Low**: missing FK indexes, review-creation and trip-slug creation races, CSV
  formula-injection in admin export, a leaked participant email in 1:1 conversations, Zod
  validation gaps across ~15 routes, security headers, ride-discovery search/filters, two
  dead-end "manage" stub pages, a hardcoded "Pending Approvals" stat, admin Groups CRUD and
  editable Trips, and more — see the audit artifact for the full itemized list.
- As a side effect, two items in the pre-existing backlog below are now resolved: the rider
  dashboard Notifications tab (now the real feed, not a stub) and the read-only Admin Trips
  page (now has edit/cancel/delete) — both removed from the backlog table.
- Not run: applying the two new FK-index-only migration was safe and was applied directly to
  the live DB (additive `CREATE INDEX`, no data risk); no other schema/data migration was run
  against the shared DB in this pass.

## Milestone 8 — Community Platform v2 (Ride Rooms, Encrypted Chat, Moderation, Mobile Parity)

See ADR-011 in `.docs/DECISIONS.md` for the full architecture. Triggered by a full-project
audit that found Communities/Groups/Clubs/Events/Reports/Moderation/Notification had no
Prisma models at all, and chat had zero encryption + a realtime mechanism confirmed broken
across Vercel's serverless instances.

| Task | Status |
|---|---|
| 8.0 — ADR-011 written; ARCHITECTURE.md/API.md doc stubs | Completed |
| 8.1 — Schema/migration (Group, GroupMember, Announcement, MessageAttachment, MessageReceipt, Report, ModerationAction, Notification, field additions, `TripType.EVENT`); migration applied to the live DB (user-approved). `encrypt-existing-messages.ts` backfill script written, **not run** (needs separate explicit sign-off — no plaintext-message backfill has occurred) | Completed |
| 8.2 — Upstash Redis realtime swap (`RealtimeService`: per-user inbox + non-destructive cursor-based broadcast channels for global/admin), `sse-manager.ts` deleted, SSE route + SOS route migrated | Completed |
| 8.3 — Encryption (AES-256-GCM, `message-crypto.ts`) + Message model overhaul (reply/edit/delete/per-participant receipts/system messages). Verified live: message send/edit/delete/typing/read-receipt all confirmed working via the API; direct DB inspection confirmed `content` is null and `ciphertext` populated for new messages | Completed |
| 8.4 — Chat UI (web): reply/edit/delete/emoji reactions/typing indicator/read receipts UI (`apps/web/components/chat/ChatArea.tsx`, `MessageItem.tsx`) — all wired to the already-complete 8.3 backend, no server-side changes needed (typing/edit/delete/reaction/read-receipt SSE fan-out was already implemented in `MessageService`, just not yet consumed client-side). Cloudinary upload/attachment composer UI still not built (`MessageAttachmentDTO`/backend attachment support exists, no image/file picker wired in) | In Progress |
| 8.5 — Ride Room **backend**: `assertRideRoomAccess` guard, `Announcement` service/repo, `/api/trips/[slug]/room/**` routes (room/announcements/meeting-point/emergency-contacts/media). Typecheck-clean, not live-tested (see note below) | Completed (backend) |
| 8.5b — Ride Room **web UI**: `/dashboard/rides/[slug]/room` page with tabs | Planned |
| 8.6 — Reports + Admin Moderation **backend**: `ReportService`/`ModerationService`, warn/mute/suspend/ban/restore, conversation lock/delete, message delete, `AuditLog` integration, BANNED/SUSPENDED enforcement in `requireSession`, MUTED enforcement in `MessageService.sendMessage`. Typecheck-clean, not live-tested | Completed (backend) |
| 8.6b — Reports + Admin Moderation **UI**: `/admin/moderation` (Reports queue with status/target-type filters, per-report detail panel, warn/mute/suspend/ban/restore actions, message delete, conversation lock/unlock/delete — all wired to the existing 8.6 routes) plus `/admin/reports` disambiguated to "Revenue Reports" (unrelated business-reporting stub) so the two no longer collide in the nav. Typecheck-clean, not live-tested (see 8.6 note) | Completed |
| 8.7 — Admin dashboard build-out: **Rides edit/cancel** (`/admin/trips` — new `AdminService.updateTrip`/`deleteTrip` + `GET/PATCH/DELETE /api/admin/trips(/[id])`, edit modal covering title/description/seatsTotal/dates/status, one-click "Cancel Ride") and **Groups CRUD** (`/admin/groups` — new `AdminService.getAllGroups`/`createGroup`/`updateGroup`/`deleteGroup` + `GET/POST /api/admin/groups`, `PATCH/DELETE /api/admin/groups/[id]`, full create/edit/delete table filterable by COMMUNITY/CLUB) done. Still Planned: Ride Requests admin view, Notifications broadcast UI | In Progress |
| 8.8 — Mobile parity (`ride_room`, `notifications` Flutter features) | Planned |
| 8.9 — Docs update + backlog log (below) | Planned |

Note on "not live-tested": the permission classifier blocks further ad hoc data-mutating test
calls against the shared prod/dev DB beyond the initial migration + encryption verification
already approved; the user chose "code review only" for the remainder of this build rather
than granting broader live-testing permission. 8.5/8.6/8.6b/8.7 backends are typecheck-clean
and traced against the same call patterns already verified working in 8.1–8.3, but have not
been exercised end-to-end via real HTTP calls the way messaging was.

## Backlog — pre-existing bugs found during Milestone 8's pre-build audit (not in scope for Milestone 8)

Deferred per explicit user decision — tracked here for a future pass:

| Bug | Area |
|---|---|
| Partner Fleet Add/Remove buttons POST/DELETE to `/api/admin/bikes` (ADMIN-only) — 403s for real partners in production | Partner dashboard |
| No bike edit/update capability anywhere for partners | Partner dashboard |
| Partner Bookings page is read-only, no accept/reject route exists | Partner dashboard |
| Partner Settings/business-profile page is read-only despite a working `PUT /api/partner/profile` underneath | Partner dashboard |
| `/partners/services` promises 8 partner types (mechanic, fuel delivery, tour guide, hotel, camping, accessories, photography); dashboard only supports bike-fleet listing | Partner marketing vs. dashboard gap |
| `lib/partner-content.ts` (services/benefits/pricing/success-stories) is 100% hardcoded, no admin CMS management | Partner marketing |
| `/community` page's "Featured Riders" and "Rider Clubs" sections are still hardcoded fake data with dead-click cards, zero API calls (the "Upcoming Rides" section was fixed — now shows real API-backed rides with working Create/Join CTAs, per direct user report of not being able to find ride creation) | Rider public site |
| `/clubs` page is 100% hardcoded fake data; "+ Create Club" CTA is non-functional | Rider public site |
| Contact form (`ContactForm`) never calls an API — `onSubmit` just sets local state, message is never sent | Rider public site |
| `/safety-center` is static hardcoded topics, no API | Rider public site |
| Settings page has two dead "coming soon" stub sections (document upload, emergency contacts — note: ride-level emergency contacts are being built in Milestone 8, but this is a *profile-level* stub, distinct) | Rider dashboard |
| Admin Settings page is a non-functional stub (readOnly inputs, no save) | Admin |
| CMS is limited to Testimonials only; no generic content/page management | Admin |

## Milestone 7 — Rides: Community v1

| Task | Status |
|---|---|
| Schema: `ParticipantStatus` request/approve enum, `TripParticipant.message`/`decidedAt`, `Trip.meetingPoint`, `Conversation.tripId` (ADR-010) | Completed |
| Data migration: remap 2 live `JOINED` rows → `APPROVED` inline during enum swap | Completed |
| Repository + service: request/approve/reject/leave, atomic seat accounting, group conversation creation, ride stats | Completed |
| `POST /api/trips` (ride creation, membership-gated) | Completed |
| `/api/trips/[slug]/requests` (POST request, GET organizer queue), `/requests/mine`, `/requests/[id]/approve`, `/requests/[id]/reject`, `/leave`, `/group` | Completed |
| `/api/trips/mine` extended with `requested` + `stats` | Completed |
| Web: `/trips/create` ride creation form | Completed |
| Web: `RideActionsPanel` (replaces `JoinTripCard` stub) — request/pending/approved states + organizer request-review queue | Completed |
| Web: Ride Group entry via `?conversation=` deep link into `/dashboard/messages` | Completed |
| Web: `/dashboard/trips` extended with Requested section + reputation stat tiles | Completed |
| Nav/copy relabel "Trips" → "Rides" | Completed |
| End-to-end browser verification (Playwright: create → browse → request → approve → group chat) | Completed — found and fixed a real bug (unauthenticated visitors could see the full create-ride form before the redirect fired; now gated on `session` before render, not just a `useEffect` side-effect) |
| Bug fix: `/dashboard/trips` had no path to `/trips/create` — the "Rides You Organize" section rendered nothing at all when empty, so a rider who hadn't organized a ride yet had no way to discover ride creation from the dashboard. Added a "+ Create a Ride" header button plus an `EmptyState` CTA in that section; also fixed `requireMembership()`'s 403 payload, which was returning SOS-specific copy ("SOS Emergency is a BIKIE Membership perk...") for the shared membership gate used by ride creation | Completed |
| Mobile port (Milestone 7b): ride browse list + detail screen (`apps/mobile/lib/features/trips/*`) | Completed (undocumented until now) |
| Mobile port (Milestone 7b): request-to-join, organizer's request-review screen, ride creation | Backlog |
| Rider-to-rider reviews, badges, membership tiers, clubs (deferred per ADR-10) | Backlog |

## Milestone 6 — Mobile App

| Task | Status |
|---|---|
| Better Auth `bearer` plugin (ADR-007) | Completed |
| `POST /api/bookings` (booking creation, service + repository + route + validation) | Completed |
| `POST /api/bikes/[slug]/reviews` (review creation, gated on completed booking) | Completed |
| Wishlist add/remove (`POST`/`DELETE /api/wishlist/[bikeId]`) | Completed |
| `.docs/API.md` reconciliation (undocumented routes, stale entries, bearer auth section) | Completed |
| Flutter scaffolding (`apps/mobile`), theme parity, networking layer, auth flow | Completed |
| Browse/search screens (bikes, destinations, trips) | Completed |
| Bookings, reviews, wishlist screens | Completed |
| SOS, membership, referrals screens | Completed |
| Messaging (polling), profile, polish | Completed |
| Bundle Inter font locally instead of `google_fonts` runtime fetch (ADR-008 correction — crashed on a device/emulator with no general internet DNS) | Completed |
| Full on-device smoke test (Android emulator) | Blocked — emulator (`Pixel_9` and `Pixel_3a_API_34`) repeatedly crashes/disconnects within seconds of app launch on this dev machine; appears to be a local virtualization/resource issue, not an app defect. `flutter analyze`/`flutter test` pass; app builds, installs, and launched without runtime exceptions in the one run that got far enough to confirm the font fix. Needs a stable device/emulator to finish. |
| Point mobile app at production API (`https://bikie-web-rs8i.vercel.app`) | Done, with caveat — production has not yet deployed the Phase 0 backend routes (confirmed via curl: no `set-auth-token` header, `POST /api/bookings` → 405, wishlist route → 404) even though the commit is on `origin/master`. App falls back to a local dev server via `--dart-define=API_BASE_URL=...` in the meantime. |

## Milestone 3b — SOS Hardening, Membership Gating, Referrals

| Task | Status |
|---|---|
| SOS alert cards show full reporter info (email, phone, map link) | Completed |
| SOS send/view/respond gated behind active membership (admin bypass) | Completed |
| Referral schema (`User.referralCode` / `referredById`) + migration | Completed |
| Referral API (`/api/referrals/me`, `/api/referrals/link`) + dashboard page | Completed |
| Signup accepts optional referral code / `?ref=` link | Completed |
| Admin Referrals page (`/admin/referrals`) | Completed |
| Dummy payment checkout modal for membership purchase | Completed |
| Admin Membership Plans CRUD (`/admin/membership`) | Completed |

## Milestone 3 — Real-time + Admin Overhaul

| Task | Status |
|---|---|
| SSE endpoint + React hook | Completed |
| AuditLog model + migration + repo + service + API | Completed |
| Audit logging in all admin CRUD routes | Completed |
| Admin charts (recharts) on overview | Completed |
| CSV export API (users/bookings/partners) | Completed |
| Email service (Resend-compatible stub) | Completed |
| SMS gateway (Twilio-compatible stub) | Completed |
| Admin email/SMS send pages | Completed |
| SOS auto-resolve cron endpoint | Completed |
| SOS history API route | Completed |
| CMS testimonial management API + admin page | Completed |
| New admin nav items: SOS, Audit Logs, Testimonials, Email, SMS | Completed |

## Milestone 2 — Messaging, Membership, SOS

| Task | Status |
|---|---|
| Messaging schema + repo + service + API + UI | Completed |
| Membership schema + repo + service + API + UI | Completed |
| SOS schema + repo + service + API + UI | Completed |
| SSE manager | Completed |
| Partner fleet management | Completed |

## Milestone 1 — Foundation

| Task | Status |
|---|---|
| Theme + globals | Completed |
| Login/Register | Completed |
| Navbar + Footer | Completed |
| Admin CRUD (users, partners, bikes, bookings) | Completed |
| Layouts (admin, dashboard, partner) | Completed |
