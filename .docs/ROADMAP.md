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
