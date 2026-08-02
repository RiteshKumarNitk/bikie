# BIKIE — Production-Ready Modular Monolith Implementation Plan

**Status:** Phase 9 foundation (OpenAPI v1 snapshot + contract CI) complete — `/api/v2` and facade deletion remain gated; async outbox still deferred on staging NFR baselines
**Source:** `prompt.text`, `prompt2.text`, HLD/LLD, `.docs/*`  
**Primary constraint:** Preserve business behavior and every existing web/mobile API contract. Business logic never changes during structural migration.

---

## 1. Executive summary

BIKIE already has a useful three-layer direction:

`UI → Next.js Route Handler → @bikie/services → @bikie/database repository → Prisma`

The main problem is not the absence of layers; it is that the code is organized mostly
by technical layer rather than bounded business module, and the intended boundaries are
not consistently enforced. The migration will use a **Strangler pattern**:

1. characterize existing behavior;
2. define module public APIs and ports;
3. add compatibility facades at existing import paths;
4. migrate one vertical business slice at a time;
5. switch callers gradually;
6. delete legacy paths only after parity, security, and NFR gates pass.

This plan does not add Java, Spring, NextAuth, Kafka, JWT, CQRS, or every CRUD verb merely
because the generic prompt mentions them. BIKIE is a Next.js 16/TypeScript system using
Better Auth, Prisma, Neon, Upstash Redis, and Flutter. New infrastructure will be added only
for a measured requirement.

“One million users” is a capacity objective, not an architectural guarantee. Capacity
will be proven with workload models, query plans, load tests, provider limits, and
production telemetry.

---

## 2. Current architecture

### 2.1 Runtime

```
Web / Flutter
  → apps/web/app/api/** (Next.js Route Handlers)
    → packages/services
      → packages/database repositories
        → Prisma 7 + Neon Postgres / PostGIS

External: Upstash Redis, Cloudinary, Google Places, Firebase FCM,
Twilio, Meta WhatsApp, SMTP/Resend, Google OAuth
```

### 2.2 Existing strengths

- API boundary shared by web and Flutter.
- Better Auth supports cookie and bearer sessions simultaneously.
- Prisma is mostly isolated in `packages/database`.
- Zod validation and shared DTO packages already exist.
- PostGIS supports nearby-rider queries.
- Redis replaces process-local realtime state.
- Message content uses AES-256-GCM at rest.
- Atomic seat decrement protects ride capacity.
- Admin and moderation audit ledgers exist.
- External channels have development fallbacks.

### 2.3 Verified audit findings (initial + 2026-08-01 follow-up)

| ID | Severity | Finding | Evidence / status |
|---|---|---|---|
| A-01 | High | No TypeScript unit/integration/API test framework | **Mitigated** — Vitest + characterization tests landed |
| A-02 | High | Presentation bypasses service/repository in routes | **Mitigated** — phone/presence/SOS/export + AuditService |
| A-03 | High | SOS service queried Prisma partners directly | **Mitigated** — `partnerRepository.findPartnersByCityForDispatch` |
| A-04 | High | Vendor logic in concrete communication services | **Mitigated** — communications ports/adapters (ADR-021) |
| A-05 | High | Provider HTTP without timeout | **Mitigated** — `PROVIDER_HTTP_TIMEOUT_MS` |
| A-16 | P0 | `/api/dev/otp` unauthenticated OTP leak | **Mitigated** — production blocked; opt-in `SHOW_OTP_TOAST=true` |
| A-17 | P0 | Client-writable `User.role` on Better Auth | **Mitigated** — `input: false` |
| A-18 | P0 | Banned/suspended bypassed `requireRole`/`requireMembership` | **Mitigated** — shared `assertAccountActive` |
| A-19 | P0 | Google UI missing vs ADR-017/TASKS claims | **Open** |
| A-20 | P0 | Ride approve not one transaction | **Open** |
| A-21 | P0 | Redis missing fail-open for rate limits | **Open** |
| A-06–A-15 | Med/Low | Flat services barrel, indexes, pagination, OpenAPI, docs drift | See TASKS backlog |

Audits: [architecture](8a5912c4-a108-4601-817c-c7cfd3321555), [security/API](c7b1e413-b869-4e33-8709-331c1c8e6767), [database/NFR](6c98d8fb-7281-4dc8-844a-1dca46787fe0).

---

## 3. Target architecture

### 3.1 Dependency rule

