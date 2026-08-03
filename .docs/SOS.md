# BIKIE — SOS Feature

Membership-gated emergency / assistance alerts. A rider sends a **Red** or **Amber** alert with live GPS; BIKIE fans out to emergency contacts, nearby riders, and same-city partners over **SMS / WhatsApp / Email / in-app** (only where each channel is configured and the recipient has the matching contact detail).

Related: `API.md` (routes), `PRODUCTION_INTEGRATIONS.md` (vendors), ADR-016 / ADR-018 / ADR-020 / ADR-029 in `DECISIONS.md`.

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
  F --> G[Alert saved + fan-out]
  G --> H[Contacts / nearby / partners notified]
  H --> I[Someone Responds]
  I --> J[Resolve or auto-cron]
```



---



## 2. Alert kinds


| Kind      | UI label                 | Intent                                                     |
| --------- | ------------------------ | ---------------------------------------------------------- |
| **RED**   | Red Alert — Emergency    | Accident, medical, serious hazard — strongest confirm copy |
| **AMBER** | Amber Alert — Assistance | Breakdown, fuel, lost — help needed, less critical tone    |


**Categories** (API `type`): `ACCIDENT` · `BIKE_BREAKDOWN` · `FUEL_EMPTY` · `MEDICAL` · `LOST` · `OTHER`

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
  API->>SOS: createAlert
  SOS-->>API: SOSAlertDTO
  API->>RT: publishGlobal sos_alert
  API->>Fan: fanOut(alert)
  Fan-->>API: dispatch summary
  API-->>UI: { alert, dispatch, profileWarning }
```



---



## 4. Fan-out: who gets notified

```mermaid
flowchart TB
  Alert[SOS Alert persisted] --> Idem{Idempotency claim<br/>sos-dispatch:alertId}
  Idem -->|Already done| Replay[Return cached summary]
  Idem -->|New| Resolve[Resolve recipients in parallel]

  Resolve --> EC[Emergency contacts<br/>from rider profile]
  Resolve --> NR[Nearby riders<br/>PostGIS around GPS]
  Resolve --> SP[Same-city partners<br/>+ contact mobiles]
  Resolve --> ES[Optional emergency services<br/>from env]

  EC --> Count{Any recipients?}
  NR --> Count
  SP --> Count
  ES --> Count

  Count -->|None| Esc[Escalate to ADMIN users<br/>log NO-RECIPIENTS]
  Count -->|Some| Chan
  Esc --> Chan

  Count --> Self[Always: in-app notice to the reporter<br/>responder count or 'nobody reached']

  Chan[Per recipient: channel selection] --> SMS[SMS if phone + Twilio]
  Chan --> WA[WhatsApp if phone + Meta/Twilio WA]
  Chan --> EM[Email if email + SMTP/Resend]
  Chan --> APP[In-app + push if platform userId]

  SMS --> Sum[SOSDispatchSummary]
  WA --> Sum
  EM --> Sum
  APP --> Sum
  Sum --> Remember[Remember summary for idempotency TTL]
```



**Channel rule (ADR-029):** a channel is used only when the **provider is configured** *and* the recipient has that contact field (phone → SMS/WhatsApp, email → email). Unconfigured WhatsApp still yields a `wa.me` click-to-send link for manual escalation.

**Never-silent rule (ADR-030):** an alert that resolves to zero recipients escalates to platform admins, logs `[SOS][DISPATCH][NO-RECIPIENTS]`, and reports `escalatedToAdmins` in the summary. The reporter always receives an in-app notice regardless of provider configuration, and the confirmation screen renders the real summary — recipient counts, per-channel `sent/attempted`, and which channels are unconfigured — instead of a fixed "sent via SMS, WhatsApp, and email" sentence. Emergency contacts may carry an optional `email`, so they are reachable by email too.

Reading a dispatch log line:

```
[SOS][DISPATCH] alert=… nearby=0 providers=0 contacts=0 sms=0/0 wa=0/0 email=0/0 inApp=0 admins=1 channels=sms:on,wa:off,email:off
```

`nearby/providers/contacts` are recipient coverage (a data/consent problem when zero); `channels=…:off` is a missing-credentials problem; `admins>0` means the alert reached nobody and had to be escalated.

---



## 5. Channel decision (per recipient)

```mermaid
flowchart TD
  R[Recipient] --> Avail[Deployment availability<br/>sms / whatsapp / email]
  Avail --> P{Has phone?}
  Avail --> E{Has email?}

  P -->|Yes + SMS configured| SMS[Send SMS]
  P -->|Yes + WA configured| WA[Send WhatsApp + optional location]
  P -->|Yes + WA not configured| Link[Add wa.me click-to-send]
  P -->|No| SkipPhone[Skip SMS/WA]

  E -->|Yes + email configured| Mail[Send email]
  E -->|No or email off| SkipMail[Skip email]

  R --> U{Has userId?}
  U -->|Yes| Notify[In-app SOS_ALERT + push]
  U -->|No| SkipApp[Skip in-app]
```



