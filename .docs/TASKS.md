# BIKIE — Tasks

Status values: Backlog, Planned, In Progress, Blocked, Review, Completed.

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
| 8.4 — Chat UI (web): reply/edit/delete/emoji/typing/receipts UI, Cloudinary upload flow | Planned |
| 8.5 — Ride Room **backend**: `assertRideRoomAccess` guard, `Announcement` service/repo, `/api/trips/[slug]/room/**` routes (room/announcements/meeting-point/emergency-contacts/media). Typecheck-clean, not live-tested (see note below) | Completed (backend) |
| 8.5b — Ride Room **web UI**: `/dashboard/rides/[slug]/room` page with tabs | Planned |
| 8.6 — Reports + Admin Moderation **backend**: `ReportService`/`ModerationService`, warn/mute/suspend/ban/restore, conversation lock/delete, message delete, `AuditLog` integration, BANNED/SUSPENDED enforcement in `requireSession`, MUTED enforcement in `MessageService.sendMessage`. Typecheck-clean, not live-tested | Completed (backend) |
| 8.6b — Reports + Admin Moderation **UI**: `/admin/moderation/*` pages | Planned |
| 8.7 — Admin dashboard build-out (Rides edit, Ride Requests, Groups, Notifications broadcast) | Planned |
| 8.8 — Mobile parity (`ride_room`, `notifications` Flutter features) | Planned |
| 8.9 — Docs update + backlog log (below) | Planned |

Note on "not live-tested": the permission classifier blocks further ad hoc data-mutating test
calls against the shared prod/dev DB beyond the initial migration + encryption verification
already approved; the user chose "code review only" for the remainder of this build rather
than granting broader live-testing permission. 8.5/8.6 backends are typecheck-clean and
traced against the same call patterns already verified working in 8.1–8.3, but have not been
exercised end-to-end via real HTTP calls the way messaging was.

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
| `/community` page is 100% hardcoded fake data (featured riders, ride photos, events, clubs pills) with dead-click cards, zero API calls | Rider public site |
| `/clubs` page is 100% hardcoded fake data; "+ Create Club" CTA is non-functional | Rider public site |
| Contact form (`ContactForm`) never calls an API — `onSubmit` just sets local state, message is never sent | Rider public site |
| `/safety-center` is static hardcoded topics, no API | Rider public site |
| Rider dashboard Notifications tab always renders empty state, no backing model (superseded by Milestone 8's real `Notification` model — recheck if still applicable after 8.7) | Rider dashboard |
| Settings page has two dead "coming soon" stub sections (document upload, emergency contacts — note: ride-level emergency contacts are being built in Milestone 8, but this is a *profile-level* stub, distinct) | Rider dashboard |
| Admin Trips page is read-only (superseded by Milestone 8.7 — recheck after) | Admin |
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
| Mobile port (Milestone 7b) | Backlog |
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