```
Presentation
  Next.js routes / server components / Flutter API client
          │
          ▼
Module public API
  Commands, queries, request/result DTOs
          │
          ▼
Application
  Use cases, orchestration, transaction boundary
          │
          ▼
Domain
  Policies, entities/value objects where behavior warrants them, domain errors
          │
          ▼ (interfaces point inward)
Ports
  Repository, clock, ID, queue, payment, SMS, email, push, storage, maps
          ▲
          │
Infrastructure adapters
  Prisma repositories, Twilio, Meta, SMTP, Resend, FCM, Cloudinary, Google, Redis
```

Domain and application code must not import Next.js, Prisma, database records, vendor
SDKs, or environment variables.

### 3.2 Bounded contexts

| Module | Owns | Initial public capabilities |
|---|---|---|
| `identity-access` | Better Auth integration, session policy, roles/permissions | authenticate, require identity/role/permission |
| `users-profiles` | User and rider profile, emergency contacts, onboarding | profile queries/commands |
| `catalog` | Bikes, categories, destinations, testimonials | search/get catalog |
| `rentals-bookings` | Booking lifecycle, review eligibility, wishlist | create/list bookings, reviews, wishlist |
| `rides-community` | Trips/Rides, participation, Ride Room, Groups | ride and room use cases |
| `messaging` | Conversations, encrypted messages, receipts/reactions/media | conversation/message use cases |
| `memberships-referrals` | Plans, memberships, referral links | eligibility/purchase/referral |
| `safety-location` | SOS, dispatch policy, nearby riders, Places | create/respond/resolve alert, location |
| `communications` | Email/SMS/WhatsApp/push ports and adapters | provider-neutral send operations |
| `partners` | Partner profile and fleet-facing operations | partner commands/queries |
| `administration` | Admin CRUD/export/audit | administrative use cases |
| `trust-safety` | Reports and moderation state/action | report/moderate/restore |

Notifications may begin inside `communications` as delivery infrastructure while the
in-app notification domain remains a dedicated capability. The final boundary will follow
observed coupling from the audit.

### 3.3 Transitional folder structure

Do not immediately create many deployable packages. First establish boundaries inside the
existing packages, preserving build and imports:

```
packages/services/src/
  modules/
    communications/
      application/
      domain/
      ports/
      infrastructure/
      public.ts
    safety-location/
      application/
      domain/
      ports/
      infrastructure/
      public.ts
    ...
  shared/
    application/       # Result/error primitives only
    infrastructure/    # config/logging/telemetry adapters

packages/database/src/
  modules/
    safety-location/
    catalog/
    ...

apps/web/
  app/api/**            # compatibility routes remain at existing URLs
  lib/http/             # auth/validation/error/response composition
```

When a module boundary is stable and independently extractable, it may become a workspace
package under `packages/modules/<name>`. Package splitting is an outcome, not phase one.

---

## 4. Migration principles

1. **Backward compatibility:** no route, request, response, status, cookie, bearer, or
   Flutter behavior changes without a versioned migration.
2. **Characterization first:** capture behavior before moving it.
3. **Compatibility facade:** old service exports call the new module public API.
4. **Expand/contract database changes:** add nullable/new structures, dual-read/write only
   when necessary, backfill, switch reads, then remove legacy later.
5. **One context at a time:** avoid cross-project moves.
6. **Ports at volatile boundaries:** provider interfaces for communications, storage,
   payments, maps, queues, time, IDs; no interface ceremony for stable pure functions.
7. **Measured infrastructure:** Redis/queue/DLQ/read replicas only when workload evidence
   justifies them.
8. **Feature flags:** temporary, server-side, named owner/removal criteria, old path retained
   until parity.
9. **Observability:** structured logs, correlation IDs, metrics and traces around use cases,
   repositories, and provider calls.
10. **Security by threat model:** preserve Better Auth and improve its actual gaps instead of
    introducing a parallel JWT stack.

---

## 5. Delivery roadmap

### Phase 0 — Governance and complete audit

**Deliverables**

- `.cursor/agents`, rules, skills, and prompts.
- Dependency graph and cycle report.
- Duplicate/dead-code report with evidence.
- Security and privacy threat model.
- API inventory/contract snapshot.
- Database query/index/transaction audit.
- Performance baseline and workload assumptions.

**Exit criteria**

- Findings prioritized by severity and module.
- No unverified “dead code” deletions.
- First migration slice approved with rollback.

