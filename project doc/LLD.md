# BIKIE — Low-Level Design (LLD)

**Status:** Current as of 2026-08-01  
**Audience:** Implementing engineers  
**Related:** [HLD.md](./HLD.md), `.docs/API.md`, `.docs/ARCHITECTURE.md`, `.docs/DECISIONS.md`

---

## 1. Scope

This LLD specifies module boundaries, layering contracts, core schemas, critical
algorithms, and sequence flows. It does **not** replace `.docs/API.md` (full route
tables) or Prisma migrations (authoritative DDL).

---

## 2. Layering contract

```
UI (Server / Client Components)
  → apps/web/app/api/**/route.ts          # Zod + auth gates + HTTP mapping
    → packages/services/src/*.service.ts  # Business rules, crypto, fan-out
      → packages/database/src/repositories/*.repository.ts
        → PrismaClient / $queryRaw        # Neon Postgres (+ PostGIS)
```

### 2.1 Hard rules

| Rule | Detail |
|---|---|
| No Prisma in `apps/web` | Import DTOs from `@bikie/types`, services via API only |
| No `.js` on relative TS imports inside `packages/*` | Turbopack exception: generated Prisma client JS only |
| Repositories are dumb | Ciphertext in/out for messages; no business branching |
| Response envelope | `{ resource }` / `{ resources }` / `{ success: true }`; lists may add `total, page, pageSize` |
| Validation | Zod schemas in `@bikie/validation` at the route edge |

### 2.2 Auth helpers (web)

Every gate returns `{ session, error }`; return `error` immediately and TypeScript narrows
`session` to non-null afterwards:

```ts
const { session, error } = await requireMembership();   // or requireSession / requireRole
if (error) return error;

const parsed = schema.safeParse(await req.json());      // 400 ZodFlattenedError
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}

const result = await SomeService.method(session.user.id, parsed.data);
return NextResponse.json({ result }, { status: 201 });
```

Gates delegate to `identity-access` and map each denial reason to a fixed response (ADR-023):

| Reason | Status | Body |
|---|---|---|
| `UNAUTHENTICATED` | 401 | `{ error: "Unauthorized" }` |
| `ACCOUNT_RESTRICTED` | 403 | `{ error: "ACCOUNT_RESTRICTED" }` |
| `FORBIDDEN` | 403 | `{ error: "Forbidden" }` |
| `MEMBERSHIP_REQUIRED` | 403 | `{ error: "MEMBERSHIP_REQUIRED", message }` |

`requireMembership` alone returns the session *alongside* a `MEMBERSHIP_REQUIRED` error so
callers can use it for upsell context. ADMIN bypasses the membership gate. `requirePermission`
exists for routes where a role name isn't the intent; permissions derive from `User.role`.

Cron routes use `Authorization: Bearer ${CRON_SECRET}` instead of a user session.

---

## 3. Package / module map

### 3.1 `packages/database`

| Path | Role |
|---|---|
| `prisma/schema.prisma` | Models & enums |
| `prisma/migrations/**` | DDL (incl. hand-written PostGIS bits) |
| `prisma/seed.ts` | Dev seed (roles, bikes, SOS fixtures) |
| `src/client.ts` | Prisma client + Neon adapter |
| `src/adapter.ts` | Driver adapter wiring |
| `src/repositories/*.ts` | Data access only |

**Repositories (current):**  
`bike`, `booking`, `partner`, `destination`, `category`, `testimonial`, `trip`,
`review`, `wishlist`, `user`, `rider-profile`, `rider-location`, `sos`, `membership`,
`referral`, `message`, `announcement`, `notification`, `push-subscription`,
`moderation`, `report`, `audit`, `admin`.

### 3.2 `packages/services`

