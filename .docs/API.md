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

### Phone OTP (ADR-034)

MSG91 is the OTP authority on both platforms — Better Auth only verifies by asking MSG91, then
issues the session/account as usual (find-or-create user, mark phone verified, `set-auth-token`
for mobile). The verify endpoint is shared by both platforms unchanged.

- **Web** sends/resends OTPs via the MSG91 Widget SDK directly from the browser (our backend
  never sees that leg) — see `apps/web/lib/use-msg91-widget.ts`. The widget's `verifyOtp` returns
  an opaque access token, sent as `code` below.
- **Mobile** sends via `POST /api/otp/mobile/send` — `{ phoneNumber }` (E.164, Indian numbers
  only). Rate-limited (60s per-phone cooldown, 3/10min per-phone, 10/10min per-IP). Returns
  `{ success: true }` or a 4xx/5xx/429 with `{ error }`.
- **Both** verify via `POST /api/auth/phone-number/verify` — `{ phoneNumber, code }`, where `code`
  is either MSG91's native OTP (mobile) or the widget's access token (web); Better Auth's
  `verifyOTP` hook discriminates by shape. Same response shape as before ADR-034 — a `token` field
  in the JSON body for mobile, a `set-auth-token`-equivalent session cookie for web.
- `POST /api/auth/phone-number/send-otp` — Better Auth's own built-in send endpoint — returns
  **410**, deliberately disabled (superseded by the two send paths above).

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
| `/api/trips` | POST | Membership required | Body: `{ title, description, type, difficulty, seatsTotal, meetingPoint?, meetingLat?, meetingLng?, destinationName?, destinationId?, startDate, endDate, imageUrl?, price? }` (ADR-037: `destinationName` is organizer-typed free text, no longer required to match the curated `Destination` catalog; `destinationId` kept optional for backward compat only. `meetingLat`/`meetingLng` must be provided together). `type` ∈ `WEEKEND\|ADVENTURE\|ROAD_TRIP\|INTERNATIONAL\|GUIDED_TOUR`, `difficulty` ∈ `EASY\|MODERATE\|HARD` (default `MODERATE`), `price` defaults to `0` (free/community ride). Slug auto-generated from title (deduped with a numeric suffix). Returns `{ trip: TripSummaryDTO }`, 201. |
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
| `/api/partner/profile` | GET/PUT | Partner business profile (`businessName`, `type`, `city`, `description`, `addressLine`/`area`/`pincode`, `latitude`/`longitude`, `governmentIdType`/`governmentIdNumber` — ADR-036, superseding the old `aadhaarNumber` field). PUT now also accepts `isGeneralResponder` (ADR-044) — opts a partner into receiving SOS categories with no natural partner-type mapping (accident/medical/life-threatening/lost/other). |
| `/api/partner/reviews` | GET | See Reviews above |
| `/api/partner/availability` | PATCH | ADR-044. `{isAvailable: boolean}` → `{isAvailable}`. Drives the mobile app's 🟢 AVAILABLE / ⚫ OFFLINE toggle — `isAvailable: false` (default) means this partner is never dispatched an SOS request regardless of type/radius match. |
| `/api/partner/sos/dashboard` | GET | ADR-044. `?lat=&lng=` optional (omitting it just reports `activeRequests: 0`). `{ stats: PartnerSosDashboardDTO }` — `activeRequests`, `todayAssistanceCount`, `completedCount`, `ratingAvg`, `ratingCount`. |
| `/api/partner/sos/nearby` | GET | ADR-044. `?lat=&lng=` required. `{ requests: PartnerNearbyRequestDTO[] }` — open (unassigned), type-eligible SOS alerts within 25km. Empty (not an error) if the partner is unverified or offline. ADR-045: also excludes alerts this partner has already offered on or declined. |
| `/api/partner/sos/active` | GET | ADR-044. `{ sessions: PartnerActiveSessionDTO[] }` — this partner's current `SOSSession`s as the assigned helper. |

## Partners (public, ADR-036)

| Route | Method | Notes |
|---|---|---|
| `/api/partners/nearby` | GET | `?lat=&lng=&type=` (type optional) → `{ partners: NearbyPartnerRow[] }`, verified/geotagged partners within 25km, sorted nearest-first. No session required — IP rate-limited (20/min), not membership-gated (queries our own table, no paid external API involved). Backs the "Service providers near you" map on `/roadside-assistance` (web) and the `/partners` screen (mobile). |

## SOS Emergency (membership required — admins bypass) — ADR-033 staged Community Emergency Response System

