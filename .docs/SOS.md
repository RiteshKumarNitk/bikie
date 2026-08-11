# BIKIE — SOS Feature

Membership-gated emergency / assistance alerts. A rider sends a **Red** or **Amber** alert with
live GPS; BIKIE fans out in stages — emergency contacts immediately, then nearby Riders and
eligible Service Providers *together* as a shared, radius-widening candidate pool, admins as the
terminal fallback (ADR-047) — over **SMS / WhatsApp / Email / in-app** (only where each channel is
configured and the recipient has the matching contact detail). Exact contact info and GPS are
withheld from every candidate responder until one of them is actually assigned (ADR-045, extended
to every dispatch channel by ADR-048). A responder offers to help, the reporter accepts one offer
(atomically locking assignment — every other pending offer is auto-expired and those responders
are notified), and the two of them run an assisted session (chat, status updates, rating) through
to completion.

Related: `API.md` (routes), `PRODUCTION_INTEGRATIONS.md` (vendors), ADR-016 / ADR-018 / ADR-020 /
ADR-028 / ADR-029 / ADR-030 / ADR-033 / ADR-036 / ADR-038 / ADR-042 / ADR-044 / ADR-045 / ADR-047 /
ADR-048 in `DECISIONS.md`.

---

## 1. Story (one glance)

```mermaid
flowchart LR
  A[Rider in trouble] --> B{Logged in + membership?}
  B -->|No| Z[Login / Membership gate]
  B -->|Yes| C[Pick Red or Amber + category]
  C --> D[Capture GPS]
  D --> E[Confirm modal]
  E --> F[POST /api/sos/alerts]
  F --> G[Alert saved + immediate fan-out]
  G --> H[Staged escalation: community-first, then Riders + Service Providers together, then admin]
  H --> I[Someone offers to help]
  I --> J[Reporter accepts one offer]
  J --> K[Session: chat, status updates, rating]
  K --> L[Resolve — manual or auto-cron]
```

---

## 2. Alert kinds

| Kind      | UI label                 | Intent                                                     |
| --------- | ------------------------ | ------------------------------------------------------------ |
| **RED**   | Red Alert — Emergency    | Accident, medical, life-threatening — strongest confirm copy |
| **AMBER** | Amber Alert — Assistance | Breakdown, fuel, lost — help needed, less critical tone       |

**Categories** (API `type`, `SOSAlertType` enum): `ACCIDENT` · `LIFE_THREATENING` · `MEDICAL` ·
`BIKE_BREAKDOWN` · `FLAT_TYRE` · `FUEL_EMPTY` · `BATTERY_ISSUE` · `LOST` · `OTHER`.

`ACCIDENT` / `LIFE_THREATENING` / `MEDICAL` have no natural `Partner.type` mapping and only reach
service providers who've opted in as a general responder (`isGeneralResponder`, ADR-044); the
rest map to a specific partner type (`partnerTypeForAlertType`, `domain/partner-mapping.ts`).

---

## 3. Create-alert sequence (happy path)

```mermaid
sequenceDiagram
  actor Rider
  participant UI as Panic UI
  participant API as POST /api/sos/alerts
  participant Auth as requireMembership
  participant RL as RateLimitService
  participant SOS as SOSService
  participant RT as RealtimeService
  participant Fan as SOSDispatchService.fanOut
  participant Esc as Escalation.seedEscalation

  Rider->>UI: Tap Red/Amber → confirm
  UI->>API: JSON type, lat, lng, city, …
  API->>Auth: session + active membership
  alt No membership / no session
    Auth-->>UI: 401 / 403 MEMBERSHIP_REQUIRED
  end
  API->>RL: sos-alert-create (5 / 5 min)
  alt Over limit
    RL-->>UI: 429 Too many requests
  end
  API->>SOS: createAlert (severity server-derived from type)
  SOS-->>API: raw, unredacted alert
  API->>RT: publishGlobal sos_alert
  par
    API->>Fan: fanOut(alert) — emergency contacts + optional emergency-services number
    API->>Esc: seedEscalation(alert) — tier-1 nearby riders (community-first if any share a group)<br/>+ eligible Service Providers at the same starting radius (ADR-047)
  end
  API-->>UI: { alert, dispatch, profileWarning }
```

`dispatch`/`profileWarning` report what actually happened — real per-channel `sent/attempted`
counts and a distinct "nobody reached" state, never a fixed "sent via SMS/WhatsApp/email"
sentence (ADR-030).

---

## 4. Staged escalation (who gets notified, and when)

