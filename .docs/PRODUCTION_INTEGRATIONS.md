# BIKIE — Production Integrations (Deploy + E2E)

Checklist of third-party services to wire for **production deploy** and **end-to-end testing**.
Primary path matches what the code already uses (see `.env.example` and ADR-016 / ADR-017 / ADR-020).
Alternatives are noted where useful.

**Legend**

| Cost column | Meaning |
|---|---|
| **Paid** | Commercial SaaS / usage billing |
| **Freemium** | Free tier exists; production usually needs paid plan |
| **Open source** | Self-hostable OSS (you still pay for hosting) |
| **Free (quota)** | Google / Meta free tiers with quotas; overage or business features may be paid |

---

## 1. Master integration table

| # | Product capability | What we integrate | Primary vendor / service | Type | Open source? | Env vars / what you need | E2E test focus |
|---|---|---|---|---|---|---|---|
| 1 | Database | Postgres (+ PostGIS for nearby riders) | **Neon** | Freemium → Paid | No (managed). OSS alt: Postgres + PostGIS | `DATABASE_URL`, `DIRECT_URL` | Migrate, seed, SOS nearby radius, bookings |
| 2 | Auth sessions | Better Auth (in-repo) — session/account issuance only, OTP verification delegated to MSG91 (ADR-034) | **Better Auth** (OSS lib) | OSS lib | Better Auth: **yes** | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` | Phone OTP login/signup (via MSG91, see row 4b), cookie + bearer session |
| 3 | Google login | OAuth social provider | **Google Cloud** OAuth client | Free (quota) | No | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` + authorized redirect URIs | Continue with Google on login/signup |
| 4 | SMS (SOS only) | MSG91 SMS API (v2 sendsms) | **MSG91** | Paid | No | `MSG91_AUTH_KEY`, `MSG91_SENDER_ID`, `MSG91_ROUTE`, `MSG91_TEMPLATE_ID` (DLT template — see ADR-031) | SOS SMS to contacts / nearby / partners |
| 4b | OTP (login/signup) | MSG91 Widget SDK (web) + native OTP API (mobile) | **MSG91** | Paid | No | `MSG91_AUTH_KEY` (shared with row 4), `MSG91_OTP_TEMPLATE_ID`, `NEXT_PUBLIC_MSG91_WIDGET_ID`, `NEXT_PUBLIC_MSG91_WIDGET_TOKEN_AUTH` (see ADR-034) | Phone OTP send/verify on web (widget) and mobile (native API) |
| 5 | WhatsApp (SOS) | WhatsApp Cloud API | **Meta** (Facebook Developers) | Freemium / Paid business | No | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION`, approved `WHATSAPP_TEMPLATE_NAME` + lang | SOS WhatsApp text + location card; template outside 24h window |
| 5b | WhatsApp fallback | Twilio WhatsApp sender | **Twilio** | Paid | No | `TWILIO_WHATSAPP_FROM` (e.g. `whatsapp:+…`) | Same as above if Meta unset |
| 6 | Email (SOS + admin) | SMTP primary | **Any SMTP** (Gmail App Password, SES, etc.) | Free / Paid | Protocol open; providers vary | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Reporter receipt + recipient SOS emails |
| 6b | Email fallback | Hosted email API | **Resend** | Freemium | No | `RESEND_API_KEY` (used only if SMTP blank) | Same when SMTP unset |
| 7 | Push notifications | FCM | **Firebase** Cloud Messaging | Freemium | No (client/admin SDKs proprietary) | Server: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`; Client: `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | In-app notify + browser push on SOS / messages |
| 8 | Nearby help (petrol / mechanic / hospital) | Places API (New) | **Google Places** | Paid (usage) | No | `GOOGLE_PLACES_API_KEY` (server-only) | SOS Nearby Help tab returns places + Maps links |
| 9 | Image / file uploads | Media CDN | **Cloudinary** | Freemium | No | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Onboarding photo, chat attachments, admin uploads |
| 10 | Realtime + rate limit + SOS idempotency | Redis REST | **Upstash Redis** | Freemium | No (managed). OSS alt: Redis | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | SSE chat, typing, rate limits, duplicate SOS fan-out |
| 11 | Message encryption at rest | App crypto | Self-managed key | N/A | **Yes** (AES-256-GCM in app) | `MESSAGE_ENCRYPTION_KEY` (`openssl rand -base64 32`) | Send/receive encrypted chat decrypts for participants |
| 12 | Cron jobs | Scheduled HTTP | **Vercel Cron** (or Docker cron / external) | Freemium / Paid host | Scheduler depends on host | `CRON_SECRET` | `GET /api/cron/sos-resolve`, `GET /api/cron/rider-location-cleanup` with Bearer |
| 13 | App hosting | Next.js deploy | **Vercel** or **Docker** (compose) | Freemium / Paid | Next.js: OSS; host: paid | Host secrets + `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` matching public URL | Full site + `/api/*` + OpenAPI `GET /api/openapi` |
| 14 | Maps deep links | Google Maps URLs | **Google Maps** (links only today) | Free for deep links | No | No key for `maps.google.com` links used in SOS | Pin + navigate links open correctly |
| 15 | Payments *(future)* | Checkout | **Razorpay** | Paid | No | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — **not wired yet** | Membership / booking pay (Milestone 4) |
| 16 | Interactive maps *(future)* | Map SDK | **Mapbox** | Freemium | No | `NEXT_PUBLIC_MAPBOX_TOKEN` — **not wired yet** | Destination maps / route UI |

---

## 2. “Like WhatsApp → Meta” cheat sheet

| Capability | Primary platform (like Meta for WA) | Also acceptable |
|---|---|---|
| WhatsApp Business messaging | **Meta** WhatsApp Cloud API | Twilio WhatsApp |
| SMS | **MSG91** | Twilio, AWS SNS, etc. (code today = MSG91, ADR-031) |
| Email | **Your SMTP mailbox** (e.g. Gmail / SES) | **Resend** |
| Push | **Firebase (Google)** FCM | — |
| Places / nearby help | **Google Places API** | — |
| OAuth “Continue with Google” | **Google Cloud Console** OAuth | — |
| Database | **Neon** (Postgres) | Self-hosted Postgres + PostGIS |
| Redis / realtime | **Upstash** | Self-hosted Redis |
| Uploads | **Cloudinary** | S3 + CDN (would need code change) |
| Hosting | **Vercel** or Docker on any VPS | — |
| Payments (later) | **Razorpay** (India) | — |
| Maps UI (later) | **Mapbox** | Google Maps JS |

---

## 3. Open source vs paid (quick view)

| Layer | Open source / self-host | Paid / managed (recommended prod) |
|---|---|---|
| App framework | Next.js, Prisma, Better Auth, Vitest, Flutter | — |
| Database | PostgreSQL + PostGIS | Neon |
| Cache / realtime | Redis | Upstash Redis |
| SMS | — (need a carrier API) | MSG91 |
| WhatsApp | — (need Meta/BSP) | Meta Cloud API (+ Twilio fallback) |
| Email | Any SMTP server | Gmail App Password / SES / Resend |
| Push | — | Firebase FCM |
| Places | — | Google Places |
| Media | MinIO / S3-compatible (not wired) | Cloudinary |
| Auth Google | — | Google OAuth client |
| Payments | — | Razorpay (future) |
| Maps SDK | — | Mapbox (future) |

---

## 4. Deploy checklist (production)

Do in order:

1. **Neon** — create project, enable PostGIS if not already, set `DATABASE_URL` + `DIRECT_URL`, run migrations.
2. **Secrets** — generate `BETTER_AUTH_SECRET`, `CRON_SECRET`, `MESSAGE_ENCRYPTION_KEY`.
3. **Public URLs** — set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the real HTTPS origin (Docker compose currently forces `:3001` for local container).
4. **MSG91** — verify sender ID / DLT template registration for SOS SMS (`MSG91_TEMPLATE_ID`);
   register a separate DLT template for OTP content and set `MSG91_OTP_TEMPLATE_ID`; configure the
   OTP Widget in the MSG91 dashboard and set `NEXT_PUBLIC_MSG91_WIDGET_ID`/
   `NEXT_PUBLIC_MSG91_WIDGET_TOKEN_AUTH` (ADR-034); send a test OTP on both web (widget) and
   mobile (native API via `/api/otp/mobile/send`).
5. **Meta WhatsApp** — create app, add WhatsApp product, get token + phone number ID, submit template for production numbers.
6. **SMTP** (or Resend) — send a test SOS email.
7. **Upstash** — Redis REST URL + token (strongly recommended; without it limits/idempotency degrade per ADR-029).
8. **Cloudinary** — unsigned/signed upload path used by `/api/upload`.
9. **Firebase** — service account + web app + VAPID key for real push.
10. **Google** — OAuth client + Places API key (restrict by IP / server).
11. **Cron** — schedule both cron routes with `Authorization: Bearer <CRON_SECRET>`.
12. **Smoke** — `GET /api/openapi`, login, one booking read, one SOS in a controlled test city.

`SHOW_OTP_TOAST` must stay **false** in production. As of ADR-034 it only affects mobile's dev
bypass (`/api/otp/mobile/send`) — web's OTP flow goes through the MSG91 widget directly and has
no equivalent dev-toast path.

---

## 5. End-to-end testing matrix

| Journey | Services that must be live | Pass criteria |
|---|---|---|
| Phone OTP signup / login | MSG91 + Neon + Better Auth | OTP SMS arrives; session cookie / bearer works |
| Google login | Google OAuth + Neon | Account created/linked; lands as RENTER |
| SOS Red/Amber alert | MSG91 + Meta (or Twilio WA) + SMTP/Resend + Neon (+ Upstash preferred) | Alert persisted; SMS/WA/email only on **configured** channels + recipient contact fields; dispatch summary / logs show `channels=sms:…,wa:…,email:…` |
| Nearby riders | Neon PostGIS + rider location sharing | Nearby list within `SOS_NEARBY_RADIUS_KM` |
| Nearby help | Google Places (+ Upstash cache) | Petrol / repair / hospital results |
| Chat + SSE | Upstash + encryption key | Messages deliver; SSE events on web |
| Upload photo | Cloudinary | Image URL stored and shown |
| Push | Firebase Admin + client config | Browser receives push (after permission) |
| Cron SOS resolve | Host cron + `CRON_SECRET` | Stale alerts auto-resolve |
| Cron location cleanup | Same | Stale sharing disabled |
| Admin export | Neon only | CSV download, ≤ 10k rows, formula-safe |

**Without credentials:** adapters log `[SMS\|WHATSAPP\|EMAIL\|Push\|Places][DEV]` and WhatsApp may return `wa.me` click-to-send links — fine for local UI tests, **not** a production pass.

---

## 6. Minimum “go-live” vs “nice to have”

| Priority | Must have for real SOS + auth | Can wait |
|---|---|---|
| P0 | Neon, Better Auth secrets, MSG91 SMS, SMTP or Resend, Meta WhatsApp (or Twilio WA), public HTTPS URLs, `MESSAGE_ENCRYPTION_KEY`, `CRON_SECRET` | — |
| P1 | Upstash, Cloudinary, Google Places, Google OAuth | — |
| P2 | Firebase push (full) | Mapbox, Razorpay |

---

## 7. Rough signup links (vendor consoles)

| Service | Where to create |
|---|---|
| Neon | [https://console.neon.tech](https://console.neon.tech) |
| MSG91 | [https://control.msg91.com](https://control.msg91.com) |
| Meta WhatsApp | [https://developers.facebook.com](https://developers.facebook.com) → App → WhatsApp → API Setup |
| Resend | [https://resend.com](https://resend.com) |
| Upstash | [https://console.upstash.com](https://console.upstash.com) |
| Cloudinary | [https://cloudinary.com/console](https://cloudinary.com/console) |
| Firebase | [https://console.firebase.google.com](https://console.firebase.google.com) |
| Google Cloud (OAuth + Places) | [https://console.cloud.google.com](https://console.cloud.google.com) |
| Vercel | [https://vercel.com](https://vercel.com) |
| Razorpay *(future)* | [https://dashboard.razorpay.com](https://dashboard.razorpay.com) |
| Mapbox *(future)* | [https://account.mapbox.com](https://account.mapbox.com) |

---

*Generated for BIKIE deploy / E2E planning. Keep secrets only in `apps/web/.env.local` or host secret store — never commit real values. Variable names: `.env.example`.*
