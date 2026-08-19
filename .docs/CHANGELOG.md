# BIKIE Changelog

## 2026-08-19 — Service Provider role/accountType mismatch, and the 500 behind it (ADR-055)

A Service Provider signup produced an account that `/admin/users` showed as
`Account Type: SERVICE_PROVIDER` / `Role: RENTER`, and logging into it hit a 500. Two unrelated
defects, plus a third found while verifying the fix.

**`role` now mirrors `accountType`.** `SERVICE_PROVIDER → PARTNER`, `RIDER → RENTER`, `ADMIN`
preserved — written in the same statement as `accountType` at all three write paths (signup,
admin panel, approved change request), so the two can't drift. `PARTNER` was never actually
retired: the enum still has it, the admin UI edits it, and `permissionsForRole` grants
`fleet:manage` to `PARTNER` only — so the old "everyone stays RENTER" rule was denying Service
Providers the one permission that names their job. `role` stays authorization-inert;
`evaluatePartnerCapability` still gates on `accountType` + profile + membership.

**The 500 was not the role.** `/partner/**` pages gate on `accountType` + `partnerStatus`, but
every `/api/partner/**` route also requires an active Service Provider membership — deliberately,
so a new provider can reach `/partner/membership` and buy one. Six server components fetched
their own data with a bare `getJson`, turning that expected 403 into an unhandled throw and a
500 page on a brand-new provider's first dashboard visit. New `getJsonOrFallback` falls back on
401/403 only, so a real 5xx still surfaces instead of hiding behind an empty state.
`GET /api/partner/profile` also moved off the membership gate, matching `PUT`.

**Stale sessions.** With Upstash configured, Better Auth's `secondaryStorage` caches the whole
`{session, user}` document and `getSession` never re-reads Postgres. BIKIE writes
`role`/`accountType` through Prisma, which bypasses the `refreshUserSessions` hook Better Auth
runs inside its own `updateUser` — so in production the signup wrote the right row and left the
session saying `accountType: "RIDER"`, and `/partner-onboarding` bounced the new Service Provider
to `/account-type-request`. New `refreshCachedUserSessions` from `@bikie/auth` is now called
after each of those writes. No-op without Upstash, which is why local dev never showed it.

**Seed fixed** — the three Service Provider personas set `partnerStatus` but never `accountType`,
so a freshly seeded DB routed them as Riders; the live DB only looked right because ADR-053's
backfill migration had patched it afterwards.

**Data**: 6 `SERVICE_PROVIDER` users had `role: RENTER` (0 `RIDER` mismatches, `ADMIN` untouched).
Corrected by a one-shot idempotent statement rather than a migration — the schema didn't change,
these are just rows written before the code was fixed. Affected users must re-login for the new
`role` to reach their cached session.

```sql
UPDATE "user" SET role = 'PARTNER'
 WHERE "accountType" = 'SERVICE_PROVIDER' AND role = 'RENTER';
```

Verified: `tsc --noEmit` clean across all 8 packages, 199/199 tests pass, `next build` succeeds,
all changed files lint clean. Full details in DECISIONS.md ADR-055.

## 2026-08-11 — Rider/Service Provider account type: mutually exclusive, admin-approved changes (ADR-053)

Replaced the "dual capability" model (one account could be Rider + Service Provider at the same
time, switchable via a client-routing cookie) with a single, server-authoritative `accountType`
chosen once at registration. Changing it now requires an admin-approved "Account Type Change
Request" — never a self-service switch, never a bare API call. This traces back to a real bug:
picking "Service Provider" at signup with a phone number that already had a Rider account
silently dropped the choice and logged into the Rider account instead, with zero explanation;
`/login` had the opposite bug, force-signing the user out. Both are fixed — a mismatch now shows
"Continue as X / Contact Support to change account type."

New: `AccountTypeChangeRequest` model + full request/review workflow (`/account-type-request`
web page and mobile screen to submit; `/admin/account-type-requests` list + detail page to
approve/reject/request-more-info, with `AuditLog` + applicant notification on every decision).
Closed a real gap found while wiring this up: `PUT /api/partner/profile` was session-only, so any
Rider could bypass the whole request/approval system by calling it directly — now gated on
`accountType`. Also fixed a real regression caught during the work: `middleware.ts` briefly
imported from `@bikie/services`, pulling Node-only code into the Edge Middleware bundle — fixed
by inlining the check. Full details in DECISIONS.md ADR-053.