### Phase 1 — Test and contract foundation

**Work**

- Add a TypeScript test runner and root/workspace `test` scripts.
- Add characterization tests for selected services.
- Add Route Handler integration harness and API response snapshots.
- Establish test database strategy and deterministic factories.
- Add CI gates: typecheck, lint, unit, integration, contract.
- Capture OpenAPI incrementally from existing behavior.

**Exit criteria**

- Critical contracts are executable.
- New module code has meaningful branch coverage (normally ≥80%).
- Existing behavior failures are distinguishable from migration regressions.

### Phase 2 — Communications ports/adapters (first code slice)

**Why first:** clear vendor boundary, high testability, broad reuse, no URL/schema change.

**Work**

- Define `EmailPort`, `SmsPort`, `WhatsAppPort`, `PushPort`, normalized results/errors.
- Move SMTP/Resend, Twilio, Meta, FCM details into infrastructure adapters.
- Add timeout and bounded safe retry policy.
- Add composition factory selected by validated configuration.
- Keep `EmailService`, `SMSService`, `WhatsAppService`, and `PushService` as facades.
- Inject ports into SOS, notification, auth OTP, and admin use cases gradually.

**Exit criteria**

- Business/application code has no provider names or direct provider HTTP calls.
- Existing exports and API behavior pass compatibility tests.
- Provider success, timeout, rejection, and dev fallback tests pass.

### Phase 3 — Safety/location module ✅ Complete (ADR-022)

**Work**

- Introduce SOS application use cases and repository/provider ports.
- Move partner-recipient lookup from direct Prisma access to a repository port.
- Separate recipient resolution, content policy, dispatch orchestration, and summaries.
- Add idempotency for fan-out and background execution design.
- Preserve synchronous response shape while optionally flagging async dispatch.
- Include nearby riders, emergency contacts, Places, and location consent boundaries.

**Landed**

- `modules/safety-location` with domain/application/ports/infrastructure + facades.
- Partner dispatch mapped to DTOs (no Prisma shapes in application).
- Places vendor HTTP + Redis moved behind `PlacesPort` (timeout-aware fetch).
- Characterization tests for domain + fan-out accounting.
- Async dispatch / outbox / idempotency keys deferred to Phase 8 (measured need).

**Exit criteria**

- SOS route is transport-only. ✅ (unchanged; still calls facades)
- No direct Prisma in service/application code. ✅ (adapters only)
- Concurrent/replayed dispatch cannot duplicate paid side effects. ✅ Phase 8 (idempotency key)
- E2E plan in `SOS_E2E_TESTING.md` passes. (manual — behavior unchanged)

### Phase 4 — Identity and access ✅ Complete (ADR-023)

**Work**

- Centralize session/role/membership/ownership/account-status policies.
- Add permission policies where roles are too coarse.
- Verify secure-cookie, CSRF/origin, OAuth, OTP retry/expiry/lock, session revocation.
- Remove direct user mutations from Route Handlers.
- Decide refresh/rotation requirements through Better Auth capabilities.

**Landed (ADR-023)**

- `modules/identity-access` with `isAccountRestricted`, `hasRole`, derived permission
  catalog, and a transport-neutral `AccessDecision`.
- `apps/web/lib/require-role.ts` is now HTTP mapping only; all four gate helpers
  (`assertAccountActive`, `requireSession`, `requireMembership`, `requireRole`) delegate to
  `access.evaluate*` and return byte-identical status codes and bodies.
- `requirePermission()` added as an opt-in gate; permissions are derived from role, so a
  permission check can never be broader than the equivalent role check.
- Better Auth OTP delivery goes through `otp.sendLoginOtp` (communications `SmsPort` + dev
  echo), and `callbackOnVerification` uses `userRepository.updatePhone` instead of Prisma.
- OTP expiry is a single constant shared by the plugin config and the SMS copy.

**Verified already in place (no change needed)**

- Secure cookies + `sameSite=lax` in production, trusted-origin CSRF list, durable Redis
  rate limiting, OTP length/expiry/attempt limits (`allowedAttempts: 3`), `role` and
  `accountStatus` non-writable by clients (`input: false`).

**Deferred with reason**

- Refresh-token rotation / session revocation UI: Better Auth already owns session storage
  and revocation; no measured gap justifies a parallel JWT stack (see non-goal below).
