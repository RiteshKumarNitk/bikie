# BIKIE — High-Level Design (HLD)

**Status:** Current as of 2026-08-01  
**Audience:** Engineers, architects, product stakeholders  
**Related:** [LLD.md](./LLD.md), `.docs/ARCHITECTURE.md`, `.docs/API.md`, `.docs/DECISIONS.md`

---

## 1. Purpose

BIKIE is a premium motorcycle rental and travel platform for India, positioned as
“Airbnb for motorcycles.” Users search for an **experience** (bike + destination +
dates); the provider is secondary. A community layer (Rides, Ride Rooms, messaging,
SOS) sits on top of rentals for retention.

### 1.1 Product surfaces

| Surface | Stack | Audience |
|---|---|---|
| Marketing + booking website | Next.js 16 (App Router) | Anonymous + authenticated |
| Renter dashboard | Same web app | `RENTER` |
| Partner dashboard | Same web app | `PARTNER` |
| Admin dashboard | Same web app | `ADMIN` |
| Mobile app | Flutter (`apps/mobile`) | Renter-facing only |
| REST API | Next.js Route Handlers under `apps/web/app/api/**` | Web + Flutter |

### 1.2 Non-goals (current)

- Real payment gateway settlement (Razorpay env-documented; membership uses dummy `paymentId`)
- Rendered maps (Mapbox / Maps JS SDK unwired; deep links only)
- Native Flutter push (web FCM only)
- Separate `apps/api` service

---

## 2. System context

```
┌──────────────┐     cookie / bearer      ┌─────────────────────────────┐
│  Web browser │ ───────────────────────► │  apps/web (Next.js)         │
└──────────────┘                          │   • UI (RSC + Client)       │
                                          │   • /api/* Route Handlers   │
┌──────────────┐     Bearer token         │   • Better Auth catch-all   │
│ Flutter app  │ ───────────────────────► └──────────────┬──────────────┘
└──────────────┘                                         │
                                                         │ services → repositories
                                                         ▼
                                          ┌─────────────────────────────┐
                                          │  Neon Postgres (+ PostGIS)  │
                                          └─────────────────────────────┘

External systems (optional until credentials set — DEV console fallback):
  Twilio SMS · Meta WhatsApp Cloud API · SMTP / Resend · Firebase FCM
  Google Places (New) · Cloudinary · Upstash Redis · Google OAuth
```

---

## 3. Architecture principles

1. **Strict layering** — `UI → Route Handler → Service → Repository → Prisma → DB`.  
   No `@prisma/client` outside `packages/database`. Prisma types never leak past repositories.
2. **API is the contract** — Server Components fetch `/api/*` rather than importing services
   directly, so Flutter and web share one REST surface.
3. **API lives in `apps/web`** — Route Handlers deploy as serverless functions on Vercel;
   a second API app would add CORS/cookie complexity with no present benefit (ADR-001).
4. **Reuse over new surface area** — Ride group chat reuses `Conversation`/`Message`; Groups
   use one model with `COMMUNITY | CLUB`; Events are a `TripType`, not a new entity.
5. **Dev-safe gateways** — SMS / WhatsApp / Email / Push log `[CHANNEL][DEV]` when credentials
   are unset so E2E works before go-live.

---

## 4. Monorepo layout

```
bikie/
├── apps/
│   ├── web/                 # Next.js 16 — site + API
│   └── mobile/              # Flutter renter app (not a pnpm workspace member)
├── packages/
│   ├── database/            # Prisma schema, client, repositories
│   ├── auth/                # Better Auth server config
│   ├── services/            # Business logic
│   ├── validation/          # Zod schemas
│   ├── types/               # Shared DTOs
│   ├── ui/                  # Design-system primitives
│   └── utils/               # cn(), formatCurrency, slugify
├── .docs/                   # Source-of-truth product/architecture docs
├── project doc/             # Feature plans, E2E, HLD/LLD
├── docker/ · Dockerfile · docker-compose.yml
└── pnpm-workspace.yaml / turbo.json
```