---



## 6. Module layout (code)

```mermaid
flowchart TB
  subgraph Web["apps/web"]
    UI[PanicAlertCards / SOS dashboard]
    Route[api/sos/alerts/*]
  end

  subgraph Services["packages/services"]
    Facade[SOSService / SOSDispatchService facades]
    Mod[modules/safety-location]
    App[application: sos + fan-out]
    Dom[domain: alert-kind, maps, channel-selection]
    Comm[modules/communications<br/>Sms / WhatsApp / Email / Push ports]
    Plat[modules/platform<br/>idempotency + retry]
  end

  subgraph Data["packages/database"]
    Repo[sos / rider-location / partner / contacts repos]
    PG[(Neon Postgres + PostGIS)]
  end

  UI --> Route
  Route --> Facade
  Facade --> Mod
  Mod --> App
  App --> Dom
  App --> Comm
  App --> Plat
  App --> Repo
  Repo --> PG
```



Layering: **UI → Route → Service facade → safety-location application → ports → repositories / provider adapters.**

---



## 7. Lifecycle after send

```mermaid
stateDiagram-v2
  [*] --> ACTIVE: POST create + fan-out
  ACTIVE --> ACTIVE: GET feed by city<br/>SSE sos_alert
  ACTIVE --> RESPONDED: POST …/respond<br/>(helper on the way)
  RESPONDED --> RESOLVED: POST …/resolve
  ACTIVE --> RESOLVED: POST …/resolve
  ACTIVE --> RESOLVED: Cron sos-resolve<br/>(stale ~120 min)
  RESOLVED --> [*]: History via /history
```




| Route                               | Who         | What                                         |
| ----------------------------------- | ----------- | -------------------------------------------- |
| `GET /api/sos/alerts?city=`         | Member      | Active alerts (non-admin **must** pass city) |
| `POST /api/sos/alerts`              | Member      | Create + fan-out                             |
| `GET /api/sos/alerts/history`       | Session     | Caller’s past alerts                         |
| `POST /api/sos/alerts/[id]/respond` | Member      | Notify reporter you’re nearby                |
| `POST /api/sos/alerts/[id]/resolve` | Session     | Mark resolved                                |
| `GET /api/cron/sos-resolve`         | Cron Bearer | Auto-resolve stale alerts                    |


---



## 8. Related SOS surfaces

```mermaid
flowchart LR
  subgraph SOS_Page["/dashboard/sos"]
    New[New Alert — Red/Amber]
    Feed[Active alerts feed]
    Help[Nearby Help — Places]
  end

  New --> API1[POST /api/sos/alerts]
  Feed --> API2[GET /api/sos/alerts]
  Help --> API3[GET /api/places/nearby]

  Loc[Rider location consent + PUT GPS] --> Nearby[GET /api/riders/nearby]
  Nearby -.-> Feed
```



- **Nearby riders** need sharing consent + a recent GPS fix (PostGIS radius, default ~10 km via `SOS_NEARBY_RADIUS_KM`).
- **Nearby help** uses Google Places (petrol / mechanic / hospital) — separate from panic fan-out.
- Profile **phone** + **emergency contacts** improve dispatch quality (`profileWarning` if phone missing).

---



## 9. Providers (production)


| Channel                             | Primary           | Fallback                            |
| ----------------------------------- | ----------------- | ----------------------------------- |
| SMS                                 | Twilio            | DEV console log                     |
| WhatsApp                            | Meta Cloud API    | Twilio WhatsApp → `wa.me` link      |
| Email                               | SMTP (nodemailer) | Resend → DEV log                    |
| Push                                | Firebase FCM      | DEV log                             |
| Realtime / rate limit / idempotency | Upstash Redis     | In-memory degrade (never block SOS) |


Full vendor table: `.docs/PRODUCTION_INTEGRATIONS.md`.

---



## 10. Key files


| Area           | Path                                                                               |
| -------------- | ---------------------------------------------------------------------------------- |
| UI             | `apps/web/components/shared/PanicAlertCards.tsx`                                   |
| Create API     | `apps/web/app/api/sos/alerts/route.ts`                                             |
| Fan-out        | `packages/services/src/modules/safety-location/application/fan-out.application.ts` |
| Channel policy | `packages/services/src/modules/safety-location/domain/channel-selection.ts`        |
| Facades        | `packages/services/src/sos.service.ts`, `sos-dispatch.service.ts`                  |


---

*Mermaid diagrams render in GitHub, most IDEs, and Cursor markdown preview.*