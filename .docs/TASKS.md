# BIKIE — Tasks

Status values: Backlog, Planned, In Progress, Blocked, Review, Completed.

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