**Package manager:** pnpm (`corepack pnpm …`). Dev server: port **3000** (ADR-003).

---

## 5. Logical subsystems

```
┌─────────────────────────────────────────────────────────────────┐
│                         Presentation                             │
│  Marketing · Dashboards (RENTER/PARTNER/ADMIN) · Flutter UI      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP JSON
┌────────────────────────────▼────────────────────────────────────┐
│                         API edge                                 │
│  Auth · Zod validation · Role / membership gates · Rate limits   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      Domain services                             │
│  Bikes · Bookings · Rides/Trips · Ride Room · Messaging          │
│  SOS + Dispatch · Nearby riders · Places · Membership            │
│  Notifications + Push · Moderation · Admin · Uploads             │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      Data access                                 │
│  Repositories · PostGIS raw queries · Audit / Moderation ledgers │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Neon Postgres · Upstash Redis (SSE inbox + Places cache)        │
└─────────────────────────────────────────────────────────────────┘
```

### 5.1 Subsystem summary

| Subsystem | Responsibility |
|---|---|
| **Catalog** | Bikes, destinations, categories, testimonials, search/filter |
| **Bookings** | Create/list bookings; instant vs pending confirmation |
| **Rides (Trips)** | Community rides: create, request/approve join, seat accounting, reputation stats |
| **Ride Room** | Announcements, meeting point, emergency contacts, shared media (composition over Trip + Conversation) |
| **Messaging** | 1:1 and group chat; AES-256-GCM at rest; SSE (web) / polling (mobile) |
| **SOS** | Red/Amber alerts; multi-channel fan-out to nearby riders, partners, emergency contacts |
| **Nearby** | Opt-in live location (PostGIS); Google Places “Nearby Help” |
| **Membership** | Plans + purchase (dummy payment); gates SOS / nearby / ride creation |
| **Trust & safety** | Reports, warn/mute/suspend/ban, conversation lock, AuditLog + ModerationAction |
| **Identity** | Better Auth: email/password, phone OTP, Google OAuth, cookie + bearer |

---

## 6. Identity & authorization

### 6.1 Roles

`User.role ∈ { RENTER, PARTNER, ADMIN }`

- **Partner** is a profile (`Partner` 1:1 with `User`), not a separate auth identity.
- Dashboards gated by `proxy.ts` (Next.js 16 middleware rename) + layout session checks.

### 6.2 Session mechanisms (simultaneous)

| Client | Mechanism |
|---|---|
| Web | HTTP-only Better Auth session cookie |
| Flutter | Bearer token (`Authorization: Bearer <token>`), `bearer()` plugin |

`auth.api.getSession({ headers })` resolves either. Helpers: `requireSession()`,
`requireRole()`, `requireMembership()`.

### 6.3 Membership

Binary active membership (not multi-tier). Required for SOS send/view/respond, nearby
riders, ride creation. Admins bypass. Unpaid purchase uses client dummy `paymentId`
(`DUMMY-<uuid>`).

---

## 7. Key end-to-end flows (HLD)

### 7.1 Bike booking

```
Browse / search → Bike detail → POST /api/bookings
  → totalPrice = pricePerDay × days
  → CONFIRMED if instantBooking else PENDING
```

### 7.2 Community ride join

```
Create ride (membership) → Rider requests join (PENDING)
  → Organizer approves → seatsLeft-- (atomic) → Conversation created/joined
  → Participants use Ride Room + group chat
```

### 7.3 SOS panic fan-out

```
Panic UI (GPS) → POST /api/sos/alerts (membership)
  → Persist SOSAlert → SSE publish
  → SOSDispatchService.fanOut:
        nearby riders (PostGIS) · same-city partners · emergency contacts
        → SMS + WhatsApp + Email + in-app/push
```

### 7.4 Messaging delivery

```
POST message → encrypt → store → RPUSH inbox:<userId> (Redis)
  Web: SSE drains inbox every ~2s
  Mobile: poll conversations/messages (3–6s)
```

---

## 8. Technology stack