| Route | Method | Notes |
|---|---|---|
| `/api/sos/alerts` | GET/POST | List active alerts / send a new one. **GET** `?lat=&lng=` (ADR-042) — a GPS radius (25km, plain Haversine) around the caller, replacing the old `?city=` exact-string match; non-admin callers without both get `400 { error: "LOCATION_REQUIRED", message }` (ADMIN sees every active alert network-wide, unfiltered, same as before). `SOSAlertDTO` now also includes `severity` (server-derived from `type`, never client input), `escalationTier`, `currentRadiusMeters`, `assignedHelperId`, and (ADR-038) `placeName`/`area`/`formattedAddress` — a best-effort reverse-geocoded address resolved once from `latitude`/`longitude` at creation time (null if the lookup failed/timed out; every reader falls back to `city`/raw coordinates in that case). ADR-044 additionally joins `riderVehicleType`/`riderVehicleBrand`/`riderVehicleModel` from the reporter's `RiderProfile` (all nullable — most riders never fill this in). ADR-045: `userPhone`/`userEmail`/`latitude`/`longitude`/`placeName`/`area`/`formattedAddress` are `null` for any viewer who is not the alert's reporter, its assigned helper, or an admin — see `.docs/SOS.md` §6. This GET also attaches a server-computed `distanceMeters` per alert now (previously computed internally for radius filtering, then discarded). `requireMembership()` returns `403 { error: "MEMBERSHIP_REQUIRED", message }` if the caller has no active membership. **POST** still takes `city` (free text, stored for display only now — no longer used to decide who can see the alert) and runs `SOSDispatchService.fanOut`, which now only immediately covers emergency contacts + optional `SOS_EMERGENCY_SERVICES_*` + tier-1 nearby riders (5km) — same-city partners are reached later, as the `SERVICE_PROVIDERS` escalation tier, not on every create. Response `dispatch` still carries `channels`/`escalatedToAdmins` (ADR-030's zero-recipient guarantee, preserved — see ADR-033 for the exact trigger-shape change) and per-channel counts. |
| `/api/sos/alerts/[id]` | GET | Alert detail + full timeline (`SOSTimelineEvent[]`). Same ADR-045 redaction as the list route above. |
| `/api/sos/alerts/history` | GET | Auth required (no membership gate). Caller's past alerts, including resolved. |
| `/api/sos/alerts/[id]/offer` | POST | Helper taps "I'm Coming." Optional `{latitude, longitude, message}` — distance/ETA computed straight-line if location given. Replaces `/respond`. When the caller's role is `PARTNER` (ADR-044), also gated on verified + available + type-eligible (`partnerMatchesAlertType`) + not already at capacity (1 concurrent active session as helper): `403` (`NOT_VERIFIED`) or `409` (`PARTNER_OFFLINE`/`CATEGORY_MISMATCH`/`AT_CAPACITY`). Belt-and-suspenders — dispatch already only notifies eligible partners. |
| `/api/sos/alerts/[id]/decline` | POST | **New, ADR-045.** A responder declines without ever offering. Optional `{message?}`. Persisted (`SOSAlertResponse.status = DECLINED`) so the alert stops reappearing in that responder's own "Nearby Requests" list — does not notify the reporter or hit the timeline. `404 NOT_FOUND` / `403 FORBIDDEN` (own alert) / `409` (`ALERT_NOT_ACTIVE`/`ALREADY_ASSIGNED`/`ALREADY_RESPONDED`). |
| `/api/sos/alerts/[id]/offers` | GET | Reporter or admin only. Helper name/distance/ETA/status; **phone withheld until that offer is `ACCEPTED`**. |
| `/api/sos/alerts/[id]/offers/[offerId]/withdraw` | POST | Helper taps "Cannot Help" on their own offer. |
| `/api/sos/alerts/[id]/offers/[offerId]/accept` | POST | Reporter or admin. The transactional assignment — `409` if another offer was already accepted (race-safe, not a silent overwrite). Creates the `SOSSession`. |
| `/api/sos/alerts/[id]/offers/[offerId]/reject` | POST | Reporter or admin declines a specific offer without assigning them. |
| `/api/sos/alerts/[id]/respond` | POST | **Deprecated alias** for `/offer` — kept for older clients (ADR-028). |
| `/api/sos/alerts/[id]/resolve` | POST | Mark an alert resolved. **Ownership-checked**: reporter, assigned helper, or admin only (fixed a real gap — previously any authenticated user could resolve any alert). |
| `/api/sos/sessions/[id]` | GET | Session detail — participants (helper/rider) or admin only. |
| `/api/sos/sessions/[id]/status` | POST | `{status: "HELPER_ARRIVED"\|"ASSISTANCE_IN_PROGRESS"\|"COMPLETED"\|"CANCELLED", cancelReason?}`. Helper drives ARRIVED/IN_PROGRESS, rider drives COMPLETED, either can CANCEL, admin overrides. |
| `/api/sos/sessions/[id]/rating` | POST | `{rating: 1-5, comment?}`. Rider only, post-COMPLETED, once. |
| `/api/sos/partners` | GET | `?city=&type=`. Backs "Share Mechanic"/"Share Fuel Contact" — verified partners of the given type, city-scoped. Now also returns `latitude`/`longitude` (ADR-036, if set) so the result renders as a map alongside the list; matching is still city-string-based, not radius-based (deliberate scope limit, see ADR-036). |
| `/api/cron/sos-resolve` | GET | Cron-only. Requires `Authorization: Bearer <CRON_SECRET>`. Auto-resolves alerts inactive for 120+ minutes, cascade-cancelling any dangling active session first. |
| `/api/cron/sos-escalate` | GET | Cron-only. Requires `Authorization: Bearer <CRON_SECRET>`. The staged-escalation ticker — widens radius / advances tier for alerts whose `nextEscalationAt` has passed. Schedule alongside `sos-resolve`. |

## Nearby Riders (membership required, ADR-016)

| Route | Method | Notes |
|---|---|---|
| `/api/rider-location/consent` | GET/PUT | `{ enabled: boolean }`. Opt in/out of live location sharing (findable/browsable). |
| `/api/rider-location/sos-opt-out` | GET/PUT | **New, ADR-045.** `{ enabled: boolean }`. Independent of `consent` above — whether this rider should be paged as an SOS dispatch candidate at all. Defaults `true`. Does not affect `/api/riders/nearby` browsing, only SOS dispatch's candidate pool (`findNearbyAroundPoint`). |
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

`entity`/`entityId` deep-link conventions: `"Trip"` → the trip's **slug** (fixed in ADR-035;
previously stored the trip's id, which 404'd against the slug-keyed `/trips/[slug]` route on
both platforms — web's `NotificationsTab.tsx` and mobile both build the link straight from
`entityId`), `"sos_alert"` → alert id (`/sos/[id]`), `"sos_session"` → session id (mobile's
`NotificationDeepLinkResolver` resolves this to its `alertId` via `GET /api/sos/sessions/[id]`
before navigating, since there is no session-keyed route — web doesn't deep-link SOS at all,
it links to the SOS dashboard generically), `"conversation"` → conversation id, new in ADR-035
for `NEW_MESSAGE` (mobile links to `/messages/[id]`; web's `NotificationsTab.tsx` has no tap
handler for this entity yet — falls back to no link, same as any other unmapped entity).

