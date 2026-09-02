# BIKIE Changelog

## 2026-09-02 — Fix: store-review test number rejected as "does not exist" (ADR-072 follow-up)

Both login screens check `GET /api/auth-helpers/phone-exists` before the OTP step, so a bypass
number only works once the demo account carries it as `User.phoneNumber` — and the seed's ADR-072
block was never run against production, so the reviewer got "No account found for this number".
New scoped, idempotent `packages/database/prisma/patch-store-review-phones.ts` (npm script
`db:patch:store-review`) patches only `rider@bikie.app` / `partner@bikie.app`: `phoneNumber` +
verified from `TEST_RIDER_PHONE` / `TEST_SERVICE_PROVIDER_PHONE`, plus SP `accountType`/`role`,
APPROVED `Partner` profile and one ACTIVE `PartnerMembership`. Refuses to run if the two numbers
match or if a number is already on another account. `.env.example` clarified. No schema change.

## 2026-08-30 — Store-review sign-in, mobile "Delete Account", web email-login button (ADR-072)

The test Rider / Service Provider phone numbers + fixed `TEST_OTP` now sign in against the
production backend (for Google Play / App Store review), but only when those env vars are
explicitly set — a deploy that leaves them blank has no bypass. On web, an allowlisted number
(`NEXT_PUBLIC_TEST_*`) skips the MSG91 widget and verifies the typed code directly; on mobile it
works in release builds. The seeded `rider@bikie.app` / `partner@bikie.app` accounts are the
review credentials — now with a real phone number and, for the Service Provider, an active
membership. The mobile Profile screen gains a "Delete Account" button (signs out on this device
only, keeps data — a Play Store stopgap). The web "Log in with email instead" link is now a
button. No schema/migration change; `.env` untouched. Full details in ADR-072.

## 2026-08-30 — Phase scoping: WhatsApp hidden, Admin removed from the Flutter app (ADR-071)

WhatsApp is out of the current phase and hidden from every user-facing flow: the OTP
delivery-channel toggle on login/signup is gated off behind a single flag (SMS-only; control
renders nothing), and the SOS confirm dialogs, panic-alert channel lists, and partner Settings
copy no longer claim alerts go "via WhatsApp". The adapter, service, `wa.me` fallback, and every
`WHATSAPP_*` env var name are left intact and dormant (SOS dispatch already sent no WhatsApp
without credentials). The Flutter app is now Rider / Service Provider only. Mobile login is
phone + OTP only — the "Log in with email instead" fallback is hidden behind a flag (the
email/password sub-form and `AuthRepository.signIn` are left dormant for a one-line restore),
and the `role == 'ADMIN'` branch on the SOS detail screen is removed. Web Admin is untouched.
No schema, migration, env, or payment changes. Full details in ADR-071.

## 2026-08-30 — Membership billing: immutable invoices, receipts, payment history (ADR-070)

Membership purchases now produce a permanent receipt. Each activation writes one immutable
`MembershipInvoice` (Rider or Service Provider) holding a purchase-time snapshot — amount,
currency, plan name, duration, membership start/expiry, payer name and mobile — so a later admin
change to a plan's price or duration never rewrites history. New user-scoped endpoints:
`GET /api/billing/history`, `GET /api/billing/invoices/[id]`, and `…/receipt` (printable HTML,
no PDF library). Another user's invoice id returns 404, not 403. Web adds a Payment history table
on `/dashboard/membership` and `/partner/membership`; Flutter gets a read-only history + native
receipt view. Invoice creation is idempotent (a replayed payment returns the same membership and
the same single invoice); the Rider confirmation SMS fires after the invoice and records that it
was sent (failed send left un-stamped for retry; never rolls back the purchase). Free Service
Provider plan still activates with no payment and gets a ₹0 invoice. Migration
`20260830120000_membership_invoice` is generated, NOT applied. Deferred to Milestone 4: Razorpay
webhook / async reconciliation, refunds, mobile native checkout. Full details in ADR-070.

## 2026-08-30 — Membership payment: idempotency, one-active-membership guard, production dev-mode gate (ADR-069)