| Layer | Choice |
|---|---|
| Web framework | Next.js 16 App Router, React Server Components |
| Language | TypeScript (web/packages), Dart (mobile) |
| Auth | Better Auth (Prisma adapter) |
| ORM / DB | Prisma 7 + Neon Postgres (pooled + unpooled URLs), PostGIS |
| Cache / realtime bus | Upstash Redis (REST client) |
| Validation | Zod (`@bikie/validation`) |
| UI primitives | `@bikie/ui` + Tailwind design tokens |
| Animation | Lenis, GSAP (Hero), Motion |
| Media | Cloudinary |
| Notifications | In-app `Notification` + Firebase FCM (web) |
| Comms | Twilio SMS; Meta WhatsApp / Twilio fallback; SMTP / Resend |
| Deploy | Vercel (web/API); Docker Compose for local production-like runs |
| Mobile | Flutter, bearer auth against same API |

---

## 9. Data stores

| Store | Use |
|---|---|
| **Neon Postgres** | System of record (users, catalog, bookings, trips, chat ciphertext, SOS, etc.) |
| **PostGIS** | `RiderLocation.location` geography; nearby radius queries |
| **Upstash Redis** | Per-user SSE inbox lists; Places API response cache (~1.1 km grid, 10 min TTL) |
| **Cloudinary** | Uploaded images (profiles, bikes, chat attachments) |

Prisma 7: migrations use unpooled `DIRECT_URL`; runtime client uses `@prisma/adapter-neon`
against pooled `DATABASE_URL` (ADR-004).

---

## 10. Deployment & environments

```
                    ┌─────────────────┐
  Developers ──pnpm►│  localhost:3000 │  .env.local (secrets)
                    └─────────────────┘

                    ┌─────────────────┐
  docker compose ──►│  localhost:3001 │  apps/.env
                    └─────────────────┘

                    ┌─────────────────┐
  Production ──────►│  Vercel + Neon  │  bikie.app
                    └─────────────────┘
```

- Cron routes (`/api/cron/sos-resolve`, `/api/cron/rider-location-cleanup`) require
  `Authorization: Bearer <CRON_SECRET>`.
- Real secrets only in gitignored env files; `.env.example` documents names only.

---

## 11. Cross-cutting concerns

| Concern | Approach |
|---|---|
| Errors | `{ error }` / Zod flattened errors; membership `MEMBERSHIP_REQUIRED` |
| Rate limits | Messaging, location updates, Places, SOS |
| Audit | `AuditLog` for admin mutations; `ModerationAction` for T&S state machine |
| Encryption | Message AES-256-GCM, server-only `MESSAGE_ENCRYPTION_KEY` |
| Caching | `revalidate` on rare-changing catalog routes |
| Observability | Structured `[CHANNEL][DEV]` / provider logs; dispatch delivery counts |

---

## 12. Roadmap context (high level)

| Milestone | State |
|---|---|
| 1–3b Scaffold, dashboards, SOS hardening, referrals | Done |
| 4 Real payments / availability | Future |
| 5 Maps / advanced location UX | Partially pulled forward (PostGIS + Places); rendered maps future |
| 6 Flutter renter app | Built; on-device E2E pending |
| 7 Rides community v1 (web) | Done |
| 8 Community Platform v2 (Ride Room, encryption, moderation, mobile parity) | In progress |
| SOS multi-channel dispatch | Implemented (see `SOS_DISPATCH_PLAN.md`) |

---

## 13. Document map

| Doc | Role |
|---|---|
| `.docs/PROJECT.md` | Product definition & non-goals |
| `.docs/ARCHITECTURE.md` | Monorepo + layering rules |
| `.docs/API.md` | Full REST surface |
| `.docs/DECISIONS.md` | ADRs |
| `.docs/UI_GUIDELINES.md` | Theme tokens |
| `.docs/TASKS.md` / `ROADMAP.md` | Execution status |
| **This HLD** | System-wide design overview |
| **[LLD.md](./LLD.md)** | Module, schema, and sequence-level detail |
| `SOS_DISPATCH_PLAN.md` / `SOS_E2E_TESTING.md` | SOS feature design & test plan |