Emergency contacts and an optional configured emergency-services number go out immediately at
creation. Nearby Riders and eligible Service Providers go out **together**, as one shared,
radius-widening candidate pool (ADR-047) — a Service Provider is a parallel responder type, not a
later fallback reached only once every rider tier has timed out. A cron ticker
(`GET /api/cron/sos-escalate`) widens the search over time if nobody has been assigned yet.

```mermaid
flowchart TB
  Create[Alert created] --> Immediate[Immediate: emergency contacts<br/>+ optional emergency services<br/>+ tier-1 nearby riders 5km<br/>+ eligible Service Providers @ 5km]
  Immediate --> Zero{Any recipients<br/>found anywhere?}
  Zero -->|None| EscAdmin1[Escalate to admins immediately<br/>ADR-030 guarantee]
  Zero -->|Some| Wait[Wait for nextEscalationAt]

  Wait --> Tick[Cron tick: GET /api/cron/sos-escalate]
  Tick --> Community{Tier ==<br/>NEARBY_RIDERS_COMMUNITY?}
  Community -->|Yes, timed out| General[Advance to NEARBY_RIDERS_GENERAL<br/>notify the rest of the nearby pool<br/>+ any newly-eligible Service Providers]
  Community -->|No| RiderTier{Tier ==<br/>NEARBY_RIDERS_GENERAL<br/>and radius not maxed?}
  RiderTier -->|Yes| Widen[Widen radius +5km together —<br/>notify newly-in-range riders<br/>AND newly-in-range Service Providers]
  RiderTier -->|No, radius maxed| EscAdmin2[Escalate to admins — terminal tier<br/>neither a rider nor a provider accepted]

  General --> Notify[notifyRecipients → SMS/WhatsApp/Email/in-app]
  Widen --> Notify
  EscAdmin1 --> Notify
  EscAdmin2 --> Notify
```

**Community-first (ADR-033 Phase D).** If any nearby rider shares a Community/Club with the
reporter, the tier starts at `NEARBY_RIDERS_COMMUNITY` (shorter timeout, notifies only that rider
subset — Service Providers aren't "community members," so they're dispatched in this same round
regardless) before falling through to the full nearby pool at `NEARBY_RIDERS_GENERAL`. No shared
group members nearby → starts at `NEARBY_RIDERS_GENERAL` directly.

**Service-provider eligibility (ADR-044, ordering corrected by ADR-047).** A partner is only ever
dispatched an alert if: verified, currently `isAvailable`, within the **same widening radius the
rider search is currently using** (previously a fixed, unrelated 25km — now shared, so "nearby"
means one radius for both responder types at any given moment), category-matched
(`partnerTypeForAlertType`) or opted in as `isGeneralResponder` for unmapped categories, and not
already the assigned helper on another active session. There is **no** "broaden to anyone if the
strict search comes up empty" fallback — a fuel-delivery partner will never receive a medical
emergency. The alert never reaches nobody regardless: `tickEscalation` still advances to `ADMIN`
unconditionally once radius is maxed with no acceptance from either pool.

**Rider SOS opt-out (ADR-045).** A rider with `RiderLocation.receiveSosAlerts = false` never
appears in the nearby-rider candidate pool (`findNearbyAroundPoint`'s SQL, alongside the existing
`sharingEnabled` filter) — independent of their location-sharing status. Defaults `true`.

**Channel rule (ADR-029):** a channel is used only when the **provider is configured** *and* the
recipient has that contact field (phone → SMS/WhatsApp, email → email). Unconfigured WhatsApp
still yields a `wa.me` click-to-send link for manual escalation. Service-provider push copy is
distinct (`"🚨 Emergency Assistance Needed"` + category + distance + city, ADR-044) from the
generic rider-facing copy.

**Never-silent rule (ADR-030):** an alert that resolves to zero recipients anywhere escalates to
platform admins immediately, logs `[SOS][DISPATCH][NO-RECIPIENTS]`, and reports
`escalatedToAdmins` in the summary. The reporter always receives an in-app notice regardless of
provider configuration.

### 4b. Cron idempotency (ADR-052)

Both `GET /api/cron/sos-escalate` and `GET /api/cron/sos-resolve` claim an alert **before**
sending any notification, not after — a short-lived, atomic conditional `UPDATE` scoped to that
one alert (`claimAlertForEscalation` / `claimStaleAlertForResolve` in `sos.repository.ts`), not a
row lock held across the whole request. Two overlapping cron invocations (a slow tick still
running when the next minute fires, a retried request, anything hitting the endpoint twice) can
never both process the same alert — the second one's claim simply fails and it does nothing,
rather than sending a duplicate notification or writing a duplicate timeline event.