| Service | Owns |
|---|---|
| `bike` / `destination` / `category` / `testimonial` | **Facades** → `modules/catalog` (ADR-024) |
| `booking` / `review` / `wishlist` | **Facades** → `modules/rentals-bookings` (ADR-024) |
| `trip` / `ride-room` | **Facades** → `modules/rides-community` (ADR-025); approve is atomic |
| `message` | **Facade** → `modules/messaging` (ADR-025) |
| `admin` | **Facade** → `modules/administration` (ADR-026) |
| `moderation` / reports / `audit` | **Facades** → `modules/trust-safety` (ADR-026) |
| `sos` / `sos-dispatch` / `rider-location` / `places` | **Facades** → `modules/safety-location` (ADR-022) |
| `membership` / `referral` / `user` / `rider-profile` | Identity & profiles |
| `partner` | **Facade** → `modules/partners` (ADR-024) |
| `notification` / `push` | In-app feed + FCM multicast (`push` facade → communications) |
| `sms` / `whatsapp` / `email` | Gateways facades → `modules/communications` (ADR-021) |
| `upload` | Cloudinary uploads |

**Extracted modules** (Strangler; facades preserve import paths):

| Module path | Public composition | Domain highlights |
|---|---|---|
| `modules/communications` | `createCommunicationsPorts()` | Email/SMS/WhatsApp/Push ports + adapters |
| `modules/safety-location` | `createSafetyLocationModule()` | SOS CRUD, fan-out policy, rider location, Places |
| `modules/identity-access` | `createIdentityAccessModule()` | Account status, roles, derived permissions, membership gate, login OTP |
| `modules/catalog` | `createCatalogModule()` | Bike search defaults, destinations, categories, testimonials |
| `modules/rentals-bookings` | `createRentalsBookingsModule()` | Booking pricing/status, review eligibility, wishlist |
| `modules/partners` | `createPartnersModule()` | Partner profile + dashboard stats |
| `modules/rides-community` | `createRidesCommunityModule()` | Join/decide/leave, room access, atomic approve |
| `modules/messaging` | `createMessagingModule()` | Mute policy, encrypt/decrypt, realtime publish |
| `modules/administration` | `createAdministrationModule()` | Admin CRUD, formula-safe CSV (max 10k rows) |
| `modules/trust-safety` | `createTrustSafetyModule()` | Reports, moderation ledger, audit |

### 3.3 `packages/auth`

`packages/auth/src/server.ts` — Better Auth instance:

- Prisma adapter
- `bearer()` plugin (mobile)
- `phoneNumber` plugin (OTP via `SMSService`)
- `socialProviders.google` (optional; no-op if env unset)
- Email/password unchanged for admin / legacy accounts

### 3.4 `apps/web` structure (relevant)

```
apps/web/
├── app/
│   ├── (auth)/login|signup
│   ├── (main)/                 # marketing + dashboards
│   │   ├── dashboard/**        # renter
│   │   ├── partner/**
│   │   ├── admin/**
│   │   ├── bikes|trips|explore-bikes|...
│   │   └── page.tsx            # homepage (Panic above Hero)
│   ├── api/**                  # REST + auth + cron + sse
│   ├── onboarding|partner-onboarding|welcome
│   └── globals.css             # design tokens (source of truth for colors)
├── components/
├── lib/                        # api.ts, message-crypto, sse-manager, rate-limit, ...
└── public/firebase-messaging-sw.js
```

### 3.5 `apps/mobile` (renter)

- Bearer auth; phone OTP + email fallback
- Mandatory Splash → Intro → Welcome → Login gate (no anonymous browse)
- Default API base: `https://bikie.app` (overridable via `--dart-define=API_BASE_URL`)
- Messaging: REST polling (no SSE client)

---

## 4. Domain model (logical ER)

```
User 1──1 Partner
User 1──1 RiderProfile 1──* RiderEmergencyContact
User 1──1 RiderLocation          # PostGIS geography + sharingEnabled
User 1──* PushSubscription
User 1──* UserMembership *──1 MembershipPlan
User 1──* Booking *──1 Bike *──1 Partner
Booking 1──0..1 Review
User *──* Trip (via TripParticipant: PENDING|APPROVED|REJECTED|CANCELLED)
Trip 0──1 Conversation           # group chat / Ride Room backbone
Group 0──1 Conversation
Conversation 1──* Message 1──* MessageAttachment|Reaction|Receipt
Trip 1──* Announcement
User 1──* SOSAlert 1──* SOSAlertResponse
User 1──* Notification
Report / ModerationAction / AuditLog   # trust & safety + admin ledger
```

