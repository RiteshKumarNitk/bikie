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

## Milestone 6 — Mobile App (in progress)
Flutter app consuming the existing REST API, renter-facing only (no partner/admin
dashboards on mobile). See `.docs/TASKS.md` for the phase-by-phase task list.

- **Phase 0 — Backend prep** ✅ Completed: Better Auth `bearer` plugin (ADR-007), real
  `POST /api/bookings`, `POST /api/bikes/[slug]/reviews`, wishlist add/remove
  (`POST`/`DELETE /api/wishlist/[bikeId]`).
- **Phase 1 — Flutter scaffolding, theme, auth**
- **Phase 2 — Browse/search (bikes, destinations, trips) — read-only**
- **Phase 3 — Bookings, reviews, wishlist (writes, auth-gated)**
- **Phase 4 — SOS, membership, referrals**
- **Phase 5 — Messaging (polling), profile, polish**

### Milestone 6b — Mobile Realtime (future)
Deliberately trimmed from v1: mobile messaging uses polling against the existing
`/api/conversations` REST routes instead of the cookie-session `/api/sse` stream (Dart has
no mature first-party SSE client, and `/api/sse` is a generic heartbeat channel shared with
SOS, not a per-conversation stream). Revisit by either adapting `/api/sse` for bearer auth
or introducing WebSockets, once real-time chat becomes a priority.