Follow-up to a read-only audit of the Razorpay membership flow. Three hardening fixes, no
Milestone-4 payments infrastructure: (1) a replayed Razorpay callback or a double-submitted
purchase can no longer mint a duplicate membership — `paymentId` and `razorpayOrderId` are now
unique in the database, and `purchaseMembership` returns the existing membership on replay
(without re-firing the confirmation SMS); (2) a user who already holds an active membership now
gets `409 ALREADY_ACTIVE_MEMBERSHIP` instead of stacking a second one (the Service Provider
free-tier "Activate" path is covered too); (3) when Razorpay keys are unset **and**
`NODE_ENV=production`, the checkout/purchase routes return `503 PAYMENTS_UNAVAILABLE` rather than
activating a membership from a client-supplied dummy `paymentId` — the simulated no-charge
checkout is now dev/preview only. A free Service Provider plan still activates with no payment in
any environment. Still deferred: Razorpay webhook, payments ledger, mobile native checkout,
renewal flow. Full details in ADR-069.

## 2026-08-21 — Fixed destination filter, reschedule validation/notification, leave-ride notification, added rate limiting (ADR-068)

The Discover page's destination filter had been silently matching zero rides since organizers
started typing a destination name freely instead of picking from the curated catalog — fixed to
match on the freeform name. Rescheduling now validates the new date range and notifies approved
members directly instead of relying on a chat message they might not see; shrinking seat capacity
below the already-approved count is now rejected instead of leaving the count inconsistent.
Leaving an approved spot now also notifies the organizer. Ride creation and join requests are now
rate-limited like every other write in the app. Full details in ADR-068.

## 2026-08-21 — Fixed 3 security gaps, added a nearby-providers map, implemented ride cancellation (ADR-065/066/067)

A full audit of Rider Community and Service Provider location found and fixed three real security
gaps: chat messages could be sent into any conversation without membership, a locked conversation
didn't actually stop accepting new messages, and a ride's exact meeting point and member list were
publicly visible before anyone had joined. Then built the requested Nearby Service Providers map
by extending the Leaflet/flutter_map + OpenStreetMap components that already existed — no Google
Maps, no paid subscription — with marker popups, an availability/membership filter, and a
"business location, not live GPS" disclaimer. Then implemented ride cancellation end to end: the
schema and dashboard UI already expected it, but nothing had ever wired it up. Full details in
ADR-065/066/067.

## 2026-08-21 — Full SOS dispatch audit: confirmed correct, closed a documentation/test gap (ADR-064)