## 2026-08-11 — Background-processing audit: cron jobs now claim before they act (ADR-052)

Audited every `/api/cron/*` route, `vercel.json`, SOS escalation/dispatch/session logic, and
membership expiry. Event-driven SOS paths (create/dispatch/accept/decline/cancel) and
`acceptOffer`'s transactional accept were already correct. Found and fixed a real gap: the two
cron-driven paths queried candidate alerts, ran notifications, and only wrote the new state
afterward — two overlapping invocations (a slow tick outlasting its 1-minute schedule, a retry)
could both notify the same alert. Both now claim atomically before any side effect
(`claimAlertForEscalation`, `claimStaleAlertForResolve` in `sos.repository.ts`), mirroring the
pattern `acceptOffer` already used. The escalation claim self-heals within 2 minutes if a process
crashes mid-tick, so no alert can get permanently stuck (ADR-030). Added tests for both race
conditions and for the cron routes' bearer-secret auth (none existed before). No new
infrastructure — Rider/Partner membership expiry needs no cron at all, it's already evaluated
lazily at query time. See ADR-052.

Follow-up in the same audit: mapped the current `SOSStatus`/`SOSSessionStatus`/`SOSEscalationTier`
model against a proposed richer lifecycle diagram — found it already implements nearly all of it
(just denormalized differently), except one real gap: marking a session `COMPLETED` never
resolved the parent alert, so a successful rescue sat `ACTIVE` for up to 120 minutes until the
cron mislabeled it `"auto-resolve-timeout"` — indistinguishable from a genuinely-abandoned alert.
Fixed: `updateSessionStatus`'s `COMPLETED` branch now resolves the alert immediately and tags the
timeline event `reason: "session-completed"`, so the two outcomes are queryable apart. See
ADR-052 Decision 2.

## 2026-08-11 — Fix: Service Provider signup silently failed, landing new applicants on the Rider experience

`apps/web/app/partner-onboarding/page.tsx` (the form right after signup when `?role=partner` /
the `/welcome` PARTNER choice is active) builds its own `PUT /api/partner/profile` request body
by hand instead of reusing `PartnerBusinessFields`' full field set. It was never updated when
`businessMobile`/`businessEmail` became required fields on `partnerProfileSchema` — every
submission got a 400, the `Partner` row (and `User.partnerStatus`) never got created, and the
error was swallowed into an unhelpful `"[object Object]"` message (the fallback didn't guard
against `data.error` being the `flatten()` object, not a string). Net effect: signing up as a
Service Provider silently failed and the account was left indistinguishable from a plain Rider —
`resolveActiveMode` had nothing to key "PARTNER" mode off of, so every subsequent screen showed
the Rider experience.

Fixed by giving this page the same client-side `partnerProfileSchema.safeParse` +
`formatZodError` pattern `become-provider`/`PartnerSettingsForm` already use — it now submits the
exact validated field set (including `businessMobile`/`businessEmail`) and shows a real message
on failure instead of guessing. Mobile's `partner_onboarding_screen.dart` already had this
correctly wired in the same original commit, so this was web-only.

## 2026-08-11 — Fix: business contact fields build breakage; Vercel deploy unblocked

The last 2 pushes weren't showing up on Vercel because `next build` was failing for two
independent reasons:

- **TS error**: `businessMobile`/`businessEmail` were added to the Prisma schema and to the
  `become-provider`/`PartnerSettingsForm` pages, but never threaded through `PartnerProfileDTO`
  (`@bikie/types`), the partner-module write-input types (`ports/index.ts`, `partner.service.ts`),
  or `partner.repository.ts` (`toPartnerDTO`, `toUpsertData`). Fixed by adding the fields to all
  four layers.
- **Missing migration**: `businessMobile`/`businessEmail` had a schema change but no migration
  file — added `20260811120000_partner_business_contact`.
- **Un-applied migration**: the prior `20260811100000_partner_membership_model` migration had
  never been run against the database `next build` prerenders against, so the new
  `/api/partner-membership/plans` route (statically evaluated via `revalidate = 300`) failed with
  `P2021: table does not exist`. Applied both pending migrations to the live Neon DB (with
  explicit user go-ahead).
- Verified with a clean `tsc --noEmit` and a full local `next build` — no errors, all routes
  generate.

