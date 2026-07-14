# BIKIE — Roadmap

## Milestone 1 — Scaffold + Homepage ✅ Completed
Monorepo, Prisma schema (core content models), Better Auth wired to Neon, polished animated homepage.

## Milestone 2 — Full Site + Dashboards ✅ Completed
Multi-page marketing site (full sitemap), dark-default theme, shared layout primitives (mega nav, breadcrumbs, skeletons, empty states, error pages, page transitions), schema expansion (Booking/Review/Trip/Partner), full seed data, and three role-gated dashboards (User/Partner/Admin).

## Milestone 3 — Real-time + Admin Overhaul ✅ Completed
SSE real-time messaging, AuditLog system with admin CRUD instrumentation, admin dashboard charts (recharts), CSV export, email (Resend) and SMS (Twilio) gateway services, SOS auto-resolve cron, SOS history API, CMS testimonial management.

## Milestone 3b — SOS Hardening, Membership Gating, Referrals ✅ Completed
SOS alerts show full reporter info (email, phone, map link); SOS send/view/respond gated behind active membership; referral system (auto-generated codes, signup linking, dashboard + admin pages, tracking only); dummy payment checkout modal for membership purchase; admin Membership Plans CRUD.

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