Audited SOS dispatch end-to-end from code against the rule "every alert reaches both nearby
Riders and nearby Service Providers." Found the code already correctly narrows this to
Amber/Assistance alerts only — Red/Emergency stays riders-only, per an explicit earlier decision —
and kept that behavior unchanged. `.docs/SOS.md` and `API.md` previously described dispatch as
unconditional; rewrote both to state the split explicitly. Added test coverage for the one path
that lacked it (the partner browse-list's copy of the same severity gate). No dispatch,
eligibility, membership, availability, privacy, or notification code changed. Full details in
ADR-064.

## 2026-08-21 — Fixed back-press exiting the app from a deep-linked notification; added a rider "active SOS alert" Home banner (ADR-063)

Found live-testing yesterday's fix: tapping a push notification, then pressing back, closed the
app instead of returning to the previous screen — a cold-start deep link replaced the whole
navigation stack with just the tapped screen, leaving nothing to return to. Fixed by always
landing on Home first, then pushing the target screen on top; applies to every deep-linked entity,
not just notifications. Also added a "your SOS alert is active" banner to Home on both platforms —
a rider previously had no reliable way back to an alert they'd just sent. Full details in ADR-063.

## 2026-08-21 — A partner's own SOS offer had no visible home on Home, Requests, or Active (ADR-062)

Reported: an SOS request wasn't visible on the Service Provider's Home, Requests, or Active tabs.
Traced against live data to a real gap: once a partner accepts, their offer correctly drops off
"Nearby Requests" but doesn't appear in "Active Assistance" until the rider accepts it — leaving
no visible trace of it anywhere if the rider never responds. Added a "Pending Responses"/"Waiting
for Confirmation" list (new `GET /api/partner/sos/pending`) surfaced on Home, Requests, and Active
on mobile, and on the Overview and SOS Emergency pages on web — plus fixed the alert detail screen
incorrectly showing Accept/Decline again for an alert already offered on. Full details in ADR-062.

## 2026-08-21 — Fixed Service Providers getting the Rider-membership error on SOS request routes (ADR-061)

Reported: a Service Provider could see an SOS notification but clicking it said "This is a BIKIE
Membership perk, join a plan to continue," despite holding an active, separate Partner
Membership. Root cause: `GET /api/sos/alerts/[id]` and every other SOS route a helper touches
(offer, decline, withdraw offer, session view/status) were gated by `requireMembership()`, which
only checks Rider membership — a Service-Provider-only account failed it outright regardless of
its own Partner Membership status.

Added `evaluateSosAccess()`/`requireSosAccess()`, which reads whichever membership system matches
the caller's own account type (Rider vs. Service Provider) and returns the matching error message.
Swapped it in on every route a helper (Rider community-responder or Service Provider) can hit,
leaving reporter/admin-only and Rider-only routes unchanged. Mobile and web both call the same
backend routes, so this one fix covers both platforms; also added a missing "Subscribe" link to
web's partner SOS detail page for parity with mobile's existing one. Full details in ADR-061.

## 2026-08-21 — Found that no cron scheduler was actually running any of the 3 `/api/cron/*` routes in production; added one (ADR-060)

Asked whether cron errors could happen in the future — investigation found the real state was
already worse: `sos-escalate`, `sos-resolve`, and `rider-location-cleanup` are all fully
implemented and hardened (ADR-052) but **nothing has ever triggered them in production.**
`vercel.json`'s Hobby-plan cron cap, flagged as an open item in ADR-052, turned out to be moot —
this app deploys to a self-hosted VPS via `docker-compose`, not Vercel, and that Compose stack had
no cron mechanism at all. Every periodic SOS safety-net (radius widening, tier advancement,
stale-alert/location cleanup) has been silently not running since it shipped.

Added a `cron` service to `docker-compose.yml` (new `docker/cron/` image, Alpine + busybox
`crond`) scheduling all three routes at their documented frequencies, reusing the existing
`CRON_SECRET` and reaching `web` over the internal Compose network rather than the public domain.
Deliberately keeps the bearer secret out of the crontab file and out of `crond`'s own execution
log by routing each call through a small wrapper script that reads the secret from its own
environment at run time. Full details in ADR-060.

## 2026-08-20 — SOS dispatch moves to the DLT "BIKIE_SR" SMS template; found a real DLT-compliance bug; SMS capped to nearest 10 (ADR-059)

Requested: a third DLT template ("BIKIE_SR") for SOS SMS to nearby riders/Service Providers, capped
to 10 recipients. Tracing the actual SOS dispatch code (`fan-out.application.ts`) turned up a real,
pre-existing bug: **every SOS SMS — to nearby riders, providers, emergency contacts, and admins —
has likely been silently rejected by MSG91 since the feature shipped.** The SMS text has always
been `buildTextBody`'s free-text, multi-line body (maps links, GPS, distance), tagged with a fixed
DLT template ID — but India's TRAI content firewall requires an *exact* match to registered text,
which that dynamic body structurally can't provide. The failure was only ever caught into an
internal `errors` array, never surfaced anywhere.

The new "BIKIE_SR" template fixes this for the two roles it addresses (`NEARBY_RIDER`/
`SERVICE_PROVIDER` — "Hello Riders/Service Providers…"). Emergency contacts/admins stay on the
broken free-text path for now — no approved template exists for that copy, and reusing "BIKIE_SR"
for a role it doesn't name would be worse than the current silent failure.

**Real data gap found**: the template needs a Vehicle Registration Number, and nothing in BIKIE
captured one — not on `RiderProfile`, `SOSAlert`, or `Bike`. Added `vehicleRegistrationNumber` to
`RiderProfile` (optional, mirrors the existing `vehicleType`/`vehicleBrand`/`vehicleModel` fields
exactly — same onboarding/Settings forms, same "most riders leave it blank" posture), threaded
through to `SOSAlertDTO` and both platforms' SOS detail screens, not just the SMS. Falls back to
`"N/A"` in the SMS specifically (never blank, which risks the DLT filter rejecting the message
outright).

**SMS capped to the nearest 10** per dispatch batch (`markSmsEligibility`, sorts the combined
nearby-rider + provider pool by distance) — in-app push/WhatsApp/email are unaffected, since
under-notifying there has real safety cost and neither is billed per-message the way SMS is.

Verified: `tsc --noEmit` clean (database/types/validation/services/web), 213/213 backend tests
pass (7 new), `next build` succeeds. Mobile: `flutter analyze` (1 pre-existing, unrelated issue),
`flutter test` (112/112 pass). `build_runner` codegen for the new Dart model fields hit a real
toolchain bug on this machine (this Flutter SDK's Dart version is newer than the `analyzer`
package `build_runner` resolves, which crashes regenerating any `@freezed` file) — worked around
by hand-patching the two affected generated files at every site freezed/json_serializable would
have generated, verified clean by both `flutter analyze` and the IDE's live Dart diagnostics.
Full details in ADR-059.

## 2026-08-19 — Rider membership purchase sends the DLT-approved "BIKIE_Sub" SMS confirmation (ADR-058)

MSG91 has a second, already-approved DLT template beyond the SOS-alert one this codebase already
used: "BIKIE_Sub" (Sender ID `KSHIDL`), fixed text `Hello Rider ##alphanumeric##; Welcome to
BIKIE Community, You are successfully subscribed for BIKIE annual Membership, your membership
will be renewed on ##alphanumeric## as Noted by KSHIDL`. Wired it to fire once a **Rider**
membership purchase succeeds.

**Rider-only, deliberately**: the template's own copy says "annual Membership," which is only
true of the Rider plan (₹99/365 days) — the Service Provider plan is ₹99/*month* (ADR-056), so
this exact template would be factually wrong there, and India's DLT content-firewall rules mean
the fixed text can't be swapped per-purpose at send time anyway. Never wired into
`PartnerMembershipService`.

`SmsPort.send` gained an optional `templateId` parameter (every existing caller — SOS alerts — is
unaffected, since omitting it preserves the prior default-template behavior exactly). New
`SMSService.sendMembershipSubscribed` builds the exact template text and new
`MSG91_MEMBERSHIP_SUB_TEMPLATE_ID` env var supplies the DLT template ID.
`MembershipService.purchaseMembership` fires it fire-and-forget after the membership row is
created — mirrors this codebase's existing pattern (`AccountTypeRequestService.review`) for
"notification must never fail the underlying success," and is skipped entirely when the user has
no phone number on file.

Verified: `tsc --noEmit` clean (services/database/web), 206/206 tests pass (5 new — an explicit
`templateId` overriding the SMS adapter's default, the default still applying when omitted, and
three `MembershipService.purchaseMembership` cases), `next build` succeeds. Full details in
`.docs/DECISIONS.md` ADR-058.

## 2026-08-19 — SMS/WhatsApp OTP channel toggle; mobile release builds move to MSG91's Widget SDK (ADR-057)

Requested: an SMS/WhatsApp toggle on OTP screens, plus mobile adopting `sendotp_flutter_sdk`.
Inspected the existing ADR-034 MSG91 integration first — it already matched nearly the entire
spec (widget SDK on web with the real credentials already live, server-side re-verification,
one-account-per-number, mismatch screens, rate limiting, dev bypass). Two things needed
confirming against MSG91's actual docs rather than guessing, and both were then put to the user
before implementing, since this is a live production auth system:

**MSG91 has no channel parameter on the first OTP send** — only `retryOtp`/`retryOTP` takes one
(confirmed for both the JS widget and the Flutter SDK). So the toggle works as: fire the default
send, then immediately retry on WhatsApp if that's what was picked — the phone may get both an
SMS and a WhatsApp message once, and MSG91 bills for both. **MSG91's native server-to-server OTP
API** (what mobile used exclusively before) is the older product; WhatsApp delivery is documented
as a Widget-product feature, not confirmed for the native API. User chose: toggle applies from
the first send (accepting the double-delivery tradeoff), and mobile release builds adopt
`sendotp_flutter_sdk`.

**Implementation**: new `OtpChannel` (SMS/WhatsApp) mirrored on both platforms.
`apps/web/lib/use-msg91-widget.ts` gained channel-aware `sendOtp`/`retryOtp`, and its `retryOtp`
channel code was corrected from an unverified `"text"` placeholder to the confirmed `"SMS-11"`/
`"WHATSAPP-12"` codes. New `OtpChannelToggle` on both `/login` and `/signup`.

Mobile release builds get a new `Msg91OtpRepository` wrapping `sendotp_flutter_sdk` —
send/retry/verify client-side against MSG91 directly, mirroring the web widget's trust model
exactly (backend never sees the send leg, only re-verifies the final access token). **Zero
backend changes were needed for verify**: the existing shape-based discriminator in
`otp-verify.application.ts` (native numeric code vs. opaque widget token) already handled
whichever platform's token showed up. Mobile **debug builds** keep the old backend-proxied
native-API flow, gated on `kDebugMode` — required, not optional: MSG91's real widget would reject
the fixed `TEST_OTP`/`SHOW_OTP_TOAST` dev-bypass codes before our backend ever saw them, so that
tooling can only keep working through the path our own backend controls. WhatsApp is disabled in
the toggle UI on that path.

**Flagged, not silently worked around**: `sendotp_flutter_sdk` has only two published versions
and its docs show the call shape but not the response shape — `Msg91OtpRepository`'s response
parsing is defensive but still needs a live-device MSG91 round-trip test before shipping. The
corrected web retry channel codes need the same — nothing here is unit-testable, both legs talk
to MSG91 directly from the browser/app.

Verified: web `tsc --noEmit` clean, `next build` succeeds, all 201 backend tests still pass
(nothing server-side changed), all changed web files lint clean. On mobile, `flutter analyze`
found one pre-existing, unrelated issue (zero in anything this change touched) and `flutter test`
passed all 112 tests. `flutter build apk --debug` hit a pre-existing Java/Gradle toolchain
mismatch in this environment (Java 25 vs. this project's pinned Gradle 8.12) before compiling any
source file — unrelated to this change, not fixed here. Full details in `.docs/DECISIONS.md`
ADR-057.

## 2026-08-19 — Service Provider membership: Rs 99/month, optional at onboarding, enforced at SOS accept (ADR-056)

Made the existing Partner Membership system (plans/checkout/purchase — built under ADR-051) match
three product requirements it didn't yet meet: creating a Service Provider profile must never
require payment; operating as one (SOS, availability, fleet, bookings) must require an active
Rs 99/month membership; and a non-member exploring the dashboard must see what they're missing,
not a blank screen.

**Pricing** — the only plan live in production was a Rs 0, 100-year "grandfather" plan from
ADR-051's launch backfill, left active and therefore offered to every new signup as a permanent
free tier. Added a real Rs 99/`30 days` plan (`prisma/seed.ts`, idempotent) and deactivated the
legacy plan for new purchases (existing grandfathered memberships are untouched). **Not yet run
against production** — apply with:

```sql
-- Only if a plan by this name doesn't already exist:
INSERT INTO "partner_membership_plan" (id, name, description, price, "durationDays", benefits, "isActive", "sortOrder", "createdAt")
SELECT gen_random_uuid()::text, 'Service Provider Membership',
       'Everything you need to operate as a BIKIE Service Provider', 99, 30,
       ARRAY['Receive & accept SOS assistance requests','Go available to riders nearby',
             'List and manage your fleet','Accept bookings from riders',
             'Priority placement in rider search'],
       true, 0, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "partner_membership_plan" WHERE name = 'Service Provider Membership');

UPDATE "partner_membership_plan" SET "isActive" = false WHERE id = 'legacy-free-partner-plan';
```

**Onboarding** now routes `/partner-onboarding` → `/partner/membership?onboarding=1` (was
straight to `/partner`) with a new "Skip for Now" — always reaches the dashboard, never a gate.

**Non-subscriber dashboard** — new `PartnerActivationCard` (main `/partner` page) and
`MembershipRequiredNotice` (fleet/bookings/reviews/analytics/payouts/SOS) explain what's locked
and link to Subscribe, replacing silent zeroed stats. Found and fixed two real bugs along the
way: `/partner/fleet` crashed client-side for a non-member (`setBikes(undefined)` on a 403 body
with no `bikes` key); `/partner/sos` silently rendered "No open requests" / "not assisting
anyone" for a locked-out account instead of explaining why.

**SOS enforcement** — the actual authorization gap this ADR closes: neither SOS dispatch
(`findEligiblePartnersNearPoint`) nor the accept endpoint
(`POST /api/sos/alerts/[id]/offer`'s `offerHelp`) ever checked Partner membership, only
profile-not-suspended + available + type-matched. A non-member couldn't reach the nearby-requests
*page*, but a direct API call with a known alert ID would have gone through. Both now check
membership server-side; dispatch excludes non-members from fan-out entirely, offer returns a new
`403 MEMBERSHIP_REQUIRED`.

**Mobile** — audited `apps/mobile` for parity. Added the same "Skip for Now" and
activation-card/locked-availability treatment. Found and fixed a real bug: the onboarding
screen's post-save navigation (`context.go('/become-provider')`) redirected a brand-new provider
straight back to a blank onboarding form instead of forward — `BecomeProviderScreen`'s own logic,
written for a superseded pre-ADR-053 model, sends any SERVICE_PROVIDER-accountType account back
to `/partner-onboarding`. Now navigates to `/partner-membership` directly. Confirmed mobile
defaults to the production API (`https://bikie.app`) and has no hardcoded membership state.
`flutter analyze`/`flutter test` were **not run** — no Flutter SDK in this environment; changes
were verified by manual review only.

Verified: `tsc --noEmit` clean (8 packages), 201/201 tests pass (2 new), `next build` succeeds,
changed files lint clean. Full details in `.docs/DECISIONS.md` ADR-056.

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