### 4.1 Important enums (abbrev.)

| Enum | Values (key ones) |
|---|---|
| `UserRole` | `RENTER`, `PARTNER`, `ADMIN` |
| `BookingStatus` | `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, … |
| `ParticipantStatus` | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| `TripType` | `WEEKEND`, `ADVENTURE`, `ROAD_TRIP`, `INTERNATIONAL`, `GUIDED_TOUR`, `EVENT` |
| `SOSAlertType` | Red/Amber categories (e.g. `ACCIDENT`, …) |
| `UserAccountStatus` | `ACTIVE`, `WARNED`, `MUTED`, `SUSPENDED`, `BANNED` |
| `GroupType` | `COMMUNITY`, `CLUB` |
| `MessageType` | text / system / … (`POLL` reserved, deferred) |

### 4.2 PostGIS note (`RiderLocation`)

- Column type: `geography(Point, 4326)` — **not** a Prisma-native type.
- Read/write only via `$queryRaw` / `$executeRaw` in `rider-location.repository.ts`.
- Extension + GiST index are hand-written in migration SQL; Prisma’s diff engine will not
  regenerate them correctly — do not “clean up” that migration expecting auto-fix.

---

## 5. Core algorithms

### 5.1 Booking create

**Input:** `{ bikeId, startDate, endDate, pickupCity }`  
**Steps:**

1. Load bike; 404 if missing.
2. Validate date range (end > start).
3. `days = ceil((end − start) / 1 day)`.
4. `totalPrice = bike.pricePerDay * days`.
5. `status = bike.instantBooking ? CONFIRMED : PENDING`.
6. Persist `Booking`; return `BookingDTO`.

### 5.2 Ride join — approve (race-safe seats)

1. Assert caller is organizer.
2. Assert participant is `PENDING`.
3. Conditional update:  
   `UPDATE Trip SET seatsLeft = seatsLeft - 1 WHERE id = ? AND seatsLeft > 0`  
   → if 0 rows: `409 NO_SEATS`.
4. Set participant `APPROVED`.
5. If no `Conversation` for trip: create group conversation + organizer participant;  
   else add approved rider as `ConversationParticipant`.
6. Notify requester.

**Reject:** status → `REJECTED`, no seat change.  
**Leave:** `CANCELLED`; if was `APPROVED`, `seatsLeft++`.

### 5.3 Message encrypt / decrypt

- Algorithm: AES-256-GCM (Node `crypto`).
- Key: `MESSAGE_ENCRYPTION_KEY` (32-byte base64).
- Write path (service): plaintext → `{ ciphertext, iv, authTag }` → repository.
- Read path: repository returns ciphertext → service decrypts → DTO.
- Delete: null `ciphertext` / `iv` / `authTag` / `content` (true erasure).
- Admin moderation decrypt uses the **same** `getMessages` path + `logAdminAction("VIEW_CONVERSATION")`.

### 5.4 Realtime (web SSE)

1. Publisher: `RPUSH inbox:<userId>` on Upstash Redis (REST client).
2. `GET /api/sse`: session cookie; poll drain+delete inbox ~2s; emit typed events
   (`new_message`, `typing`, SOS, …).
3. Authorization boundary = per-user inbox (no shared conversation channel).
4. Mobile: no SSE; poll REST at 6s (3s when Ride Room thread open).

### 5.5 Nearby riders

1. Caller must have `sharingEnabled` and a stored fix (else `409 SHARING_DISABLED`).
2. Self-join: search center = caller’s own geography.
3. `ST_DWithin` within `radiusKm` (default 5, max 50); filter stale (~15 min).
4. Cron: disable sharing if no fix for 30+ minutes.

### 5.6 SOS dispatch fan-out

Triggered after successful `SOSService.createAlert` inside `POST /api/sos/alerts`.

```
SOSDispatchService.fanOut(alert, reporter)
  recipients =
      findNearbyAroundPoint(alert.lat, alert.lng)   // PostGIS; not reporter consent
    ∪ Partners where city ≈ alert.city (+ contact phones)
    ∪ RiderEmergencyContact for reporter
    ∪ optional SOS_EMERGENCY_SERVICES_* env targets

  for each recipient with contact info:
      SMSService.send
      WhatsAppService.send   // Meta Cloud preferred; Twilio fallback; else wa.me link
      EmailService.send      // SMTP preferred; Resend fallback
      if platform user: NotificationService.notify(SOS_ALERT)  // in-app + push

  return SOSDispatchSummary {
    attempted counts,
    smsSent, whatsappSent, emailSent,
    whatsappClickToSend?,
    errors[]
  }