- Ownership policies (`booking:manage:own` style resource checks) stay in their owning
  modules until Phase 5–7 migrate those contexts.

**Exit criteria**

- One authorization policy, unit-tested, with no duplicated status/expiry logic. ✅
- No route-handler or auth-hook writes bypassing repositories. ✅
- Existing 401/403 payloads unchanged. ✅ (web typecheck + tests across ~50 gated routes)

**Non-goal**

- Do not replace Better Auth with custom JWT/refresh-token code without a proven gap.

### Phase 5 — Rentals/catalog/partner ✅ Complete (ADR-024)

- Migrate catalog queries and cache policy.
- Migrate booking lifecycle with transaction/idempotency rules.
- Migrate reviews/wishlist and partner/fleet operations.
- Add composite indexes based on actual query plans.
- Preserve Flutter DTOs and existing route cache semantics.

**Landed**

- `modules/catalog` — bikes / destinations / categories / testimonials behind
  `BikeService` / `DestinationService` / `CategoryService` / `TestimonialService` facades.
  Search defaults (`page=1`, `pageSize=12`) live in domain.
- `modules/rentals-bookings` — booking pricing/date/status policy, review eligibility,
  wishlist; facades for `BookingService` / `ReviewService` / `WishlistService`. Overlap
  locking remains in `bookingRepository.createBookingIfAvailable` (unchanged transaction).
- `modules/partners` — profile upsert + dashboard stats behind `PartnerService`.
- Additive indexes: `Booking(bikeId,startDate,endDate)`, `Partner(city)`, `Bike(city)`,
  `Bike(ownerId)`, `TripParticipant(userId)` — migration
  `20260802000000_phase5_query_indexes`.

**Deferred**

- HTTP-layer cache / `revalidate` policy stays on Route Handlers (Next.js concern).
- Payment gateway ports remain Milestone 4 (Razorpay still env-only / dummy membership).
- Catalog Redis cache for search — no measured hot path yet; Places cache pattern is the
  template when needed.

**Exit criteria**

- Existing booking 404/409/400 reasons and review 404/400/403 reasons unchanged. ✅
- Flutter DTOs / route envelopes unchanged. ✅
- Characterization tests for pricing, eligibility, search defaults. ✅

### Phase 6 — Rides/community and messaging ✅ Complete (ADR-025)

- Encapsulate ride participation state machine and atomic seat accounting.
- Separate Ride Room application services from message implementation.
- Encapsulate encryption, receipts, reactions, realtime publishing via ports.
- Add concurrency and authorization integration tests.
- Preserve SSE for web and polling contracts for mobile.

**Landed**

- P0: `approveParticipantAtomically` — one transaction locks the trip, decrements seats,
  marks APPROVED, and get-or-creates the ride conversation. Notifications/system messages
  stay outside so a push failure cannot roll back seats.
- `modules/rides-community` — join/decide/leave domain, room-access policy, trip + ride-room
  applications; facades `TripService` / `RideRoomService`.
- `modules/messaging` — mute policy, crypto/realtime/account-status ports; facade
  `MessageService`. Encryption still AES-256-GCM via `message-crypto`.
- Characterization tests for participation, room access, atomic approve path, mute policy.

**Exit criteria**

- Approve/reject API reasons (`NOT_FOUND`/`FORBIDDEN`/`ALREADY_DECIDED`/`NO_SEATS`) unchanged. ✅
- SSE web + polling mobile contracts unchanged (still via RealtimeService / REST). ✅
- Seat + approve + conversation cannot partially commit. ✅

### Phase 7 — Administration and trust/safety ✅ Complete (ADR-026)

- Move admin routes behind application use cases.
- Centralize audit requirements.
- Preserve moderation state machine and action ledger.
- Secure CSV export against formula injection and large unbounded exports.

**Landed**

- `modules/administration` — Admin CRUD + CSV domain (`sanitizeCsvCell`, `buildCsv`,
  `MAX_ADMIN_CSV_ROWS = 10_000`); facade `AdminService`.
- `modules/trust-safety` — reports, moderation actions (WARN/MUTE/SUSPEND/BAN/UNBAN +
  message/room), audit log; facades `ReportService` / `ModerationService` / `AuditService`.
- Export repository queries take at most 10k rows ordered by `createdAt desc`.
- CSV formula injection also guards `\t` / `\r` leading characters.

**Exit criteria**

