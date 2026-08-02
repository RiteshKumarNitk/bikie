# BIKIE — API Reference

All routes live under `apps/web/app/api/**`. Each validates input with Zod
(`@bikie/validation`) where applicable, calls a `@bikie/services` function, and returns
typed JSON. No route imports `@prisma/client` directly.

**Contract version:** the current `/api/*` surface is **stable v1** (ADR-028). Machine-readable
OpenAPI 3.1: `GET /api/openapi` or `/openapi-v1.json`. Regenerate after adding routes with
`pnpm openapi:generate`. Narrative docs below remain authoritative for request/response shapes
until schemas are fully enriched in OpenAPI. There is **no `/api/v2`** until an ADR approves a
breaking change with a consumer migration window.

## Auth

`ALL /api/auth/[...all]` — Better Auth catch-all (signup, login, session, signout).

### Mobile / Bearer Auth

The web app authenticates via Better Auth's HTTP-only session cookie. Non-browser clients
(the Flutter app) instead use **bearer tokens**, enabled via Better Auth's `bearer()`
plugin (`packages/auth/src/server.ts`) — both mechanisms work simultaneously against every
route below, no per-route changes needed.

- Sign in: `POST /api/auth/sign-in/email` with `{ email, password }`. The response includes
  a `set-auth-token` header containing the session token.
- Sign up: `POST /api/auth/sign-up/email` with `{ name, email, password }`. Same
  `set-auth-token` header on success.
- Store that header value and send it as `Authorization: Bearer <token>` on every
  subsequent request. `auth.api.getSession({ headers })` — used by every protected route via
  `requireSession()`/`requireRole()`/`requireMembership()` — resolves the session from
  either the cookie or the `Authorization` header transparently.
- Sign out: `POST /api/auth/sign-out` (clears the server-side session row; the client is
  responsible for discarding its locally stored token).

## Content (read)

| Route | Query params | Returns |
|---|---|---|
| `GET /api/bikes/featured` | `limit` (default 8, max 20) | `{ bikes: BikeSummaryDTO[] }` |
| `GET /api/bikes` | `location, category, priceMin, priceMax, brand, instantBooking, sort, page, pageSize` | `{ bikes: BikeSummaryDTO[], total, page, pageSize }` |
| `GET /api/bikes/[slug]` | — | `{ bike: BikeDetailDTO }` |
| `GET /api/destinations` | — | `{ destinations: DestinationSummaryDTO[] }` (all destinations, `revalidate: 300`) |
| `GET /api/destinations/popular` | `limit` | `{ destinations: DestinationSummaryDTO[] }` |
| `GET /api/destinations/[slug]` | — | `{ destination: DestinationDetailDTO }` |
| `GET /api/categories` | — | `{ categories: CategoryDTO[] }` |
| `GET /api/testimonials` | `limit` | `{ testimonials: TestimonialDTO[] }` |
| `GET /api/trips` | `tab` (upcoming/weekend/adventure/road-trip/international/guided-tour/completed) | `{ trips: TripSummaryDTO[] }` |
| `GET /api/trips/[slug]` | — | `{ trip: TripDetailDTO }` |

## Bookings (auth required)

| Route | Method | Notes |
|---|---|---|
| `/api/bookings` | GET | Current user's bookings, `?status=` filter |
| `/api/bookings` | POST | Body: `{ bikeId, startDate, endDate, pickupCity }`. Computes `totalPrice` from the bike's `pricePerDay` × day count; status is `CONFIRMED` if the bike has `instantBooking`, else `PENDING`. Returns `{ booking: BookingDTO }`, 201. 404 if bike not found, 400 on invalid dates or validation failure. |

There is no single-booking `GET /api/bookings/[id]` — the list response carries everything
a detail screen needs (`hasReview`, bike summary, etc.).

## Rides (community rides — the `Trip` model internally, user-facing copy says "Ride")

