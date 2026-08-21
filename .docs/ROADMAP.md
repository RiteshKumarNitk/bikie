# BIKIE — Roadmap

## A Partner's Own SOS Offer Was Invisible On Home, Requests, And Active Alike (2026-08-21, ADR-062)
Fixed: an SOS request wasn't visible on a Service Provider's Home, Requests, or Active tab. Traced
against live production data to a real gap, not a display bug — once a partner accepts, their
offer correctly drops off "Nearby Requests" (already responded to) but doesn't appear in "Active
Assistance" until the rider accepts, leaving it invisible everywhere if the rider never responds.
Added a "Pending Responses"/"Waiting for Confirmation" list surfaced on Home, Requests, and Active
on mobile and on the Overview and SOS Emergency pages on web (which previously showed zero SOS
content on its Overview page at all) — also fixed the alert detail screen on both platforms
incorrectly re-showing Accept/Decline for an alert already offered on. See ADR-062.

## Service Providers Wrongly Blocked From SOS Requests By The Rider Membership Gate (2026-08-21, ADR-061)
Fixed: a Service Provider could see an SOS notification but clicking into it returned the Rider
Membership upsell error ("This is a BIKIE Membership perk"), even with an active, separate Partner
Membership. Cause: `GET /api/sos/alerts/[id]` and every other SOS route a helper acts on (offer,
decline, withdraw offer, session view/status) checked only Rider membership, which a
Service-Provider-only account never has. Added a membership gate that reads whichever system
matches the caller's own account type, applied to every route a helper — Rider community-responder
or Service Provider — actually touches. One backend fix covers both platforms, since mobile and
web's partner SOS screens already call the same routes; web also gained the "Subscribe" action
mobile already had for this error. See ADR-061.

## No Cron Scheduler Was Actually Running The 3 `/api/cron/*` Routes In Production (2026-08-21, ADR-060)
Asked whether cron errors could happen in the future; found `sos-escalate`, `sos-resolve`, and
`rider-location-cleanup` were fully implemented but never triggered in production — the real
deployment is a self-hosted VPS via `docker-compose`, not Vercel, and had no cron mechanism at
all. Added a `cron` service to `docker-compose.yml` scheduling all three at their documented
frequencies. See ADR-060.

## SOS Dispatch Moves To The DLT "BIKIE_SR" SMS Template — And A Real Delivery Bug Found (2026-08-20, ADR-059)
Wired MSG91's DLT-approved "BIKIE_SR" template to SOS dispatch SMS for nearby riders and Service
Providers, capped to the nearest 10 recipients per dispatch batch (in-app/WhatsApp/email still
reach everyone nearby — only SMS, which is billed per message, is capped). While wiring it up,
found that SOS SMS to every recipient role has likely been silently failing MSG91's DLT content
filter since the feature launched — the text sent has always been free-form and dynamic (maps
links, GPS, distance), which India's DLT rules don't allow for SMS. Also found BIKIE had no
"vehicle registration number" field anywhere the new template needed — added one to Rider Profile,
mirroring the existing vehicle type/brand/model fields, and surfaced it in both platforms' SOS
detail screens as well as the SMS. Emergency-contact and admin SOS SMS remain on the old,
likely-failing free text for now — no approved template exists for that copy yet. See ADR-059.

## Rider Membership Purchase Sends The "BIKIE_Sub" SMS Confirmation (2026-08-19, ADR-058)
Wired MSG91's already-DLT-approved "BIKIE_Sub" template to fire an SMS confirmation once a Rider
membership purchase succeeds — Sender ID KSHIDL, exact registered text with the rider's name and
renewal date filled in. Deliberately Rider-only: the template's own copy says "annual
Membership," which only describes the Rider plan (₹99/year) — the Service Provider plan is
₹99/month (ADR-056), so this template can't correctly describe that purchase and was never wired
there. The SMS adapter now supports per-call DLT template overrides (previously assumed a single
app-wide template), with every existing SOS-alert caller unaffected. See ADR-058.