```

Maps helpers (`sos-maps`): pin URL + directions deep link included in every channel body.

### 5.7 Places nearby

1. `GET /api/places/nearby?lat&lng&type=gas_station|car_repair|hospital`
2. Membership + rate limit (10/min).
3. Cache key: ~1.1 km grid cell + type; TTL 10 min (Upstash).
4. Miss → Google Places API (New) `searchNearby` with server-only key.

### 5.8 Notification → push choke point

All product notifications go through `NotificationService.notify()`:

1. Insert `Notification` row.
2. Fire-and-forget `PushService.sendToUser` (FCM multicast).
3. Dead tokens (`messaging/registration-token-not-registered`) deleted.

---

## 6. Sequence diagrams

### 6.1 Phone OTP signup (web)

```
Client                /api/auth/*              SMSService           DB
  │  send-otp              │                      │                  │
  │───────────────────────►│─────────────────────►│                  │
  │                        │  [DEV] or Twilio     │                  │
  │  verify + session      │                      │                  │
  │───────────────────────►│─────────────────────────────────────────►│ User/Session
  │  complete-phone-signup │                      │                  │
  │───────────────────────►│  UserService (role)  │──────────────────►│
  │  /onboarding (optional)│                      │                  │
```

### 6.2 Flutter bearer login

```
Flutter App              Better Auth
  │  POST sign-in / verify-otp
  │──────────────────────────►│
  │  token (header or JSON)   │
  │◄──────────────────────────│
  │  store in secure storage  │
  │  Authorization: Bearer …  │  on every API call
```

### 6.3 SOS Red/Amber alert

```
Panic UI → geolocation
  → POST /api/sos/alerts { type, category, lat, lng, city, ... }
      → requireMembership
      → SOSService.createAlert
      → RealtimeService.publishGlobal (admin SSE)
      → SOSDispatchService.fanOut
      → Response { alert, dispatch }
```

### 6.4 Ride Room access

Every `/api/trips/[slug]/room/**` route calls `assertRideRoomAccess`:

- Allowed: Organizer, `APPROVED` participant, or `ADMIN`
- Role returned: `ORGANIZER` | `MEMBER` | `ADMIN` (drives manage UI)
- `404 NOT_STARTED` if conversation not yet created (no approvals yet)

---

## 7. API design notes (LLD)

Full tables live in `.docs/API.md`. Conventions for implementers:

| Topic | Rule |
|---|---|
| Auth | Cookie and Bearer interchangeable except `/api/sse` (cookie-oriented today) |
| Membership | SOS, nearby, ride create; admins bypass |
| Idempotency | Wishlist add = upsert; join re-request after REJECTED/CANCELLED allowed |
| Rate limits | Messages ~30/min; location ~30/5min; Places 10/min |
| Uploads | `POST /api/upload` → Cloudinary → URL on `User.image` / attachments |
| Admin mutations | Always `logAdminAction()`; moderation also writes `ModerationAction` |

### 7.1 Gateway return shape

```ts
type SendResult = { ok: boolean; provider: string; error?: string };
```

Unset credentials → `ok: false` or DEV log path; never throw away the whole fan-out.

---

## 8. UI / route gating (web)

| Area | Gate |
|---|---|
| Marketing `(main)` public pages | None |
| `/dashboard/**` | Session + `RENTER` (membership for SOS/nearby pages) |
| `/partner/**` | Session + `PARTNER` |
| `/admin/**` | Session + `ADMIN` |
| `/onboarding` | Session; skippable `RiderProfile` gate |
| Panic on homepage | Login + membership for send; modal confirm (ADR-015) |

Theme: dark-default (`globals.css`); accent fill `#3B3A91` vs accent-text `#8482D6` in dark
mode (ADR-009). Prefer runtime CSS over stale token docs when they diverge (ADR-018).

---

## 9. Security & privacy (implementation)

| Control | Implementation |
|---|---|
| Secrets | `apps/web/.env.local` / `apps/.env` only; never commit |
| Sessions | HTTP-only cookie (web); secure storage token (mobile) |
| Chat | Server-side encryption; key never sent to clients |
| Location | Opt-in `sharingEnabled`; auto-off after stale; membership-gated |
| Places key | Server-only; Redis + rate limit for billing abuse |
| Moderation | `accountStatus` fast-path on hot paths (`requireSession`, `sendMessage`) |
| Cron | Shared secret bearer |

---

## 10. Observability & testing hooks

| Mechanism | Use |
|---|---|
| `[SMS\|WHATSAPP\|EMAIL\|Push][DEV]` | Local/Docker without live vendors |
| `SHOW_OTP_TOAST` | Surface OTP in UI for test builds |
| `dispatch` on SOS create response | Assert channel counts / errors in E2E |
| `wa.me` click-to-send | Manual WhatsApp delivery when no API creds |
| Seed data | Membership, Bangalore partners, nearby GPS riders, emergency contacts |

See `project doc/SOS_E2E_TESTING.md` for the SOS verification checklist.

---

## 11. Docker local production shape

`docker-compose.yml` builds `Dockerfile`, publishes **3001:3001**, loads `apps/.env`,
sets `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` to `http://localhost:3001` so SSR
self-fetches match the Host header.

Entrypoint may optionally seed (`SEED_DB`); default compose sets `SEED_DB=false`.

---

## 12. Extension points (explicitly deferred)

Documented so implementers do not invent parallel designs:

| Extension | Notes |
|---|---|
| `MessageType.POLL` | Reserved; not built |
| `Trip.liveLocationEnabled` | Ride-scoped live map; nearby riders is the global opt-in precursor |
| Razorpay settlement | Replace dummy `paymentId` |
| Mapbox / Maps JS | Visual maps |
| Flutter FCM | Native tokens ≠ web VAPID path |
| User-created Groups join flow | Admin-seeded Groups only today; reuse TripParticipant pattern |
| Rider-to-rider reviews | Needs new model; `Review` locked to Bike+Booking |
| Dedicated `apps/api` | Extract only if Flutter needs independent scale |

---

## 13. File checklist for common changes

| Change | Touch |
|---|---|
| New REST endpoint | `apps/web/app/api/.../route.ts` + service + maybe repository + Zod + DTO + `API.md` |
| New Prisma field | `schema.prisma` → migrate → repository → service → DTO |
| New notification type | Enum + `NotificationService.notify` (push automatic) |
| New SOS channel behavior | `sos-dispatch.service.ts` + gateway service + env example |
| New admin mutation | Service + `logAdminAction` (+ `ModerationAction` if T&S) |
| Docs after feature | `.docs/TASKS.md`, `ROADMAP.md`, `CHANGELOG.md`; ADRs if architectural |

---

## 14. References

- [HLD.md](./HLD.md) — system overview  
- [SOS_DISPATCH_PLAN.md](./SOS_DISPATCH_PLAN.md) — SOS fan-out design  
- [SOS_E2E_TESTING.md](./SOS_E2E_TESTING.md) — SOS test plan  
- `.docs/ARCHITECTURE.md`, `.docs/API.md`, `.docs/DECISIONS.md`, `.docs/PROJECT.md`