## Push Notifications (ADR-016 web, ADR-035 Android)

| Route | Method | Notes |
|---|---|---|
| `/api/notifications/push-token` | PUT/DELETE | `{ token, platform?, deviceId?, deviceName?, appVersion? }` — `platform`/device fields are optional and additive (ADR-035); the existing web caller still sends bare `{ token }` and defaults to `platform: WEB`. PUT upserts by `token` (multi-device support falls out of this for free — one row per device per user) and flips `notificationsEnabled` back to `true`. DELETE removes by `token`. |
| `/api/firebase-config` | GET | Public Firebase Web SDK config, fetched by `public/firebase-messaging-sw.js` at load time (static files can't read `NEXT_PUBLIC_*` env vars). |

Android FCM (ADR-035) reuses this same route and `NotificationService.notify()` choke point —
no separate mobile push API. The `android.notification.channelId`/`priority` FCM fields are set
server-side per `NotificationType` (`communications/domain/push-channel.ts`) so a
background/terminated push lands in the right Android notification channel; the Flutter app
mirrors the same mapping client-side for the foreground case (`push_channels.dart`).

## Membership (auth required)

| Route | Method | Notes |
|---|---|---|
| `/api/membership/active` | GET | `{ membership: UserMembershipDTO \| null }` |
| `/api/membership/plans` | GET | Public. `{ plans: MembershipPlanDTO[] }` — all plans (renter-facing purchase flow uses this, not the admin route). |
| `/api/membership/checkout` | POST | ADR-043. Body: `{ planId }`. Creates a real Razorpay order, priced server-side from the plan (never a client-supplied amount). Returns `{ razorpayConfigured: false }` if Razorpay isn't configured (`RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` unset) — the client's simulated-checkout fallback handles that case entirely on its own, without calling `/purchase` any differently. Configured: `{ razorpayConfigured: true, order: { orderId, amount, currency, keyId }, plan: { id, name, price } }`. |
| `/api/membership/purchase` | POST | ADR-043. Two mutually exclusive body shapes, resolved by whether Razorpay is configured server-side (not a client choice): **(a)** `{ planId, paymentId }` — the pre-Razorpay simulated-checkout shape, only accepted while Razorpay is unconfigured; `paymentId` is a client-generated dummy string (`DUMMY-<uuid>`). **(b)** `{ planId, razorpayOrderId, razorpayPaymentId, razorpaySignature }` — required once Razorpay is configured; the route verifies `HMAC-SHA256(orderId\|paymentId, keySecret) === signature` server-side before creating a membership, `400 { error: "PAYMENT_VERIFICATION_FAILED" }` if it doesn't match, `400 { error: "PAYMENT_VERIFICATION_REQUIRED" }` if shape (a) is sent while Razorpay is configured. Mirrors `components/membership/PaymentModal.tsx`. Returns `{ membership }`. **Mobile still only ever sends shape (a)** — no native Razorpay integration yet, so mobile purchases will fail with `PAYMENT_VERIFICATION_REQUIRED` once real keys are set; see ADR-043. |
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