## 2026-08-10 — Master Spec gap-fill pass

Six gaps identified against the master product spec (§1–56), all implemented in one pass.

### Gap A — SOS cancel while dispatching (§28)
- **Backend**: `SosAlertRepositoryPort.cancelAlert` (marks `FALSE_ALARM`, expires outstanding offers), `SosOfferRepositoryPort.expireOpenOffersForAlert`, `cancelAlert` in both `sos.application.ts` and `SOSService`, validation in `sos.schema.ts`, `POST /api/sos/alerts/[id]/cancel` route with reporter/admin ownership check.
- **Web**: Cancel button + confirm dialog on `/dashboard/sos/[id]` (visible during `DISPATCHING` state); `SOS_CANCELLED` rendered in `SOSTimeline.tsx`.
- **Mobile**: `cancelAlert` added to `sos_repository.dart`; cancel button on `sos_detail_screen.dart`.
- **Tests**: Unit tests (cancel + offer expiry + timeline event + not-ACTIVE guard) + e2e scenario (full create→cancel→no-new-dispatch flow).

### Gap B — Discovery badges with verification status, rating, availability (§9/§12)
- **Backend**: `NearbyPartnerRow` expanded with `verificationStatus`/`verificationStatusLabel`/`ratingAvg`/`ratingCount`/`isAvailable`; `findNearby` no longer filters `isVerified: true` only (unverified providers now visible).
- **Web**: `NearbyPartnersPanel.tsx` — ✓ BIKIE VERIFIED badge, ⚠ Unverified badge, star rating (⭐ 4.8), 🟢/⚫ availability indicator.
- **Mobile**: `NearbyPartner` model + `partners_screen.dart` with matching badge/rating/availability UI.

### Gap C — Admin provider stats (§37)
- **Backend**: `getAdminProviderStats` in admin repository returns `total`/`active`/`unverified`/`pendingVerification`/`verified`/`rejected`/`suspended`; port/adapter/application/facade threaded through; `GET /api/admin/partners` returns stats alongside list.
- **Web**: 7 stat cards on `/admin/partners` above the table.

### Provider operations fields (§6)
- **Schema**: Migration `20260810100000_partner_operations_fields` — `workingHours` (TEXT), `serviceRadiusKm` (INT), `yearsOfExperience` (INT), all nullable.
- **Backend**: `partner.schema.ts` accepts new fields; `PartnerProfileDTO` expanded; repo threaded through `toPartnerDTO`/`writeInput`/upsert; domain port updated.
- **Web**: Fields added to `PartnerBusinessFields.tsx`; all 3 consumers (partner-onboarding, become-provider, settings) pick them up automatically.
- **Mobile**: `PartnerProfileSummary` model + `partner_onboarding_screen.dart` form fields.

### Provider service reviews (§5/§25)
- **Schema**: New `ProviderReview` model (one per SOS session, unique `sessionId`); migration `20260810110000_provider_reviews`.
- **Backend**: `addProviderReview` in partner repository (upsert + aggregate into `Partner.ratingAvg`/`ratingCount`); `ProviderReviewPort` wired into safety-location module; `SessionApplication.submitRating` auto-creates a review when the helper has a Partner profile; `GET /api/partner/reviews` returns `ProviderReviewDTO[]`.
- **Web**: `/partner/reviews` — review list with star rating + comment + date.
- **Mobile**: Rating fields on `PartnerProfileSummary`, reviews tile on `profile_screen.dart`.

### Audited admin chat read (§34)
- **Port**: `ModerationMessagePort.getMessagesRaw` (fetch encrypted messages, no decryption — privacy-preserving).
- **Adapter**: Wired to `messageRepository.findByConversationId`.
- **Application**: `ModerationApplication.getMessagesForAdmin` — requires a reason, logs to AuditLog (entity `"Conversation"`, stores admin ID + reason).
- **Route**: `GET /api/admin/moderation/conversations/[id]/messages` with required `reason` query param.
- **UI**: `/admin/moderation` — "View" action on each conversation opens a reason-required modal, then displays raw message list (encrypted content, sender, timestamp).

### Build health
- Prisma client regenerated successfully.
- Typechecks: `packages/services` (0 errors), `packages/types`, `packages/database`, `packages/validation`, `apps/web`.
- Tests: safety-location 66/66, administration 5/5, trust-safety 4/4 — all passing.