- Admin export still formula-safe; now also size-bounded. ✅
- Moderation ledger + notification/realtime side effects unchanged. ✅
- Audit writes still go through `AuditService` (no route→repository). ✅

### Phase 8 — Scalability and asynchronous work

**Foundation landed (ADR-027)** without introducing Kafka/Bull:

- `modules/platform` — `JobQueuePort` (default in-process sync), `IdempotencyPort`
  (Upstash SET NX or memory), `withRetry` with full jitter.
- SOS fan-out idempotency key `sos-dispatch:{alertId}` (claim → fan-out → remember summary).
- Message history soft bound (newest 200 / hard max 500).
- Production Upstash mandate for `RateLimitService` (fail closed).
- NFR baseline scaffold (`nfr-baseline.test.ts`) for domain hot paths.
- Feature flag `SOS_ASYNC_DISPATCH` reserved; default remains sync HTTP response shape.

**Still deferred until measured baselines:**

- Introduce an outbox for reliable domain events.
- Add queue/worker adapters for provider fan-out and heavy exports.
- Add DLQ for non-recoverable jobs.
- Evaluate read replicas, partitioning, and CDN/cache changes.

### Phase 9 — Contract versioning and legacy removal

**Foundation landed (ADR-028):**

- OpenAPI 3.1 snapshot for all Route Handlers (`pnpm openapi:generate`).
- `GET /api/openapi` + static `/openapi-v1.json`.
- Route inventory + Vitest contract sync check.
- Deprecation / request-id helpers (`apps/web/lib/api-contract.ts`).
- Auth matrix + facade removal registry (no facade deletes yet).

**Still gated:**

- Add `/api/v2` only for approved breaking improvements (none approved).
- Deprecate with telemetry and consumer migration windows (use helpers when sunsetting).
- Remove compatibility facades, flags, and dead legacy paths after zero-use proof.

---

## 6. Testing strategy

| Level | Focus | Examples |
|---|---|---|
| Unit | Domain/application behavior | booking totals, seat policy, dispatch recipient policy |
| Adapter unit | Provider mapping/errors | Twilio/Meta/SMTP response normalization |
| Repository integration | SQL, constraints, transactions | seat concurrency, review uniqueness, PostGIS radius |
| Route integration | HTTP contract and auth | 400/401/403/404/409, cookie and bearer |
| Contract | Old vs new parity | response envelope/status snapshot |
| E2E | Critical journeys | signup, booking, ride approval/chat, SOS |
| Security | Abuse and access | IDOR, role bypass, OTP brute force, upload, CSRF |
| NFR | Latency/reliability | p95/p99, query count, timeout/fallback, load |

Live paid providers are excluded from regular CI; use fakes or provider test/sandbox modes.

---

## 7. Security plan

- Build an endpoint authorization matrix: session, role, permission, membership, ownership.
- Verify Better Auth session rotation/revocation and OTP protections.
- Add origin/CSRF verification where cookie-authenticated mutations need it.
- Set CSP and security headers compatible with Next.js and current providers.
- Bound and validate all request bodies, queries, file sizes/types, and pagination.
- Parameterize all raw SQL values and review PostGIS queries.
- Mask phones, emails, IDs, location, provider bodies, tokens, and OTPs in production logs.
- Disable test OTP exposure in production by secure default.
- Add request IDs and immutable admin/moderation audit events.
- Threat-model SOS/location privacy and retention.
- Scan dependencies and secrets in CI.

---

## 8. API and NFR plan

### Contract rules

- Domain-supported methods only; not every resource needs all five CRUD verbs.
- Current `/api/*` stays v1-compatible.
- Use bounded pagination with explicit maximums.
- Standardize errors through a compatibility-aware HTTP mapper.
- Add request IDs and provider-safe error codes.

### Initial budgets (revise after baseline)

- Read API p95 ≤ 500 ms at agreed normal load.
- Write API p95 ≤ 800 ms, excluding asynchronous provider completion.
- Error rate < 1% excluding intended 4xx.
- Default page ≤ 50 records with a hard maximum.
- No unbounded external request; every provider call has a timeout.

### Capacity stages

1. **1k registered users:** establish baseline and correctness.
2. **100k registered users:** production-like data volume/query plans and cache behavior.
3. **1M registered users:** model daily/monthly active users and peak concurrency; test the
   peak, not one million simultaneous sessions unless the product requires it.

---

## 9. Database plan