The escalation claim stamps `nextEscalationAt` to "now + 2 minutes" instead of clearing it, so a
crash mid-tick self-heals: the alert becomes due again within 2 minutes instead of staying stuck
forever (this is what keeps ADR-030's "never silently reach nobody" guarantee intact — a claim
failure is always a safe no-op, never a bug that quietly drops an alert).

---

## 5. Offer → accept → session lifecycle

Not a simple "notify → done" flow. A responder's relationship to an alert is tracked as an
`SOSAlertResponse`; once the reporter accepts one offer, a dedicated `SOSSession` (chat, status
timeline, rating) takes over.

```mermaid
stateDiagram-v2
  [*] --> ACTIVE: POST /api/sos/alerts
  ACTIVE --> ACTIVE: Escalation tiers advance (§4)

  state "SOSAlertResponse (per responder)" as Offer {
    [*] --> OFFERED: POST .../offer ("I'm Coming" / partner ACCEPT)
    OFFERED --> ACCEPTED: reporter/admin accepts this one
    OFFERED --> REJECTED: reporter/admin rejects this one
    OFFERED --> WITHDRAWN: responder taps "Cannot Help"
    OFFERED --> EXPIRED: a DIFFERENT offer on the same alert was accepted
    [*] --> DECLINED: POST .../decline — responder never offers at all (ADR-045)
  }

  ACTIVE --> Assigned: one offer ACCEPTED (transactional — only one can win)
  Assigned --> Session: SOSSession created (ACTIVE)
  Session --> Session: HELPER_ARRIVED → ASSISTANCE_IN_PROGRESS (helper-driven)
  Session --> COMPLETED: rider marks complete
  Session --> CANCELLED: either party cancels
  COMPLETED --> Rated: rider rates the helper (once)

  ACTIVE --> RESOLVED: POST .../resolve (reporter, assigned helper, or admin)
  ACTIVE --> RESOLVED: Cron sos-resolve (stale ~120 min, cascades session cancellation)
  RESOLVED --> [*]: History via /history
```