Renter-organized group rides: create a ride, other members request to join, the organizer
approves/rejects, approved members get a shared group chat (an auto-created `Conversation`,
reusing the existing messaging system — see ARCHITECTURE.md). See DECISIONS.md ADR-010.

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/trips` | POST | Membership required | Body: `{ title, description, type, difficulty, seatsTotal, meetingPoint?, destinationId?, startDate, endDate, imageUrl?, price? }`. `type` ∈ `WEEKEND\|ADVENTURE\|ROAD_TRIP\|INTERNATIONAL\|GUIDED_TOUR`, `difficulty` ∈ `EASY\|MODERATE\|HARD` (default `MODERATE`), `price` defaults to `0` (free/community ride). Slug auto-generated from title (deduped with a numeric suffix). Returns `{ trip: TripSummaryDTO }`, 201. |
| `/api/trips/[slug]/requests` | POST | Session | Body: `{ message? }`. 404 if trip not found, 400 if trip isn't `UPCOMING` or caller is the organizer, 400 if no seats left, 409 if already requested (PENDING/APPROVED). Re-requesting after a REJECTED/CANCELLED decision is allowed (upserts back to PENDING). Returns `{ success: true }`, 201. |
| `/api/trips/[slug]/requests` | GET | Session, organizer only | Pending requests for the ride. 403 if caller isn't the organizer. Returns `{ requests: RideJoinRequestDTO[] }`. |
| `/api/trips/[slug]/requests/mine` | GET | Session | Caller's own request status for this ride, or `{ request: null }` if never requested. |
| `/api/trips/[slug]/requests/[participantId]/approve` | POST | Session, organizer only | Atomically decrements `seatsLeft` (409 `NO_SEATS` if none left — race-safe conditional update). Creates the ride's group `Conversation` on first approval, or adds the rider to the existing one on subsequent approvals. 403 if not organizer, 400 if request already decided. |
| `/api/trips/[slug]/requests/[participantId]/reject` | POST | Session, organizer only | No seat change (rejected requests never held a seat). |
| `/api/trips/[slug]/leave` | POST | Session | Rider withdraws (PENDING or APPROVED → `CANCELLED`). If was `APPROVED`, increments `seatsLeft` back. 400 if not currently a participant. |
| `/api/trips/[slug]/group` | GET | Session, organizer or approved participant | Returns `{ conversationId }` for the ride's group chat — hand this to the existing `/api/conversations/[id]/messages` endpoints. 403 if caller isn't organizer/approved, 404 `NOT_STARTED` if no one's been approved yet. |
| `/api/trips/mine` | GET | Session | Extended: now returns `{ organized, joined, requested, stats }` — `requested` is rides with a caller-sent PENDING request; `stats: RideStatsDTO` is `{ ridesOrganized, requestsSent, requestsApproved, ridesCancelled, approvalRate }` (`approvalRate` is `requestsApproved / requestsSent` as a 0-100 int, `null` if no requests sent yet). |

## Reviews

| Route | Method | Notes |
|---|---|---|
| `/api/bikes/[slug]/reviews` | GET | Reviews for a bike |
| `/api/bikes/[slug]/reviews` | POST | Auth required. Body: `{ bookingId, rating (1-5), comment }`. The booking must belong to the caller, target this bike, and have `status: COMPLETED`; one review per booking (enforced by `Review.bookingId` unique constraint and checked up front). Returns `{ review: ReviewDTO }`, 201. 404 if booking not found, 403 if not eligible, 400 if already reviewed or validation fails. |
| `/api/reviews/mine` | GET | Auth required. Reviews written by the current user. |
| `/api/partner/reviews` | GET | Role: PARTNER. Reviews across all of the partner's bikes. |

## Wishlist (auth required)

| Route | Method | Notes |
|---|---|---|
| `/api/wishlist` | GET | Current user's wishlist, `{ items: WishlistItemDTO[] }` |
| `/api/wishlist/[bikeId]` | POST | Add a bike to the wishlist (idempotent upsert). `{ success: true }` |
| `/api/wishlist/[bikeId]` | DELETE | Remove a bike from the wishlist. `{ success: true }` |

## Partner (role: PARTNER)

| Route | Method | Notes |
|---|---|---|
| `/api/partner/bikes` | GET/POST | Partner's fleet |
| `/api/partner/bookings` | GET | Bookings across the partner's bikes |
| `/api/partner/dashboard` | GET | `{ stats: PartnerDashboardStatsDTO }` (previously mis-documented as `partner/analytics`) |
| `/api/partner/profile` | GET/PUT | Partner business profile (`businessName`, `type`, `city`, `description`) |
| `/api/partner/reviews` | GET | See Reviews above |

## SOS Emergency (membership required — admins bypass)

| Route | Method | Notes |
|---|---|---|
| `/api/sos/alerts` | GET/POST | List active alerts / send a new one. `SOSAlertDTO` includes `userEmail`, `userPhone`, `latitude`/`longitude` for full reporter info. `requireMembership()` returns `403 { error: "MEMBERSHIP_REQUIRED", message }` if the caller has no active membership. **POST** also runs `SOSDispatchService.fanOut` — SMS + WhatsApp + email (+ in-app `SOS_ALERT`) to nearby riders (PostGIS radius), same-city partners, and the reporter's emergency contacts. Response includes `dispatch` summary counts. Channels log `[SMS\|WHATSAPP\|EMAIL][DEV]` when live credentials are unset. |
| `/api/sos/alerts/history` | GET | Auth required (no membership gate). Caller's past alerts, including resolved. |
| `/api/sos/alerts/[id]/respond` | POST | Notify the reporter you're nearby. |
| `/api/sos/alerts/[id]/resolve` | POST | Mark an alert resolved. |
| `/api/cron/sos-resolve` | GET | Cron-only. Requires `Authorization: Bearer <CRON_SECRET>`. Auto-resolves alerts inactive for 120+ minutes. |

## Nearby Riders (membership required, ADR-016)

| Route | Method | Notes |
|---|---|---|
| `/api/rider-location/consent` | GET/PUT | `{ enabled: boolean }`. Opt in/out of live location sharing. |
| `/api/rider-location` | PUT | `{ latitude, longitude }`. Rejected with `409 { error: "SHARING_DISABLED" }` if consent isn't on. Rate-limited (~30/5min). |
| `/api/riders/nearby` | GET | `?radiusKm=` (default 5, max 50). Self-joins on the caller's own fix as the search center — `409 { error: "SHARING_DISABLED" }` if the caller has no fix on file. |
| `/api/cron/rider-location-cleanup` | GET | Cron-only. Requires `Authorization: Bearer <CRON_SECRET>`. Disables sharing for anyone with no fix in 30+ minutes. |

## Nearby Help / Places (membership required, ADR-016)

| Route | Method | Notes |
|---|---|---|
| `/api/places/nearby` | GET | `?lat=&lng=&type=gas_station\|car_repair\|hospital`. Server-side Google Places (New) call, Redis-cached (~1.1km grid, 10min TTL), rate-limited (10/min). |

## Notifications (auth required)

The in-app feed behind `components/chat/NotificationsTab.tsx` — found live but undocumented
here during the Milestone 8.8 mobile-parity pass (the route was added alongside the
`Notification` model in Milestone 8.1 and never listed afterward).

| Route | Method | Notes |
|---|---|---|
| `/api/notifications` | GET | `{ notifications: NotificationDTO[] }` for the current user, newest first. |
| `/api/notifications` | POST | `{ id }` marks one notification read, or `{ action: "MARK_ALL_READ" }` marks all read. `{ ok: true }`. |

## Push Notifications (ADR-016)

| Route | Method | Notes |
|---|---|---|
| `/api/notifications/push-token` | PUT/DELETE | `{ token }`. Registers/removes an FCM web push token for the current session. |
| `/api/firebase-config` | GET | Public Firebase Web SDK config, fetched by `public/firebase-messaging-sw.js` at load time (static files can't read `NEXT_PUBLIC_*` env vars). |

## Membership (auth required)

| Route | Method | Notes |
|---|---|---|
| `/api/membership/active` | GET | `{ membership: UserMembershipDTO \| null }` |
| `/api/membership/plans` | GET | Public. `{ plans: MembershipPlanDTO[] }` — all plans (renter-facing purchase flow uses this, not the admin route). |
| `/api/membership/purchase` | POST | Body: `{ planId, paymentId }`. `paymentId` is a client-generated dummy string (`DUMMY-<uuid>` — no real payment gateway, see PROJECT.md non-goals); mirrors the web dashboard's checkout modal (`components/membership/PaymentModal.tsx`). Returns `{ membership }`. |
| `/api/admin/membership/plans` | GET/POST | Role: ADMIN. Same shape as above but includes inactive plans and allows creation. |
| `/api/admin/membership/plans/[id]` | PATCH/DELETE | Role: ADMIN |

## Referrals (auth required)

| Route | Method | Notes |
|---|---|---|
| `/api/referrals/me` | GET | Returns (and lazily creates) the caller's referral code, plus who they've referred. |
| `/api/referrals/link` | POST | `{ code }` — links the caller as referred by the code owner. Tracking only, no auto-reward. |

## Messaging (auth required)

Real-time delivery is Upstash Redis-backed SSE for web (see below); the REST surface
underneath is plain polling-friendly JSON, which is what the Flutter app consumes (polling
every 6s, tightened to 3s for an open Ride Room thread — no SSE client, see ROADMAP.md
Milestone 6b and ADR-011). `Message` content is encrypted at rest (AES-256-GCM,
`lib/message-crypto.ts`) and decrypted transparently by every route below.

| Route | Method | Notes |
|---|---|---|
| `/api/conversations` | GET | Caller's conversations, `{ conversations: ConversationDTO[] }` |
| `/api/conversations` | POST | `{ otherUserId, subject? }` — get-or-create a conversation. Returns `{ conversation }`. |
| `/api/conversations/[id]/messages` | GET | `{ messages: MessageDTO[] }`. 404 if the caller isn't a participant. |
| `/api/conversations/[id]/messages` | POST | `{ content?, replyToId?, attachments? }` (needs at least one of `content`/`attachments`). Rate-limited (30/min). Returns `{ message }`, 403 `{ error: "MUTED" }` if the sender is muted. |
| `/api/conversations/[id]/typing` | POST | `{ isTyping }` — broadcast-only (SSE `typing` event to other participants); no polling-friendly way to *read back* others' typing state, so the Flutter app can send but not display incoming typing indicators. |
| `/api/conversations/[id]/read` | POST | `{ upToMessageId }` — marks the caller's read receipt up to that message. |
| `/api/messages/[id]` | PATCH | `{ content }` — edit the caller's own message. 403 if not the sender. Returns `{ message }`. |
| `/api/messages/[id]` | DELETE | True erasure (nulls ciphertext/content), not soft-delete. 403 if not the sender. Returns `{ message }`. |
| `/api/messages/[id]/react` | POST | `{ emoji }` — add a reaction. `{ ok: true }`. |
| `/api/messages/[id]/react` | DELETE | `?emoji=` — remove the caller's own reaction. `{ ok: true }`. |
| `/api/sse` | GET | Cookie-session-based (uses `getServerSession()` directly, not the shared `requireSession()` helper — bearer-token compatibility not yet verified for this route). Opens a `text/event-stream` connection; emits `connected`/`heartbeat`/`new_message`/`message_edited`/`message_deleted`/`reaction_added`/`reaction_removed`/`message_read`/`typing`/SOS events. Not used by the Flutter app. |

## Ride Room (Organizer + Approved Riders + Admin only, ADR-011)

The collaboration hub for an approved ride, gated by one shared guard
(`assertRideRoomAccess`) on every route below. `role` in the room response (`ORGANIZER` /
`MEMBER` / `ADMIN`) tells the client whether to show manage affordances — only
`ORGANIZER`/`ADMIN` can post announcements or edit the meeting point/emergency contacts;
`MEMBER` is read-only on those. Backend is typecheck-clean but not live-tested (see
`.docs/TASKS.md` Milestone 8 note); web has no shipped UI for this yet (8.5b: Planned) —
the Flutter Ride Room screen (Milestone 8.8) is the first UI consuming it.

| Route | Method | Notes |
|---|---|---|
| `/api/trips/[slug]/room` | GET | `{ room: RideRoomDTO }` — conversationId, role, isLocked, meeting point/lat/lng, emergency contacts. 404 `NOT_STARTED` if no one's been approved yet. |
| `/api/trips/[slug]/room/announcements` | GET/POST | `{ announcements: AnnouncementDTO[] }` / `{ content }` → `{ announcement }`. POST is manage-only. |
| `/api/trips/[slug]/room/announcements/[id]` | DELETE | Manage-only. `{ success: true }`. |
| `/api/trips/[slug]/room/meeting-point` | PATCH | `{ meetingPoint?, meetingLat?, meetingLng? }` — manage-only; posts a system message to the room's chat on change. |
| `/api/trips/[slug]/room/emergency-contacts` | GET/PATCH | `{ contacts: EmergencyContactDTO[] }` / `{ contacts }` (max 10, `{name, phone, relation}` each). PATCH is manage-only. |
| `/api/trips/[slug]/room/media` | GET | `?type=IMAGE\|DOCUMENT`. `{ media: MediaItemDTO[] }` — a filtered view over message attachments already shared in the room's chat, not a separate upload surface. |

There is no dedicated "members" route — the room's real member list is the same
`ConversationDTO.participants` returned by `GET /api/conversations` (filter to the room's
`conversationId`); `TripDetailDTO.members` exists in the type but is never populated by
`TripService.getBySlug`, so don't rely on it.

## User

| Route | Method | Notes |
|---|---|---|
| `/api/user/phone` | PATCH | `{ phone }` — update the caller's phone number (used for SOS profile completeness). `{ success: true }` |
| `/api/trips/mine` | GET | `{ organized: TripSummaryDTO[], joined: TripSummaryDTO[] }` |

## Admin (role: ADMIN)

| Route | Method | Notes |
|---|---|---|
| `/api/admin/overview` | GET | `{ stats: AdminOverviewStatsDTO }` |
| `/api/admin/users` | GET | |
| `/api/admin/users/[id]` | PATCH/DELETE | Update role / delete user |
| `/api/admin/partners` | GET | |
| `/api/admin/bikes` | GET/POST | |
| `/api/admin/bikes/[id]` | PATCH/DELETE | |
| `/api/admin/bookings` | GET | |
| `/api/admin/bookings/[id]` | PATCH/DELETE | Update status / delete |
| `/api/admin/trips` | GET | List all trips (any status), with organizer |
| `/api/admin/trips/[id]` | PATCH/DELETE | Update title/description/seatsTotal/dates/status (e.g. set `CANCELLED` to cancel a ride) / delete |
| `/api/admin/groups` | GET/POST | List/create Groups (`GroupType: COMMUNITY \| CLUB`); create auto-generates a unique slug and adds the chosen owner as an `OWNER` `GroupMember` |
| `/api/admin/groups/[id]` | PATCH/DELETE | Update / delete a Group |
| `/api/admin/testimonials` | GET/POST | |
| `/api/admin/testimonials/[id]` | PATCH/DELETE | |
| `/api/admin/membership/plans(/[id])` | see Membership above | |
| `/api/admin/referrals` | GET | |
| `/api/admin/audit-logs` | GET | |
| `/api/admin/export` | GET | `?type=users\|bookings\|partners` — streams a CSV download |
| `/api/admin/email` | POST | `{ to, subject, html }` — send via the email gateway |
| `/api/admin/sms` | POST | `{ to, message }` — send via the SMS gateway |

### Moderation (role: ADMIN — Milestone 8.6/8.6b, consumed by `/admin/moderation`)

| Route | Method | Notes |
|---|---|---|
| `/api/admin/moderation/reports` | GET | `?status=&targetType=` filters; `{ reports: ReportDTO[] }` |
| `/api/admin/moderation/reports/[id]` | PATCH | `{ status, resolutionNote? }` |
| `/api/admin/moderation/users/[id]/warn` | POST | `{ reason, reportId? }` |
| `/api/admin/moderation/users/[id]/mute` | POST | `{ reason, durationHours, reportId? }` |
| `/api/admin/moderation/users/[id]/suspend` | POST | `{ reason, durationHours, reportId? }` |
| `/api/admin/moderation/users/[id]/ban` | POST | `{ reason, reportId? }` |
| `/api/admin/moderation/users/[id]/restore` | POST | `{ reason? }` — clears WARNED/MUTED/SUSPENDED/BANNED back to ACTIVE |
| `/api/admin/moderation/messages/[id]` | DELETE | `{ reason, reportId? }` — true erasure (nulls ciphertext/content) |
| `/api/admin/moderation/conversations` | GET | `?page=` paginated (25/page); `{ conversations: ModerationConversationSummaryDTO[], total, page, pageSize }` |
| `/api/admin/moderation/conversations/[id]` | DELETE | `{ reason }` |
| `/api/admin/moderation/conversations/[id]/lock` | POST | `{ locked, reason }` |

All admin mutation routes (CREATE/UPDATE/DELETE) write an `AuditLog` entry via
`logAdminAction()`. Moderation routes additionally write a `ModerationAction` row (see
ADR-011) as the trust-and-safety-specific audit trail.

## Conventions

- List endpoints accept `limit`/`page` and are `revalidate`-cached where the data
  changes rarely (categories, destinations, bikes search/detail, bike reviews).
- All DTOs live in `packages/types`; Prisma types never leak past the repository layer.
- **Response envelope**: success responses are a raw, resource-named JSON object —
  plural key for collections (`{ bikes: [...] }`), singular key for a single/created
  resource (`{ booking: {...} }`), or a bare `{ success: true }` for mutations with no
  payload to return. `GET /api/bikes` is the one exception, returning
  `{ bikes, total, page, pageSize }` unwrapped at the top level.
- **Errors**: `{ error: string }` for 401 (`"Unauthorized"`), 403 (`"Forbidden"`, or
  `{ error: "MEMBERSHIP_REQUIRED", message }` for the membership gate), and 404; or
  `{ error: ZodFlattenedError }` (`{ formErrors: string[], fieldErrors: {...} }`) for 400
  validation failures.
- **Contract headers** (optional helpers in `apps/web/lib/api-contract.ts`): `x-request-id`,
  `x-api-version: v1`, and when sunsetting an operation `Deprecation` / `Sunset` /
  `Link: <…>; rel="successor-version"`.
- **OpenAPI / inventory**: `.docs/openapi/` (`auth-matrix.md`, `facade-registry.md`).