- Map every repository method to query shape and index.
- Add composite/partial indexes only from query plans.
- Use transactions for multi-write invariants.
- Retain explicit conditional updates for contention-sensitive counters.
- Add optimistic versioning only to aggregates with demonstrated lost-update risk.
- Review cascades, nullable ownership, uniqueness, retention, and PII deletion.
- Monitor Neon pool limits and serverless connection behavior.
- Preserve hand-written PostGIS migration and GiST index.
- Use expand/backfill/switch/contract migrations with backup and rollback notes.

---

## 10. Observability and operations

- Structured JSON logger with request/correlation IDs.
- Metrics: route duration/status, use-case duration, DB query duration/count, pool pressure,
  cache hit/miss, provider latency/result, queue age/retry/DLQ.
- Traces across route → use case → repository/adapter.
- Alerts based on error budget and provider failure rate.
- Health/readiness checks that distinguish app, DB, Redis, and optional providers.
- Runbooks for database migration, provider outage, Redis degradation, key rotation, and rollback.

---

## 11. Compatibility, feature flags, and rollback

For each migrated use case:

1. Add characterization tests.
2. Introduce new module behind existing facade.
3. Optional shadow read/compare for deterministic queries.
4. Enable by environment/server-side percentage or allowlist.
5. Observe error, latency, and contract differences.
6. Roll back by flag without schema rollback.
7. Remove old code only after an agreed stability window.

Every flag must have owner, default, expiry/removal condition, and telemetry.

---

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Big-bang rewrite breaks hidden flows | Characterization tests, vertical slices, facades |
| Mobile contract regression | API snapshots and bearer-auth tests |
| Schema migration data loss | Expand/contract, backup, rehearsal |
| Abstraction overhead | Ports only at volatile/test boundaries |
| Dual-path drift | One facade, parity tests, short flag lifetime |
| Queue changes SOS semantics | Preserve response; introduce async behind flag/idempotency |
| Better Auth replaced unnecessarily | Capability audit and ADR required |
| “1M users” overengineering | Measured workload and staged capacity tests |
| Existing uncommitted work collision | Limit edits to planned files; never discard user changes |

---

## 13. Definition of done for each module

- Public API and ownership documented.
- Dependency boundary enforced.
- Existing API contract unchanged or versioned/approved.
- Unit, integration, route, contract, security, and relevant E2E tests pass.
- No critical/high security finding.
- NFR baseline has no regression beyond agreed budget.
- Data migration rehearsed and reversible/mitigated.
- Logs/metrics/runbook added.
- Architecture/API/ADR/tasks/roadmap/changelog updated.
- Compatibility facade and feature flag have a removal task.

---

## 14. Immediate implementation sequence

### Completed (Phase 0–2)

1. Finish repository-wide audit and append evidence.
2. Add test runner and scripts without changing runtime behavior.
3. Add characterization tests for Email/SMS/WhatsApp result semantics and SOS formatting.
4. Create communications port interfaces and adapter factories.
5. Convert legacy communication services to compatibility facades.
6. Inject ports into SOS dispatch and move partner lookup to a repository.
7. Run typecheck/lint/tests and perform security/NFR/code review gates.

### Phase 3 — Safety-location module (current)

**Constraint:** identical API envelopes, status codes, dispatch summary fields, RED/AMBER
prefix rules, PostGIS stale windows, Places cache key formula, and cron behavior.

1. Extract domain helpers (`maps`, `alertKind`, dispatch message builders) into
   `modules/safety-location/domain`.
2. Define repository/provider ports: SOS alerts, rider location, partner dispatch DTOs,
   emergency contacts, user contact fields, places, in-app notification.
3. Move SOS CRUD, rider-location, Places, and fan-out orchestration into application
   use cases behind `createSafetyLocationModule()` / `getSafetyLocationModule()`.
4. Keep `SOSService`, `SOSDispatchService`, `RiderLocationService`, `PlacesService`, and
   `sos-maps` exports as compatibility facades at existing import paths.
5. Add characterization tests for alert kind, message builders, rider-location mapping,
   Places DEV fallback, and fan-out accounting with fake ports.
6. Do **not** change route URLs, Zod schemas, Flutter parsers, or membership/auth gates.
7. Defer async dispatch / outbox / Kafka until measured NFR evidence (Phase 8).

**Exit criteria:** existing SOS E2E checklist still valid; Vitest suite green; no Prisma or
vendor SDK imports in application/domain; docs/ADR updated.