The reporter accepting an offer is one atomic transaction
(`sos-session.repository.ts`'s `acceptOffer`): it claims `SOSAlert.assignedHelperId`, flips the
accepted offer to `ACCEPTED`, **expires every other still-`OFFERED` response on that alert in the
same step**, and creates the `Conversation` + `SOSSession` — no orphaned `OFFERED` rows survive a
successful accept, and a losing concurrent accept attempt gets `409`/a typed error, never a
silent overwrite. Every responder whose offer was just expired this way is notified directly
("This assistance request has already been assigned to another responder," ADR-048) — they don't
have to refresh to find out.

**Decline (ADR-045).** A responder — typically a service provider browsing "Nearby Requests" —
can decline without ever offering (`POST /api/sos/alerts/[id]/decline`). This is a real,
persisted decision (same `SOSAlertResponse` table, `DECLINED` status), not a local UI dismissal:
it excludes that alert from the responder's own future "Nearby Requests" list. It does **not**
notify the reporter or appear in the alert's timeline — a private signal, same as silently not
offering always was.

---

## 6. PII redaction (ADR-045, extended to every dispatch channel by ADR-048)

Before anyone is assigned, most of a reporter's identifying info is withheld from anyone browsing,
viewing, **or being dispatched a notification about** the alert, if they aren't the reporter, the
eventually-assigned helper, or an admin.

| Field | Non-privileged viewer / dispatch recipient | Reporter / assigned helper / admin |
|---|---|---|
| `userName`, `type`, `severity`, `city`, `description` | visible | visible |
| `userPhone`, `userEmail` | `null` | visible |
| `latitude`, `longitude` | `null` | visible |
| `placeName`, `area`, `formattedAddress` (reverse-geocoded) | `null` | visible |
| `distanceMeters` (viewer-computed) | visible | visible |

Enforced at two boundaries, both funneling through the same `redactAlertForViewer`/
`isPrivilegedViewer` (`domain/pii-redaction.ts`) — one rule, not two that could drift apart:

- **Browse/detail API**: `sos.application.ts`'s `getActiveAlerts`/`getAlertById`, applied once at
  the HTTP boundary.
- **Outbound dispatch (ADR-048)**: `fan-out.application.ts`'s `dispatchToRecipient`, applied per
  recipient — redacted only for `NEARBY_RIDER`/`SERVICE_PROVIDER` roles (`isCandidateResponder`).
  The reporter's own emergency contacts, an emergency-services number, and platform admins are
  trusted/designated recipients and always get the unredacted alert. SMS/email text omits the
  GPS/map-link lines entirely when redacted (not just blanked) and shows a "shown once you're
  assigned" note instead; WhatsApp's native exact-GPS location card is skipped outright for a
  redacted recipient, since there's no approximate version of it worth sending.

Every other internal consumer (sessions, the partner dashboard) still works with the always-raw
`RawSOSAlertDTO` shape — redaction is applied only at these two outward-facing boundaries, never
inside business logic that doesn't need it. `distanceMeters` is deliberately never redacted — it's
derived, not identifying, and is what keeps a redacted view usable ("2.8 km away" without exposing
exactly where).

---

## 7. Route table

| Route | Method | Who | Notes |
| ----------------------------------------------- | ------ | ------------------ | -------------------------------------------------------------------- |
| `/api/sos/alerts` | GET | Member | `?lat=&lng=` (ADR-042) — 25km radius around the viewer; non-admin must supply both. Results redacted per §6. Admin sees every alert network-wide, unfiltered. Open to approved Service Providers too (ADR-046b) — they're always also Riders. |
| `/api/sos/alerts` | POST | Member | Create + immediate fan-out + tier-1 escalation seed. |
| `/api/sos/alerts/history` | GET | Session | Caller's own past alerts. |
| `/api/sos/alerts/[id]` | GET | Member | Alert + timeline. Redacted per §6 unless privileged. |
| `/api/sos/alerts/[id]/offer` | POST | Member | "I'm Coming" / partner "ACCEPT". Callers with an APPROVED Partner application (ADR-046b — checked via `session.user.partnerStatus`, not `role`) are additionally gated: verified, available, category-matched, not at capacity — applied regardless of the caller's current UI mode. |
| `/api/sos/alerts/[id]/decline` | POST | Member | Decline without ever offering (ADR-045). |
| `/api/sos/alerts/[id]/offers` | GET | Reporter/admin only | Offers received; responder phone withheld until `ACCEPTED`. |
| `/api/sos/alerts/[id]/offers/[offerId]/accept` | POST | Reporter/admin | Transactional assignment. |
| `/api/sos/alerts/[id]/offers/[offerId]/reject` | POST | Reporter/admin | Declines a specific offer without assigning. |
| `/api/sos/alerts/[id]/offers/[offerId]/withdraw` | POST | Offer owner | "Cannot Help." |
| `/api/sos/alerts/[id]/respond` | POST | Member | **Deprecated alias** for `/offer` (ADR-028) — kept for older clients. |
| `/api/sos/alerts/[id]/resolve` | POST | Reporter/helper/admin | Mark resolved. |
| `/api/sos/sessions/[id]` | GET | Session participants/admin | Session detail. |
| `/api/sos/sessions/[id]/status` | POST | Helper/rider/admin | `HELPER_ARRIVED`/`ASSISTANCE_IN_PROGRESS` (helper), `COMPLETED` (rider), `CANCELLED` (either). |
| `/api/sos/sessions/[id]/rating` | POST | Rider | Post-`COMPLETED`, once. |
| `/api/sos/partners` | GET | Member | `?city=&type=` — "Share Mechanic"/"Share Fuel Contact." City-string matched, not radius (known limitation, ADR-036). |
| `/api/rider-location/consent` | GET/PUT | Member | Live location sharing (findable/browsable) — separate from SOS opt-out below. |
| `/api/rider-location/sos-opt-out` | GET/PUT | Member | ADR-045 — independent of consent above: whether this rider is paged for SOS at all. |
| `/api/partner/availability` | PATCH | Partner | 🟢/⚫ toggle (ADR-044). |
| `/api/partner/sos/dashboard` | GET | Partner | Stats (ADR-044). |
| `/api/partner/sos/nearby` | GET | Partner | Eligible open requests, excludes already-offered/declined (ADR-045). |
| `/api/partner/sos/active` | GET | Partner | Current active-helper sessions. |
| `/api/partner/sos/history` | GET | Partner | Completed Assistance / Assistance History — finished (COMPLETED/CANCELLED) sessions (ADR-046b). |
| `/api/cron/sos-resolve` | GET | Cron Bearer | Auto-resolves alerts inactive 120+ min. |
| `/api/cron/sos-escalate` | GET | Cron Bearer | The staged-escalation ticker (§4). |

---

## 8. Web and mobile surfaces

```mermaid
flowchart LR
  subgraph Rider["Rider — /dashboard/sos"]
    New[New Alert — Red/Amber]
    Feed[Active alerts feed]
    Detail["/dashboard/sos/[id]<br/>offer/accept/session/chat/rate"]
    Settings["/dashboard/settings<br/>location sharing + SOS opt-out"]
  end

  subgraph Admin["Admin — /admin/sos"]
    Live[Live SSE feed, unfiltered]
    Resolve[One-click resolve]
  end

  subgraph Partner["Partner — /partner/sos (web) + mobile"]
    PHome["Home: availability, stats, previews"]
    PDetail["[id]: Accept/Decline → Waiting → Confirmed"]
  end

  New --> API1[POST /api/sos/alerts]
  Feed --> API2[GET /api/sos/alerts]
  Detail --> API3[offer/accept/reject/withdraw/status/rating]
  PHome --> API4["/api/partner/{availability,sos/*}"]
  PDetail --> API5["offer/decline/status — same routes as Detail"]
```

- **Rider** (web `/dashboard/sos*`, mobile `sos_screen.dart`/`sos_detail_screen.dart`): create,
  browse (redacted per §6), offer/accept/reject/withdraw, session chat/status/rating. Web and
  mobile are functionally at parity here.
- **Admin** (`/admin/sos`, web only): live SSE feed of every alert network-wide, one-click
  resolve, full access to any alert/session/offer via the generic detail page.
- **Partner** (ADR-044 mobile, ADR-045 web): a dedicated Emergency Assistance Dashboard — separate
  screens from the generic rider flow on both platforms, not a modification of it. Availability
  toggle, live stats, a distance-sorted eligible-requests list, and the same
  Accept/Decline/Waiting/Confirmed flow, built on the identical offer/accept/session backend the
  rider flow uses. `PUT /api/partner/profile` additionally accepts `isGeneralResponder`.
- **Nearby help** (`GET /api/places/nearby`, Google Places) is a separate, unrelated feature —
  petrol/mechanic/hospital lookup, not panic fan-out.
- Profile **phone** + **emergency contacts** improve dispatch quality
  (`profileWarning` in the create-alert response if phone is missing).

---

## 9. Providers (production)

| Channel                             | Primary           | Fallback                            |
| ------------------------------------ | ------------------ | ------------------------------------ |
| SMS                                  | MSG91 (ADR-031)   | DEV console log                     |
| WhatsApp                             | Meta Cloud API    | Twilio WhatsApp → `wa.me` link      |
| Email                                | SMTP (nodemailer) | Resend → DEV log                    |
| Push                                 | Firebase FCM      | DEV log                             |
| Realtime / rate limit / idempotency  | Upstash Redis     | In-memory degrade (never block SOS) |

Full vendor table: `.docs/PRODUCTION_INTEGRATIONS.md`.

---

## 10. Key files

| Area                        | Path                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| Rider create/browse UI       | `apps/web/components/shared/PanicAlertCards.tsx`, `apps/mobile/lib/features/sos/`           |
| Rider/generic detail UI      | `apps/web/app/(main)/dashboard/sos/[id]/page.tsx`, `sos_detail_screen.dart`                 |
| Partner dashboard UI         | `apps/web/app/(main)/partner/sos/`, `apps/mobile/lib/features/partner_dashboard/`           |
| Create API                   | `apps/web/app/api/sos/alerts/route.ts`                                                       |
| Offer/session/decline API    | `apps/web/app/api/sos/alerts/[id]/{offer,decline,offers,resolve}`, `apps/web/app/api/sos/sessions/[id]/*` |
| Escalation                   | `packages/services/.../safety-location/application/escalation.application.ts`               |
| Fan-out                      | `packages/services/.../safety-location/application/fan-out.application.ts`                  |
| PII redaction                | `packages/services/.../safety-location/domain/pii-redaction.ts`                              |
| Rider opt-out                | `packages/database/.../rider-location.repository.ts`, `apps/web/app/api/rider-location/sos-opt-out/route.ts` |
| Facades                      | `packages/services/src/sos.service.ts`, `sos-session.service.ts`, `sos-dispatch.service.ts`, `rider-location.service.ts` |
| Tests                        | `packages/services/.../safety-location/safety-location.test.ts` (unit), `safety-location.e2e.test.ts` (full-flow) |

---

*Mermaid diagrams render in GitHub, most IDEs, and Cursor markdown preview.*