## SMS/WhatsApp OTP Channel Toggle; Mobile Release Builds Move To MSG91's Widget SDK (2026-08-19, ADR-057)
Added an SMS/WhatsApp toggle to OTP screens on both platforms, and moved mobile release builds
onto MSG91's Widget SDK (`sendotp_flutter_sdk`) for OTP send/verify, mirroring how web already
worked. Before writing code, the existing MSG91 integration was inspected end-to-end and found to
already match nearly the entire request. Two real MSG91 API constraints were confirmed against
public docs rather than assumed — channel selection only exists on MSG91's *resend* call, never
the first send; and WhatsApp delivery is a Widget-product feature, not confirmed on the older
native API mobile used before — and both were put to the user for a decision before implementing,
since this touches live production authentication. Mobile debug builds deliberately keep the old
backend-proxied flow so the dev-bypass and fixed-test-number tooling keep working (MSG91's real
widget would reject those on contact). No backend changes were needed for the new mobile flow's
verification step — the server already discriminated a widget token from a native code by shape.
Flagged for follow-up: the new response-parsing code and the corrected retry-channel codes still
need a live MSG91 round-trip test (`flutter analyze` and `flutter test` confirm the Dart is
correct — 1 pre-existing unrelated issue, 112/112 tests passed — not that MSG91's real response
shape matches what's assumed). A `flutter build apk --debug` attempt also surfaced a pre-existing,
unrelated Java/Gradle toolchain mismatch in this environment. See ADR-057.

## Service Provider Membership Made Real: Rs 99/month, Optional At Signup, Enforced At SOS Accept (2026-08-19, ADR-056)
The Partner Membership system (plans/checkout/purchase) already existed from ADR-051 but didn't
match the actual product rule: creating a Service Provider profile should never require payment,
operating as one should, and a non-subscriber should see what membership unlocks rather than a
blank dashboard. Fixed all three, plus two real bugs found while doing it. Pricing: the only live
plan was a Rs 0/100-year grandfather plan from ADR-051's launch backfill, offered to every new
signup as a free-forever loophole — added a real Rs 99/month plan and deactivated the old one
(not yet applied to production, exact script in CHANGELOG). Onboarding now stops at the
membership screen (with "Skip for Now") before the dashboard, instead of skipping it entirely.
The dashboard now shows an activation card explaining locked features instead of silently zeroed
stats — and along the way, a real crash was found and fixed on `/partner/fleet` for non-members,
plus misleading "no requests" messaging on `/partner/sos`. The actual authorization gap: SOS
dispatch and the accept endpoint never checked Partner membership at all, only profile status —
fixed server-side on both the dispatch fan-out and the accept call. Mobile audited for parity,
including a real navigation bug where the onboarding screen bounced a brand-new provider back to
a blank form instead of forward. See ADR-056.

## Fixed: Service Provider Accounts Were Created With The Wrong Role — And 500'd On Their Own Dashboard (2026-08-19, ADR-055)
Signing up as a Service Provider produced an account the admin panel showed as
`SERVICE_PROVIDER` with `Role: RENTER`, and that 500'd on first login. Three separate causes.
`role` was frozen at `RENTER` by an older decision that had aged out — the `PARTNER` value was
never actually retired (the admin UI still edits it, and it carries the `fleet:manage`
permission), so Service Providers were denied the one permission that names their job; `role`
now mirrors `accountType` and is written in the same statement, so the two can never disagree.
The 500 was unrelated: partner *pages* let a provider in on `accountType`, but partner *APIs*
also require an active Service Provider membership — correctly, so a new provider can reach the
page that sells one — and six server components turned that expected 403 into an unhandled
throw. They now degrade on 401/403 only, so a real outage still surfaces. Third, Better Auth's
Redis session cache holds a full copy of the user, so Prisma-side writes left production sessions
reporting the old account type and bounced new Service Providers out of onboarding; those writes
now republish the session. See ADR-055.

## Fixed: Docker Production Build Unblocked — DB Reachability at Image-Build Time (2026-08-15, ADR-054)
Moving production Postgres from Neon to a `postgres` Docker Compose service broke
`docker compose build`: 9 public catalog/listing API routes (categories, bikes, destinations,
testimonials, membership plans, etc.) had `revalidate` set, which Next 16 treats as an ISR opt-in
requiring a build-time static snapshot — so `next build` tried to query Postgres while building the
image, before the `postgres` container exists. Fixed by switching those 9 routes to
`dynamic = "force-dynamic"` so the DB is only ever queried at request time, after
`docker compose up`; removed the now-unnecessary `DATABASE_URL`/`DIRECT_URL` build args from the
Dockerfile/docker-compose.yml/turbo.json. Verified `pnpm build --filter=web` completes with no DB
reachable at all. See ADR-054.

## Fixed: Vercel Deploy Unblocked — Business Contact Fields Build Breakage (2026-08-11)
The two most recent pushes weren't appearing on Vercel because `next build` failed outright: the
`businessMobile`/`businessEmail` fields added to the partner forms were never threaded through
`PartnerProfileDTO`/the services layer/the repository (a hard TypeScript error), and separately
the prior commit's `PartnerMembershipPlan`/`PartnerMembership` migration had never been applied to
the database `next build` queries at prerender time, so the new membership-plans route failed with
"table does not exist". Both are fixed: the fields are now threaded through every layer, a missing
migration for the business-contact columns was added, and both pending migrations were applied to
the live database. `tsc --noEmit` and a full local `next build` now both pass cleanly.

## New: Separate Service Provider Membership; Mobile UX Fixes; Admin Category Control (2026-08-11, ADR-051)
Service Providers were being required to hold an active **Rider** membership to operate — a
mismatch, since the two are different roles with different plans/pricing and Service Providers
had no membership feature of their own to buy. `evaluatePartnerCapability` now checks a brand-new,
fully separate, admin-managed Partner Membership (`PartnerMembershipPlan`/`PartnerMembership`) —
yearly by default, admin sets the price, `0` is a first-class free tier that activates with no
payment step. Every existing capable Partner is grandfathered onto a free legacy plan in the same
migration so nobody loses capability at ship time. Alongside this: four mobile UX bugs fixed
(slow logout, no back button on Messages, a silently-broken Business Profile tile, the
availability toggle rendering under the status bar), admin can now set/change a provider's
service category, and "Switch to Rider Mode" no longer appears once already in Service Provider
mode — the underlying dual-capability architecture (ADR-046b/047/048/049) is otherwise untouched,
per explicit product decision. See ADR-051.

## Fixed: Pending-Verification Service Providers Can Now Actually Use the Platform (2026-08-10, ADR-049)
A Service Provider whose verification was still `PENDING` could not toggle Available/Offline,
view their own dashboard, manage bikes/bookings/reviews, or see nearby SOS requests — every
`/api/partner/**` route required full admin `APPROVED` status, contradicting the core product
rule that a Service Provider doesn't need to be verified to operate, only to earn a trust badge.
Fixed by separating capability (an active, non-suspended profile + active membership — unlocks
everything except one legitimately high-trust SOS action) from verification (a separate,
optional, admin-reviewed status). No database migration was needed — the fix turned out to be
entirely in which existing fields the authorization checks read. See ADR-049.

## Fixed: SOS Dispatch Now Notifies Riders and Service Providers Together (2026-08-10, ADR-048)
An audit against an "Uber/Ola-style" dispatch spec found the SOS system already implemented
almost all of it — assignment locking, decline persistence, offer expiry, the full assistance
session lifecycle, participant-gated chat. Two real gaps were fixed: Service Providers were
previously a fallback tier reached only after both rider escalation tiers fully timed out (up to
~20 minutes by default) — now they're dispatched in the same round as nearby riders, at the same
widening radius, so a mechanic can be reached immediately for a bike breakdown instead of waiting
behind two rider tiers. And the existing PII-redaction rule (phone/exact GPS withheld from anyone
not yet assigned) — previously enforced only on the in-app alert-browsing API — now applies to
every outbound channel (SMS, WhatsApp, email, push) too. A responder whose pending offer gets
invalidated by someone else's acceptance is now told directly, instead of only finding out on
refresh. See ADR-048.

## Fixed: ADR-046b Migration Applied Live; Test-Number OTP Bypass; Seed Personas (2026-08-10, ADR-047)
ADR-046b's dual-capability model was fully built but never applied to the live database — this
closes that gap and the related loose ends found while verifying it live. The migration was
applied (confirmed already run on 2026-08-09 with a real `finished_at` timestamp; earlier docs
were stale). Live-DB testing then surfaced a real bug the migration's own backfill couldn't have
caught: 8 accounts (including the seeded `partner@bikie.app`) had the legacy `role: PARTNER` with
**no** `Partner` row at all, so the backfill's `Partner`-join never matched them, leaving them
stranded with `partnerStatus: null` and no way to use Join-as-Service-Provider. Repaired by
resetting those accounts to `role: RENTER` (matching what the migration would have done had a
`Partner` row existed). Also: `seed.ts` was still assigning the legacy `role: PARTNER` to its demo
partner account with no `Partner` row at all — fixed, and expanded to seed all 5 test personas
(Rider, Draft/Pending/Verified Service Provider, Admin). New dev-only fixed-number OTP bypass
(`TEST_RIDER_PHONE`/`TEST_SERVICE_PROVIDER_PHONE`/`TEST_OTP`) lets mobile/API testing skip MSG91
entirely for named numbers, independent of the existing random-code `SHOW_OTP_TOAST` bypass,
always disabled when `NODE_ENV=production`. The full flow (OTP bypass signup/login → become-provider
→ profile → submit → admin approve → availability unlock) was verified live end-to-end against the
real Neon DB and a running dev server, not just unit tests. See ADR-047.

## New: Rider ⇄ Service Provider Dual Capability (2026-08-09, ADR-046b)
One BIKIE account can now hold Rider capability (always on) and Service Provider capability at
the same time. Becoming a Service Provider is no longer an instant self-service role flip that
replaced a Rider's account — it's a real application: fill out a business profile, submit it,
and an admin approves, rejects, requests more information, or suspends it. Once approved, the
same account can switch between Rider and Service Provider modes at will (Navbar/Profile "Switch
Mode") without ever losing either capability. `User.role` now only distinguishes Rider vs Admin;
Service Provider status lives on `Partner.verificationStatus`, decoupled from role entirely. See
ADR-046b — includes a data-backfill migration for existing Service Provider accounts, applied to
the live database 2026-08-09 (see ADR-047 for a follow-up repair of accounts the backfill missed).

## Fixed: New Service Provider Registrations Stuck Showing the Rider Experience (2026-08-09, ADR-046)
A brand-new mobile number registering as a Service Provider had its role correctly set to
`PARTNER` server-side, but the mobile app never refreshed its own local session state afterward —
so it kept showing the Rider Home/tabs/SOS-creation screen instead of the Partner Dashboard built
for it, until a restart. Fixed by refreshing session state right after the role upgrade. Also
closed three defense-in-depth gaps found during the same audit: an unbranched `/sos` route (mobile)
and an ungated `/dashboard/*` (web) that could both still surface the Rider SOS-creation UI to a
Partner outside normal navigation, and a backend `/api/sos/alerts` gap that let a Partner call the
Rider SOS create/browse API directly. Mobile's Partner Profile tab also gained a Business Profile
editor (mirroring web's existing `/partner/settings`), replacing the Rider-only tiles it
previously showed to every role. See ADR-046.

## Fixed: Production Build Was Broken (2026-08-06, ADR-041)
A Vercel deploy failed outright — `/login` crashed while prerendering (`window is not defined`)
because `leaflet` was imported eagerly at module scope in `LocationPicker.tsx`/`PartnersMap.tsx`
and Next server-renders client components for their initial HTML. Fixed by making the Leaflet
import itself a dynamic, browser-only `import()`. Verified by reproducing the failure with a
local production build before and after the fix. See ADR-041.

## Light Theme Removed (2026-08-06, ADR-040)
Dark is now the only theme on web — the sun/moon toggle is gone, and `ThemeProvider` uses
`forcedTheme="dark"` so no stored preference can put anyone back in light mode. Mobile was
already dark-only. See ADR-040.

## Demo Content Removed; Real Multi-Image Upload; Partner Bike-Listing Fixed (2026-08-06, ADR-039)
Categories, destinations, testimonials, and the sample ride catalog removed from both the live
database and the seed script, joining the earlier bike/partner cleanup — all admin/user-created
from here on. Found and fixed a real, load-bearing bug while auditing what would replace them:
Partner Fleet's "Add Bike" posted to the ADMIN-only bike route and 403'd for every real partner
— new `POST/DELETE /api/partner/bikes(/[id])`, ownership-checked, fixes it. Every remaining
URL-text-field image input (Testimonial admin form's avatar, Partner Fleet's bike photo) became
a real upload through the existing Cloudinary endpoint, and `Bike`/`Trip`'s long-unreachable
`gallery` columns are now wired end-to-end with multi-file upload UI on web and mobile (capped
at 8 images). Admin CRUD for Category/Destination still doesn't exist — confirmed, not built,
deferred by explicit user decision. See ADR-039 and `.docs/TASKS.md`.

## SOS Reverse-Geocoded Address (2026-08-06, ADR-038)
SOS notifications (SMS/WhatsApp/email/in-app/push) and both platforms' alert screens now show a
real place name/area ("City Park, Malviya Nagar, Jaipur") instead of raw coordinates, resolved
once at alert-creation time via free OpenStreetMap Nominatim reverse geocoding (no API key/
billing risk, consistent with ADR-036's map choice) and stored on the alert for every downstream
reader to share. Bounded 4s timeout with a silent fallback to city/coordinates on failure — never
blocks or breaks SOS creation. Code-complete on both platforms; the additive migration hasn't
been applied to the live DB yet. See ADR-038 and `.docs/TASKS.md`.

## Android Push Notifications (2026-08-05, ADR-035)
Native FCM for the Flutter Android app, reusing the existing `NotificationService.notify()`
pipeline (no parallel notification system) and the existing web push-token route (extended, not
duplicated, with device metadata). Covers SOS lifecycle, ride community, and chat notifications
automatically — every type already routed through `notify()` reaches Android once a device
registers. Two pre-existing gaps (SOS resolve, and chat messages) fixed in the shared backend
along the way; found and fixed a shared web+mobile deep-link bug (Trip notifications stored an
id instead of a slug). Code-complete on both ends; going live needs two account-side steps not
run automatically: applying the additive migration to the live DB, and registering the Android
app in Firebase console for a real `google-services.json`. iOS explicitly out of scope. See
ADR-035 and `.docs/TASKS.md` for the full breakdown.

## Milestone 1 — Scaffold + Homepage ✅ Completed
Monorepo, Prisma schema (core content models), Better Auth wired to Neon, polished animated homepage.

## Milestone 2 — Full Site + Dashboards ✅ Completed
Multi-page marketing site (full sitemap), dark-default theme, shared layout primitives (mega nav, breadcrumbs, skeletons, empty states, error pages, page transitions), schema expansion (Booking/Review/Trip/Partner), full seed data, and three role-gated dashboards (User/Partner/Admin).

## Milestone 3 — Real-time + Admin Overhaul ✅ Completed
SSE real-time messaging, AuditLog system with admin CRUD instrumentation, admin dashboard charts (recharts), CSV export, email (Resend) and SMS (Twilio) gateway services, SOS auto-resolve cron, SOS history API, CMS testimonial management.

## Milestone 3b — SOS Hardening, Membership Gating, Referrals ✅ Completed
SOS alerts show full reporter info (email, phone, map link); SOS send/view/respond gated behind active membership; referral system (auto-generated codes, signup linking, dashboard + admin pages, tracking only); dummy payment checkout modal for membership purchase; admin Membership Plans CRUD.

## Milestone 8c — Modular Monolith Hardening (in progress)
Strangler migration toward bounded contexts with ports/adapters, without breaking `/api/*`
or Flutter contracts. See `project doc/MODULAR_MONOLITH_IMPLEMENTATION_PLAN.md` and ADR-021/022.
Phase 1–9 foundation landed: communications through OpenAPI contract snapshot (ADR-021–028).
Ride approval is atomic; admin CSV exports are formula-safe and capped at 10k rows;
SOS fan-out is idempotent; message history is bounded; prod rate limits fail closed without Redis;
OpenAPI v1 is published at `GET /api/openapi` (regenerate with `pnpm openapi:generate`).
Business behavior and `/api/*` contracts unchanged. `/api/v2` and facade deletion remain gated;
full async outbox/workers wait on staging NFR baselines.

## Milestone 4 — Real Bookings & Payments (future)
Real Razorpay integration, availability calendar, cancellation policy engine, security deposits.

## Milestone 5 — Advanced Notifications & Location (future)
Push notifications, Mapbox-powered destination maps, nearby attractions, route planning.

## Milestone 6 — Mobile App ✅ Built, pending on-device verification
Flutter app (`apps/mobile`) consuming the existing REST API, renter-facing only (no
partner/admin dashboards on mobile). See `.docs/TASKS.md` for the phase-by-phase task list.

- **Phase 0 — Backend prep** ✅ Completed: Better Auth `bearer` plugin (ADR-007), real
  `POST /api/bookings`, `POST /api/bikes/[slug]/reviews`, wishlist add/remove
  (`POST`/`DELETE /api/wishlist/[bikeId]`).
- **Phase 1 — Flutter scaffolding, theme, auth** ✅ Completed
- **Phase 2 — Browse/search (bikes, destinations, trips) — read-only** ✅ Completed
- **Phase 3 — Bookings, reviews, wishlist (writes, auth-gated)** ✅ Completed
- **Phase 4 — SOS, membership, referrals** ✅ Completed
- **Phase 5 — Messaging (polling), profile, polish** ✅ Completed

`flutter analyze` and `flutter test` pass; the app builds, installs, and launched cleanly
(no runtime exceptions) on an Android emulator. Full interactive on-device smoke testing is
blocked by Android emulator instability on the dev machine used to build this (see
`.docs/TASKS.md`) — needs a stable device/emulator to finish end-to-end verification.

### Milestone 6b — Mobile Realtime (future)
Deliberately trimmed from v1: mobile messaging uses polling against the existing
`/api/conversations` REST routes instead of the cookie-session `/api/sse` stream (Dart has
no mature first-party SSE client, and `/api/sse` is a generic heartbeat channel shared with
SOS, not a per-conversation stream). Revisit by either adapting `/api/sse` for bearer auth
or introducing WebSockets, once real-time chat becomes a priority.

## Milestone 7 — Rides: Community v1 ✅ Built (web), pending mobile port
Pivot in product framing: "find riders, plan adventures, ride together" as a retention layer
alongside rentals — see ADR-010. Web-first per plan; Flutter port not yet started.

- Backend: `ParticipantStatus` request/approve flow (`PENDING → APPROVED|REJECTED`,
  `CANCELLED` on withdrawal), atomic seat accounting, ride creation (`POST /api/trips`,
  membership-gated), organizer request review + approve/reject, ride Group chat auto-created
  by reusing the existing `Conversation` model (no new chat infrastructure), simple
  computed reputation stats on `/api/trips/mine`.
- Web UI: `/trips/create` (ride creation form), `RideActionsPanel` (replaces the old
  no-op `JoinTripCard` stub — request-to-join form / pending state / approved state /
  organizer's request-review queue, all in one component branching on session), ride Group
  entry via a `?conversation=` deep link into the existing `/dashboard/messages` page,
  `/dashboard/trips` "My Rides" page extended with a Requested section and stat tiles.
  Verified end-to-end in a real browser (Playwright) — full loop: create → browse →
  request → approve → group chat, zero console errors.
- Nav/copy relabeled "Trips" → "Rides" (Navbar, Footer, MegaMenu, dashboard sidebar,
  breadcrumbs) — cosmetic only, per ADR-010.

**Deferred** (see ADR-010 for why): rider-to-rider reviews, badges, membership tiers
(Guest/Member/Verified Member), clubs, live location, photo albums, checklists. "Required
Bike Type" and structured "Rules" (helmet/no-rash-riding/follow-leader) from the original
product brief were folded into the free-text description for v1 rather than becoming
structured fields — revisit if organizers want filtering/enforcement on them.

### Milestone 7b — Rides on Mobile (partially started)
A read-only ride browse/list + detail port already exists undocumented in
`apps/mobile/lib/features/trips/*` (mirrors the web browse experience). Still
backlog: request-to-join, organizer's request-review screen, ride creation
form, and a Ride Group entry point into the existing polling-based messaging
screens (Milestone 6b).

## Milestone 8 — Community Platform v2 (in progress)
Triggered by a full-project audit (pre-build, per user request) that found Communities,
Groups, Clubs, Events, Reports, Moderation, and Notifications had no Prisma models at all,
and that chat storage/realtime had real gaps: plaintext messages with zero encryption
infrastructure, and an in-process SSE `Map` confirmed broken across Vercel's independent
serverless function instances. See ADR-011 in `.docs/DECISIONS.md` for the full design and
`.docs/TASKS.md` for phase-by-phase status.

- **Ride Room**: every approved ride auto-gets a private room (existing `Trip`↔`Conversation`
  pair, extended with Announcements, Meeting Point, Emergency Contacts, Shared Media),
  access restricted to Organizer + Approved Riders + Admin.
- **Production-ready chat**: real-time delivery, per-participant read receipts, delivered
  status, typing indicator, reply/edit/delete, emoji, image/file sharing (Cloudinary),
  system messages.
- **Message encryption**: AES-256-GCM, server-only key, never exposed to any client —
  admin moderation decrypt path goes through the same authorized read path as everyone
  else, audited via `AuditLog`.
- **Admin moderation**: view/moderate every Ride Room and conversation, delete messages,
  warn/mute/suspend/ban users, close/delete rooms — every action written to `AuditLog` plus
  a new `ModerationAction` trust-and-safety ledger.
- **Reports**: users can report spam/abuse/fake accounts/dangerous behaviour/harassment/scam;
  land in Admin → Safety → Moderation (Reports tab), with a Conversations tab for
  lock/unlock/delete. The pre-existing `/admin/reports` nav item is a *different*,
  unrelated business-reporting stub (revenue/booking exports) — relabeled "Revenue
  Reports" in the nav so it no longer collides in name with this trust-and-safety feature.
- **Realtime infra**: Upstash Redis (REST client) replaces the broken in-process SSE `Map`.
- **Groups/Communities/Clubs**: one new `Group` model (`GroupType: COMMUNITY | CLUB`),
  admin-seeded only in this pass — see ADR-011 for why user-facing creation is deferred.
- **Events**: a new `TripType.EVENT` value, not a new model.
- **Mobile parity**: Ride Room, Group Chat, Notifications ported to Flutter, consuming the
  same REST API — no mobile-only endpoints.

**Explicitly deferred**: user-facing Group creation/joining (Milestone 8b), Polls, Live
Location. **Explicitly out of scope for this milestone**: ~15 pre-existing bugs found during
the audit (Partner Fleet CRUD 403, Contact form not wired, `/community`/`/clubs` fake data,
etc.) — tracked as a backlog in `.docs/TASKS.md` for a separate follow-up pass.
