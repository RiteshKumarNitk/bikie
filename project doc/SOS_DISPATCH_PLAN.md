# SOS Dispatch — Implementation Plan

**Status:** Implemented (2026-08-01)  
**Scope:** Red Alert / Amber Alert panic button → SMS + WhatsApp + Email (+ in-app/push) with live GPS to nearby riders, same-city service providers, and the reporter's emergency contacts.

---

## 1. Requirement (product)

When a member taps **SOS — Red** or **Amber** on the Panic Button:

1. Capture **GPS** (already done in `PanicAlertCards`).
2. Persist the alert (`SOSAlert`).
3. Immediately notify:
   - **Nearby Bikers** (opted-in live location within radius)
   - **Service Providers** (partners whose `city` matches the alert city)
   - **Emergency contacts** (from the reporter's `RiderEmergencyContact` rows)
4. Channels for each recipient (when contact info exists):
   - **SMS** (Twilio)
   - **WhatsApp** (Twilio WhatsApp sender)
   - **Email** (Resend)
5. Include rider name/phone, alert type/description, city, coordinates, and a Google Maps link.
6. Live credentials are **optional** until go-live — unset keys log `[SMS|WHATSAPP|EMAIL][DEV]` so the full path is testable locally/Docker.

---

## 2. Architecture

```
PanicAlertCards (UI)
  → POST /api/sos/alerts
      → SOSService.createAlert          (persist)
      → RealtimeService.publishGlobal   (SSE / admin live feed)
      → SOSDispatchService.fanOut       (NEW)
            ├─ riderLocationRepository.findNearbyAroundPoint(lat,lng)
            ├─ Partner.findMany({ city })
            ├─ riderProfile.emergencyContacts
            ├─ SOS_EMERGENCY_SERVICES_PHONE (optional env)
            ├─ SMSService.send
            ├─ WhatsAppService.send
            ├─ EmailService.send
            └─ NotificationService.notify (SOS_ALERT → in-app + push)
```

Layering stays `Route → Service → Repository → DB`. No Prisma imports under `apps/web` beyond the existing profile-completeness check.

---

## 3. Key files

| File | Role |
|---|---|
| `packages/services/src/sos-dispatch.service.ts` | Recipient resolution + channel fan-out |
| `packages/services/src/whatsapp.service.ts` | Twilio WhatsApp (DEV log fallback) |
| `packages/database/src/repositories/rider-location.repository.ts` | `findNearbyAroundPoint` for SOS GPS |
| `apps/web/app/api/sos/alerts/route.ts` | Calls `SOSDispatchService.fanOut` after create |
| `packages/database/prisma/seed.ts` | SOS E2E fixtures (membership, contacts, nearby GPS, Bangalore partner) |

---

## 4. Recipient rules

| Audience | How resolved | Channels |
|---|---|---|
| Nearby riders | PostGIS within `SOS_NEARBY_RADIUS_KM` (default 10) of alert lat/lng; `sharingEnabled` + fresh fix | SMS / WA / Email / in-app |
| Service providers | `Partner.city` case-insensitive match to alert city; also `contactPerson1/2Mobile` | SMS / WA / Email / in-app (for partner user) |
| Emergency contacts | `RiderEmergencyContact` on reporter profile | SMS / WA (phone only) |
| Emergency services | `SOS_EMERGENCY_SERVICES_PHONE` (+ optional email) | SMS / WA / Email |

Red vs Amber is preserved in `description` (`"Red Alert — …"` / `"Amber Alert — …"`) and reflected in message copy. Both kinds use the same fan-out set per product request.

---

## 4. Go-live / local live-send credentials

| Variable | Purpose |
|---|---|
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Shared Twilio auth (SMS already wired) |
| `TWILIO_MESSAGING_SERVICE_SID` or `TWILIO_FROM_NUMBER` | SMS sender |
| `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp, direct via Meta Cloud API (preferred) |
| `WHATSAPP_TEMPLATE_NAME` / `WHATSAPP_TEMPLATE_LANG` | Approved template used when the 24h free-form window is closed |
| `TWILIO_WHATSAPP_FROM` | WhatsApp fallback sender (`whatsapp:+…` sandbox or approved) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | Email, direct via SMTP (preferred) |
| `RESEND_API_KEY` | Email fallback, only used when SMTP is unset |
| `SOS_NEARBY_RADIUS_KM` | Search radius (default `10`) |
| `SOS_EMERGENCY_SERVICES_PHONE` | Optional fixed emergency number |
| `SOS_EMERGENCY_SERVICES_EMAIL` | Optional |

### Map links in every channel

Messages include:

- **Pin:** `https://maps.google.com/?q=<lat>,<lng>`
- **Navigate (distance):** `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>` — opens Google Maps directions so the recipient sees distance/ETA from *their* phone GPS (WhatsApp-style location share UX).

In-app `SOS_ALERT` notifications render an **Open in Maps** button. Over the Cloud API, WhatsApp additionally receives a **native location card** (Attach → Location equivalent) right after the text.

### Test inboxes / WhatsApp (seed)

| Rider | WhatsApp | Email |
|---|---|---|
| Nearby 1 | `+918107800370` | `arun8107800370@gmail.com` |
| Nearby 2 | `+919664361738` | `sharmamo@gmail.com` |

See `SOS_E2E_TESTING.md` for Mermaid flow + seed commands.

---

## 6. Out of scope (explicit)

- Calling public 112 / police APIs (use `SOS_EMERGENCY_SERVICES_PHONE` stub instead).
- Changing mobile Flutter SOS sheet to Red/Amber UX (web path only).
- Guaranteeing WhatsApp template approval (sandbox / approved sender is an ops step).
