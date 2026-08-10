# BIKIE Changelog

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