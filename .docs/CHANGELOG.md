# BIKIE Changelog

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