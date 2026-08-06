# BIKIE — Tasks

Status values: Backlog, Planned, In Progress, Blocked, Review, Completed.

## Membership payments: real Razorpay verification, dev-mode fallback preserved (2026-08-06, ADR-043)

| Task | Status |
|---|---|
| Found + fixed while here: `/membership` never fetched `GET /api/membership/active` — an already-active member saw "Get Started" on every plan again after any reload or repeat visit (`/dashboard/membership` was already correct; this page wasn't) | Completed |
| New `RazorpayService` (`packages/services`) — order creation + `timingSafeEqual` HMAC-SHA256 signature verification; `isConfigured()` gate | Completed |
| Schema: `UserMembership.razorpayOrderId` (additive migration, applied, zero drift) | Completed |
| Validation: `checkoutMembershipSchema`; `purchaseMembershipSchema` accepts either the legacy dummy-`paymentId` shape or the real Razorpay-callback shape, never a partial mix | Completed |
| New `POST /api/membership/checkout` (creates a server-priced order, or reports `razorpayConfigured: false`); `POST /api/membership/purchase` now requires + verifies the real signature once Razorpay is configured — a server-side gate, not a client choice | Completed |
| Web: `PaymentModal.tsx` — dev-mode renders the pre-existing simulated card form unchanged; real mode loads `checkout.razorpay.com` and opens Razorpay's own Checkout modal (new CSP script-src/connect-src/frame-src entries) | Completed |
| `.env.example`: `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` moved from "future, not consumed" to "active" with dev-mode-fallback behavior documented; `.docs/PROJECT.md` non-goal line corrected | Completed |
| Backend: 9/9 packages typecheck clean after `pnpm install` picked up the new `razorpay` dependency | Completed |
| **Mobile is not wired to real Razorpay** — needs the `razorpay_flutter` plugin (native Android/iOS config, out of scope this pass); `membership_screen.dart`'s simulated flow will start failing with a clear `PAYMENT_VERIFICATION_REQUIRED` error the moment live keys are configured server-side | **Not done** — explicit follow-up, documented in ADR-043 so it isn't a surprise later |
| Live end-to-end test against a real Razorpay account (order creation, Checkout modal, signature verification) | **Not done** — no Razorpay credentials exist in this environment; only the dev-mode path and code review are verified |

## SOS "browse active alerts": GPS radius replaces same-city text matching (2026-08-06, ADR-042)

| Task | Status |
|---|---|
| Same-turn fix (trim + case-insensitive `city` match) landed first, then reconsidered as a patch over the deeper problem — this replaces it, not layers on top | Completed |
| New shared `packages/database/src/lib/geo.ts` (`haversineDistanceMeters`), extracted from `partner.repository.ts`'s local copy now that it's a genuine second use | Completed |
| `sos.repository.ts`: `getActiveAlerts` takes `{latitude, longitude, radiusMeters}` instead of `city`; `undefined` (ADMIN only) still returns every active alert, unfiltered | Completed |
| Ports/application/facade threaded through (`SosLocationFilter` type, `packages/services`) | Completed |
| Validation: `sosActiveAlertsQuerySchema` (`lat`/`lng`); `sosAlertCreateSchema.city` now server-side-trimmed too (stored value, not just the query side) | Completed |
| `GET /api/sos/alerts` — `?lat=&lng=` replaces `?city=`; `400 LOCATION_REQUIRED` replaces `CITY_REQUIRED` | Completed |
| Web: `/dashboard/sos` "Active Alerts" tab — city text input replaced with a "Share my location" button (`navigator.geolocation`) | Completed |
| Mobile: app-bar "Set city" dialog replaced with "Share my location" (same `Geolocator` flow `SendSosSheet` already uses to send); `sosActiveAlertsCityProvider` → `sosActiveAlertsLocationProvider` | Completed |
| Backend: 9/9 packages typecheck clean, 123/123 vitest passing. Mobile: `flutter analyze` 0 issues, all tests passing (2 new) | Completed |
| Live end-to-end test with two real devices/accounts | **Not done** — not verified in this environment; worth the user's own smoke test given this is a safety-critical path |

## Fixed production build failure — Leaflet loaded eagerly, crashed `/login` prerender (2026-08-06, ADR-041)

| Task | Status |
|---|---|
| Root cause: `import L from "leaflet"` at module scope in `LocationPicker.tsx`/`PartnersMap.tsx` executes during Next's SSR prerender pass, even for `"use client"` files | Confirmed via local `pnpm --filter web build` reproducing the exact Vercel failure |
| Fix: `leaflet` runtime import moved to a dynamic `import()` inside each component's mount `useEffect`; module-level type import kept type-only (`import type * as LeafletTypes`) | Completed |
| Verified: local production build (`pnpm --filter web build`) now completes cleanly, `/login` prerenders static; `pnpm typecheck` (9/9) and `pnpm test` (123/123) still clean | Completed |

## Removed the web light-theme toggle (2026-08-06, ADR-040)

| Task | Status |
|---|---|
| `ThemeToggle.tsx` deleted; both `Navbar.tsx` call sites removed | Completed |
| `ThemeProvider` in `app/layout.tsx`: `defaultTheme="dark"` → `forcedTheme="dark"` | Completed |
| `pnpm typecheck` (9/9) and `pnpm test` (123/123) re-run clean | Completed |

## Remove remaining demo content; real (multi-)image upload; partner bike-listing fix (2026-08-06, ADR-039)

| Task | Status |
|---|---|
| Live data: deleted all 6 seed trips, 6 destinations, 9 categories, 6 testimonials | Completed |
| `seed.ts`: removed the corresponding arrays/loops — all four are admin/user-created now | Completed |
| **Fixed pre-existing bug**: Partner Fleet "Add Bike" posted to the ADMIN-only `/api/admin/bikes` — 403'd for every real partner | Completed — new `POST/DELETE /api/partner/bikes(/[id])`, ownership-checked, reuses `AdminService.createBike/deleteBike` |
| Testimonial admin form: added the avatar upload button it never had (`authorAvatarUrl` was already reachable server-side) | Completed |
| Partner Fleet "Add Bike": Image URL text field replaced with real upload | Completed |
| `Bike.gallery`/`Trip.gallery` (existed, unreachable from any client) wired through validation/port/application/repository layers | Completed |
| Multi-image upload UI: Partner Fleet (web, `<input multiple>`), ride creation (web + mobile `pickMultiImage`) — capped at 8 images | Completed |
| `pnpm openapi:generate` re-run for the 2 new routes (119 → 120) | Completed |
| Backend: 9/9 packages typecheck clean, 123/123 vitest passing. Mobile: `flutter analyze` 0 issues, 94/94 tests passing (2 new) | Completed |
| Admin CRUD for Category/Destination | **Not built** — confirmed no admin UI or API route has ever existed for either; deferred per explicit user decision ("if required we will create that") |

## SOS reverse-geocoded address (2026-08-06, ADR-038)

| Task | Status |
|---|---|
| `SOSAlert` gains `placeName`/`area`/`formattedAddress` (additive, nullable) | Completed — migration `20260806100000_sos_reverse_geocoded_address` written, not yet applied to the live DB |
| `ReverseGeocodingPort` + Nominatim adapter (free, no API key, Redis-cached, 4s bounded timeout, catch-and-null on failure) | Completed |
| Wired into `SOSService.createAlert` — resolved once, stored on the alert, read by every downstream caller | Completed |
| `describeLocation()`/`describeSosLocation()` fallback chain (formattedAddress → placeName/area/city → city), used by SMS/WhatsApp/email text, nearby-rider in-app/push text, and both platforms' alert screens | Completed |
| Web: alert list + detail pages show the address, "view on map" kept as a separate link | Completed |
| Mobile: `SOSAlert` model + alert list/detail screens updated to match | Completed |
| Backend: 9/9 packages typecheck clean, 123/123 vitest passing (7 new). Mobile: `flutter analyze` 0 issues, 94/94 tests passing (4 new) | Completed |
| Apply the pending migration to the live DB | **Not done** — needs explicit user go-ahead, not run automatically against shared state |

## Ride creation: free-text destination, meeting-point map pin, mobile cover upload (2026-08-06, ADR-037)

| Task | Status |
|---|---|
| Schema: `Trip.destinationName String?` (hand-written migration, additive-only) | Completed |
| Validation: `createTripSchema`/`updateTripSchema` gain `destinationName`, `meetingLat`/`meetingLng` (paired via `.superRefine`) | Completed |
| Types/repo/ports/application: `TripSummaryDTO.destinationName`, `TripDetailDTO.meetingLat`/`meetingLng` threaded through `createTrip`/`updateTrip`/`toSummary`/`findBySlug` | Completed |
| Web: `/trips/create` and `/trips/[slug]/edit` — destination dropdown replaced with free text; `LocationPicker` (reused from ADR-036) added for the meeting point pin; cover image upload confirmed already Cloudinary-backed (`/api/upload`) | Completed |
| Web: trip detail page + `TripCard`/`UpcomingRides`/dashboard calendar now prefer `destinationName`; detail page renders `PartnersMap` for the meeting-point pin when set | Completed |
| Bug found + fixed: the edit form's destination prefill read `t.destination.id`, which `GET /api/trips/[slug]` never actually returns — the dropdown could never preselect the existing destination even before this change | Completed |
| Mobile: `create_ride_screen.dart` — destination dropdown replaced with free text; `LocationPickerField` (reused from ADR-036) for the meeting point; real Cloudinary cover-image upload via `image_picker` + new `TripRepository.uploadCoverImage` (mirrors `RiderProfileRepository.uploadPhoto`), replacing the old raw "image URL" text field | Completed |
| Mobile: trip detail screen shows `destinationName` and a read-only `flutter_map` pin for the meeting point | Completed |
| `prisma migrate deploy` + `migrate status` (zero drift), `pnpm turbo run typecheck` (database/validation/types/services/web), `pnpm exec vitest run` (116/116), `flutter analyze` + `flutter test` | Completed |
| Live-test the create/edit forms and meeting-point map end-to-end in a real browser/device session | **Not done** — not visually confirmed in this environment |

## Partner shop location + typed government ID + maps (2026-08-05, ADR-036)

First embedded map anywhere in the app (web + mobile), using Leaflet/`flutter_map` + raw
OpenStreetMap tiles — no API key, no billing account, no native Android/iOS config (an initial
Google Maps JS SDK/`google_maps_flutter` pass was swapped out before shipping once it turned out
no Google Maps key was available). Code-complete on both platforms, no external account setup
needed at all.

| Task | Status |
|---|---|
| Schema: `Partner` gains `addressLine`/`area`/`pincode`/`latitude`/`longitude`/`governmentIdType`/`governmentIdNumber`; `aadhaarNumber` dropped with a backfill migration | Completed |
| Validation/types/service-module updates across `partner.schema.ts`, `PartnerProfileDTO`, `partners` module | Completed |
| Bug found + fixed: `PartnerDispatchPort.findByCity` silently dropped its `type`/`verifiedOnly` options — "Share Mechanic"/"Share Fuel Contact" and the SERVICE_PROVIDERS escalation tier were returning every partner type, not the one requested | Completed |
| New public `GET /api/partners/nearby` (Haversine, no PostGIS, IP rate-limited, no auth) | Completed |
| Web: `LocationPicker.tsx`/`PartnersMap.tsx` (Leaflet + OpenStreetMap tiles, npm-bundled, no API key), wired into `PartnerBusinessFields.tsx`, partner-onboarding, and the SOS session partner-share flow | Completed |
| Web: `/partner/settings` rebuilt from a read-only "coming soon" stub into a real editable form | Completed |
| Web: "Service providers near you" map section added to `/roadside-assistance` | Completed |
| Mobile: `flutter_map`/`latlong2` added (no native key config needed); `LocationPickerField` (tap-to-place, no drag — `flutter_map` has no built-in draggable-marker gesture) wired into partner onboarding; new `/partners` "Find a service provider" screen + map on the SOS partner-share flow | Completed |
| Backend + mobile tests, `pnpm turbo run typecheck`, `flutter analyze` | Completed |
| Live-test actual map rendering (tile loading, marker placement) on web + Android + iOS | **Not done** — not visually confirmed in this environment (no browser/device session); no credential/billing blocker unlike the original Google Maps plan, just needs a real run |

## Mobile registration parity + rider-profile completion reminder (2026-08-05)

Follow-up to the SOS redesign's rider-profile work: mobile signup wasn't reaching the existing
onboarding forms at all, and nobody was ever reminded to finish a skipped profile.

| Task | Status |
|---|---|
| Mobile signup now routes new riders to `/onboarding` and new partners to `/partner-onboarding` by role, instead of always going straight to Home | Completed |
| Rider onboarding (web + mobile) gained full name + photo collection (`POST /api/auth/update-user`, `POST /api/upload`) — previously only mobile's screen was missing these | Completed |
| New `/partner-onboarding` built for mobile from scratch (didn't exist at all) — business name/type/city/Aadhaar/contact persons, no skip, same `PUT /api/partner/profile` web uses | Completed |
| "Rider Details" tile added to mobile Profile so the (previously orphaned) `/onboarding` route is reachable after signup too | Completed |
| `RiderProfileService.needsCompletionReminder` (skipped + still substantively empty) exposed as `showCompletionReminder` on `GET /api/rider-profile`; dismissible banner on Home (web + mobile) reading it, dismissal not persisted so it reappears next visit | Completed |
| `flutter analyze`: 0 issues. Backend + mobile tests passing | Completed |

## Android push notifications (FCM) (2026-08-05, ADR-035)

Backend: code-complete, migration written but not applied. Mobile: code-complete, needs a real
`google-services.json` + an on-device test to go live. iOS explicitly out of scope.

| Task | Status |
|---|---|
| `PushSubscription` schema: `platform`/`deviceId`/`deviceName`/`appVersion`/`notificationsEnabled` (additive), new `PushPlatform` enum | Completed — migration `20260805100000_push_device_metadata` written, `prisma generate` run, **not yet applied to the live DB** |
| `push-token` route + `PushPort`/adapter/service widened for device metadata (same route, not duplicated) | Completed |
| Android `channelId`/`priority` targeting on FCM send (`channelIdForNotificationType`) | Completed |
| Fixed: SOS resolve/auto-resolve never notified anyone | Completed |
| Fixed: chat `sendMessage` never notified anyone (`NEW_MESSAGE`, new `"conversation"` entity) | Completed |
| Fixed: Trip notifications stored id instead of slug as `entityId` (404 on tap, both platforms, pre-existing) | Completed |
| Flutter: `firebase_core`/`firebase_messaging`/`flutter_local_notifications`/`device_info_plus`/`package_info_plus`, `lib/core/push/*` (bootstrap, channels, deep-link resolver, token repository, registration service) | Completed |
| Flutter: wired into `AuthController` (register on login/signup/OTP/bootstrap, unregister on logout) and `main.dart` (tap → route, never Home first) | Completed |
| Flutter: in-app `/notifications` list rewired onto the same `NotificationDeepLinkResolver` (was Trip-only inline logic) | Completed |
| Android Gradle: `google-services` plugin applied conditionally on `google-services.json` existing, so the app keeps building without it | Completed |
| `flutter analyze`: 0 issues. `flutter test`: 75/75. Backend: 9/9 packages typecheck clean, 116/116 vitest passing | Completed |
| Apply the pending migration to the live DB | **Not done** — needs explicit user go-ahead, not run automatically against shared state |
| Register the Android app in Firebase console, add real `android/app/google-services.json` | **Not done** — account-side step, not code |
| Real on-device foreground/background/terminated verification | **Not done** — needs the two steps above first |
| Custom monochrome small notification icon (falls back to the launcher icon today) | Backlog — cosmetic |
| iOS push | Backlog — explicitly out of scope for this pass |

## MSG91 becomes OTP system of record, superseding ADR-032 (2026-08-05, ADR-034)

Code-complete. Live SMS delivery is blocked on account-side MSG91 setup only user can do (see
"Not done" row).

| Task | Status |
|---|---|
| `verifyOTP` hook wired into Better Auth (`packages/auth/src/server.ts`), `sendOTP` neutralized to a trip-wire | Completed |
| `identity-access` module: `Msg91NativeOtpPort`/`Msg91WidgetVerifyPort` + adapters, `otpEcho.recall`, `otp-send`/`otp-verify` applications, dev-bypass (mobile-only) | Completed |
| Deleted dead `otp.application.ts`/`domain/otp-message.ts` (zero remaining callers) | Completed |
| `POST /api/auth/phone-number/send-otp` now returns 410; rate-limit logic moved to new `POST /api/otp/mobile/send` | Completed |
| Web: MSG91 Widget SDK (`use-msg91-widget.ts`, `exposeMethods: true`) wired into login/signup, dev-OTP-toast removed (no longer reachable) | Completed |
| Mobile: `auth_repository.dart`'s `sendOtp` retargeted to `/api/otp/mobile/send`; `verifyOtp` unchanged | Completed |
| CSP updated for MSG91 widget domains (`apps/web/next.config.ts`) | Completed |
| Env vars added: `MSG91_OTP_TEMPLATE_ID`, `NEXT_PUBLIC_MSG91_WIDGET_ID`, `NEXT_PUBLIC_MSG91_WIDGET_TOKEN_AUTH` | Completed |
| Tests: `identity-access.test.ts` send/verify discrimination + dev-bypass, new `msg91-otp-adapters.test.ts` | Completed |
| ADR-034 (supersedes ADR-032), API.md, PRODUCTION_INTEGRATIONS.md, CHANGELOG.md updated | Completed |
| Live send+verify round-trip on both widget (web) and native API (mobile), confirming `verifyAccessToken`'s real response shape and the widget's actual CSP network origins | **Not done** — blocked on the user funding the MSG91 wallet (balance confirmed 0) and registering `MSG91_OTP_TEMPLATE_ID` in the MSG91 dashboard; both are account-side tasks, not code |

## SOS → Community Emergency Response System (2026-08-04/05, ADR-033)

Full redesign, phased. All four phases (A–D) are complete.

| Task | Status |
|---|---|
| **Phase A — backend core** | |
| Resolve-route ownership security fix (`requireMembership` + reporter/helper/admin check) | Completed |
| Schema: severity/assignedHelperId/escalationTier/radius/nextEscalationAt on `SOSAlert`; `SOSResponseStatus` enum on `SOSAlertResponse` (hand-migrated backfill); new `SOSSession`/`SOSTimelineEvent` models; new alert types | Completed |
| Transactional helper-accept (`sos-session.repository.ts`, `WHERE assignedHelperId IS NULL` guard) | Completed |
| Staged escalation engine (`escalation.application.ts`) + `GET /api/cron/sos-escalate` ticker | Completed |
| Dispatch orchestrator merging contacts leg + tier-1 riders, preserving ADR-030's zero-recipient admin escalation | Completed |
| Helper offer/accept/reject/withdraw routes + session status/rating routes | Completed |
| `Partner.type`/`isVerified`-aware SERVICE_PROVIDERS tier (`GET /api/sos/partners` for Share Mechanic/Fuel) | Completed |
| `CommunityMembershipPort` (fully implemented, not yet wired into tier selection) | Completed |
| Application-layer test coverage (offer/accept/reject, tier advancement, resolve ownership) | Completed |
| OpenAPI inventory regenerated (117 routes) | Completed |
| **Phase B — web UI rebuild** | Completed |
| Regroup panic categories into 🔴 Emergency / 🟠 Assistance with new types | Completed |
| Backend gap found + fixed mid-phase: `acceptOffer` never created the `Conversation` a session needs for chat; `createOffer` had no handling for the `[alertId,responderId]` unique constraint (would 500 on a duplicate offer) | Completed |
| New session detail page (`/dashboard/sos/[id]`): offers list, accept/reject, I'm Coming/Cannot Help/Share Mechanic/Share Fuel/Call/Navigate | Completed |
| Session chat (`SOSSessionChat.tsx` — thin wrapper on the existing Community Platform `ChatArea`, not a new component) | Completed |
| Timeline stepper component (`SOSTimeline.tsx`) | Completed |
| Active Alerts tab + admin feed: severity/tier/assigned-helper badges, link into session detail | Completed |
| Full-browser authenticated click-through (offer → accept → chat → status → rating) | **Not done** — typecheck/build/compile verified, but real interactive testing needs a browser session, not curl |
| **Phase C — Flutter parity** | Completed |
| Fixed pre-existing bug: `sos_repository.dart`'s `getActive()` called without required `city` param | Completed |
| Second pre-existing bug found + fixed: `getHistory()` force-parsed the history response as a full `SOSAlert` (missing required fields) — new `SOSHistoryEntry` model matches the actual response shape | Completed |
| Mirrored offer/session/timeline DTOs + repository calls (same API routes, no duplicate endpoints) | Completed |
| Session screen (`sos_detail_screen.dart`), helper-offer card, timeline view — chat reuses the existing `ConversationThreadBody` directly, no new chat code | Completed |
| `send_sos_sheet.dart` regrouped into 🔴 Emergency / 🟠 Assistance matching web | Completed |
| Nearby-riders mobile feature (`features/nearby_riders/`) — didn't exist at all before; sharing toggle, radius chips, live list | Completed |
| `flutter analyze`: 0 issues. `flutter test`: 73/73 passing | Completed |
| **Phase D — reputation (minimal) + community prioritization** | Completed |
| `User.emergencyResponseCount`/`helperRatingAvg`/`helperRatingCount` + small `modules/reputation` (hand-migrated, applied to Neon) | Completed |
| Wired `CommunityMembershipPort` into `escalation.seedEscalation`/`tickEscalation`: shared-Group nearby riders get a `NEARBY_RIDERS_COMMUNITY` tier with a shorter timeout before falling through to the full `NEARBY_RIDERS_GENERAL` pool (de-duped, no double-texting) | Completed |
| `reputation.recordAssist`/`recordRating` wired into session COMPLETED transition + rating submission | Completed |
| Badges / trusted-rider tier — still explicitly out of scope, needs a dedicated design pass | Backlog |
| **Repo-wide final state** | 9/9 packages typecheck clean, 102/102 vitest passing, 73/73 flutter tests passing, `flutter analyze` clean |

## SMS provider swap + phone-OTP hardening (2026-08-03, ADR-031/ADR-032)

Twilio → MSG91 for SMS delivery, then production-hardened the phone-OTP flow (Better Auth stays
the OTP system of record — see ADR-032 for why MSG91's own OTP API was deliberately not used).

| Task | Status |
|---|---|
| `sms.adapter.ts` rewritten against MSG91 v2 `sendsms`; `MSG91_*` env vars replace `TWILIO_*` for SMS | Completed |
| Live credential + delivery verification against MSG91's API (auth key, sender ID, IP-whitelist gotcha found and resolved) | Completed |
| Firebase push client config switched to `bikie-b9459` project (unrelated side request, same session) | Completed |
| `isValidIndianMobile` validator wired into Better Auth's `phoneNumberValidator` | Completed |
| `allowedAttempts` 3→5 for wrong-code verification | Completed |
| Rate-limit gate in `apps/web/app/api/auth/[...all]/route.ts`: 60s resend cooldown, 3/10min per-phone send cap, 10/10min per-IP send cap, 20/10min per-IP verify cap | Completed |
| OTP send/verify logging (phone + IP + outcome, never the code) | Completed |
| Resend countdown UI (`use-resend-countdown.ts`) on `/login` + `/signup` | Completed |
| DLT template registration for OTP/SOS message text — still needed for guaranteed real-world delivery, not yet done by the user | Blocked |

## Modular Monolith Migration (2026-08-01, ADR-021)

Audit-first Strangler migration toward module ports/adapters without breaking `/api/*`.
Plan: `project doc/MODULAR_MONOLITH_IMPLEMENTATION_PLAN.md`. Agents: `.cursor/agents/*`.
Audits: architecture / security-API / database-NFR (completed 2026-08-01).

| Task | Status |
|---|---|
| Cursor agents / rules / skills / implementation-plan prompt | Completed |
| Full architecture audit + implementation plan document | Completed |
| Vitest runner + root `pnpm test` scripts | Completed |
| Communications ports/adapters + compatibility facades | Completed |
| SOS dispatch: inject ports; partner lookup via repository | Completed |
| Characterization tests (maps/phone/DEV adapters) | Completed |
| P0: accountStatus on all auth gates; `role` input:false | Completed |
| P0: lock down `/api/dev/otp` + opt-in `SHOW_OTP_TOAST` | Completed |
| P0: remove Prisma from phone/presence/SOS/export + AuditService | Completed |
| Safety-location module extraction (SOS/location/Places + facades) | Completed |
| Characterization tests (alert kind, fan-out accounting, rider-location) | Completed |
| Identity-access policy centralization (SmsPort for auth) | Completed |
| Permission-based access gate (`requirePermission`, derived from role) | Completed — not yet wired into routes |
| Catalog / destinations / categories / testimonials module | Completed |
| Rentals-bookings module (pricing + review eligibility + wishlist) | Completed |
| Partners module (profile + dashboard) | Completed |
| P1 indexes: booking overlap, Partner.city, Bike.city/ownerId, TripParticipant.userId | Completed — apply migration `20260802000000_phase5_query_indexes` |
| P0: ride approval atomic transaction (seat + approve + conversation) | Completed |
| Rides-community module (trip + ride-room) | Completed |
| Messaging module (crypto/realtime ports + MessageService facade) | Completed |
| Administration module (Admin CRUD + bounded CSV export) | Completed |
| Trust-safety module (reports + moderation + audit) | Completed |
| P1: unbounded admin export size | Completed — capped at 10k rows |
| Platform module (retry + idempotency + sync job queue) | Completed |
| SOS fan-out idempotency (`sos-dispatch:{alertId}`) | Completed |
| Bound message history (newest 200 / max 500) | Completed |
| P1: mandate Upstash in prod for rate limits | Superseded by ADR-029 — degrades to in-memory instead of denying |
| P0: SOS blocked by fail-closed rate limiter (Docker) | Completed — ADR-029 |
| Channel selection by configured provider + recipient contact | Completed — `isConfigured()` on channel ports |
| NFR baseline scaffold (domain hot paths) | Completed — full load suite still backlog |
| OpenAPI v1 snapshot + route inventory + `GET /api/openapi` | Completed |
| API contract CI (inventory ↔ filesystem ↔ OpenAPI) | Completed |
| Deprecation / request-id contract helpers | Completed |
| Auth matrix + facade removal registry | Completed — no facade deletes yet |
| P0/doc: Google login UI missing vs ADR-017 claims | Planned |
| P1: Zod gaps on admin/mutation routes (~15) | Planned |
| Wire `requirePermission` into admin/partner routes (per-route review) | Planned |
| `/api/v2` for approved breaking changes | Backlog — none approved |
| Remove compatibility facades after zero-use proof | Backlog |
| Load/NFR baseline suite (staging dataset + p95 budgets) | Backlog |
| Async outbox / worker adapters (only if baselines demand) | Backlog |
| Enrich OpenAPI schemas beyond path/method stubs | Backlog |

## SOS Dispatch Fan-out (2026-08-01)

Red/Amber panic alerts now fan out SMS + WhatsApp + email (+ in-app) with GPS to nearby
riders, same-city partners, and emergency contacts. Credentials stay env-only until go-live.

| Task | Status |
|---|---|
| `SOSDispatchService` + `WhatsAppService` (DEV console fallback) | Completed |
| `findNearbyAroundPoint` PostGIS helper for alert GPS | Completed |
| Wire fan-out into `POST /api/sos/alerts`; response includes `dispatch` summary | Completed |
| Seed: membership, emergency contacts, nearby riders GPS, Bangalore partner phones | Completed |
| Docs in `project doc/` (plan + E2E testing); `.env.example` WhatsApp/Resend/SOS vars | Completed |
| WhatsApp-style map links (Maps pin + directions deep link) in every channel + in-app "Open in Maps" CTA | Completed |
| Direct email over SMTP (`nodemailer`), Resend demoted to fallback (ADR-020) | Completed |
| Direct WhatsApp over Meta Cloud API + native location card; Twilio demoted to fallback (ADR-020) | Completed |
| `wa.me` click-to-send fallback (`whatsappClickToSend`) when no WhatsApp credentials | Completed |
| Per-channel delivery results (`smsSent`/`whatsappSent`/`emailSent` + `errors`) in the dispatch summary | Completed |
| Verified live: `sms=7/7` real Twilio sends to seeded riders/partners/contacts | Completed |
| Fill `SMTP_USER`/`SMTP_PASS` + `WHATSAPP_ACCESS_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID` in `apps/.env` | Blocked — needs credentials from the account owner |
| P0: success screen reported a fixed "sent via SMS/WhatsApp/email" sentence even with 0 recipients and 0 configured providers | Completed — ADR-030, UI now renders the real `SOSDispatchSummary` |
| Optional `email` on `RiderEmergencyContact` (nullable column + onboarding/settings field) so contacts are email-reachable | Completed — ADR-030, migration applied live |
| Zero-recipient dispatch escalates to `ADMIN` users via `EscalationPort` + `[SOS][DISPATCH][NO-RECIPIENTS]` log | Completed — ADR-030 |
| Reporter always gets an in-app confirmation (responder count, or "no responders could be reached") | Completed — ADR-030 |
| `getProfileWarning` flags missing emergency contacts, not just a missing phone | Completed — ADR-030 |
| Seed nearby riders with location sharing + a GPS fix near test coordinates so `nearby > 0` in staging | Open — recipient coverage, not a code gap |
| Fill `UPSTASH_REDIS_REST_URL`/`TOKEN` (realtime in-app push is a no-op without them) and `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`/`NEXT_PUBLIC_FIREBASE_VAPID_KEY` (browser push) | Blocked — needs credentials from the account owner |
| Set `SOS_EMERGENCY_SERVICES_PHONE`/`_EMAIL` as a guaranteed catch-all recipient | Open — currently empty, so no fallback recipient exists |

## "Continue with Google" Sign-In (2026-07-17, ADR-017)

Google OAuth via Better Auth's `socialProviders` — not Firebase Authentication. Also finished
wiring the client-side Firebase config left blank in ADR-016.

| Task | Status |
|---|---|
| `packages/auth/src/server.ts`: added `socialProviders.google` (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`); no schema migration needed — `Account`/`User` already support OAuth providers | Completed |
| "Continue with Google" button on both `/login` and `/signup`, calling `authClient.signIn.social({ provider: "google" })`, hidden during OTP-entry/partner-upgrade sub-steps | Completed |
| `.env.example`: added `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (no dev-safe fallback for this one — unset means the provider just doesn't register) | Completed |
| Filled in `apps/web/.env.local`'s previously-blank `NEXT_PUBLIC_FIREBASE_*` client vars from the user's Firebase web app config (`apiKey`/`projectId`/`messagingSenderId`/`appId`) — push *sending* still needs a separate service account key the user hasn't generated, so `[Push][DEV]` fallback is still active | Completed |
| New Google sign-ups always land as `RENTER`; Partner is available afterward via the existing self-service upgrade — the `/welcome` Rider/Partner choice isn't threaded through the OAuth redirect | Completed |

## Nearby Riders, Nearby Help, Push Notifications (2026-07-17, ADR-016)

Un-defers ADR-011's Live Location extension point; adds Google Places-backed nearby help on the
SOS page; wires Firebase push into every existing notification type.

| Task | Status |
|---|---|
| New `RiderLocation` model (PostGIS `geography(Point,4326)`, hand-edited migration enabling the `postgis` extension + a GiST index — both invisible to `schema.prisma`'s diff engine) + `sharingEnabled` opt-in flag, default off | Completed |
| `rider-location.repository.ts`/`rider-location.service.ts` — consent toggle, GPS-fix upsert (rejects if sharing is off), and a self-joining nearby-radius query (uses the caller's own fix as the search center, so "must be sharing to search" falls out of the query itself) | Completed |
| Routes: `PUT/GET /api/rider-location/consent`, `PUT /api/rider-location`, `GET /api/riders/nearby?radiusKm=` — all `requireMembership()`-gated | Completed |
| New `/dashboard/nearby` page + a "Share my live location" toggle in Settings (`RiderLocationToggle.tsx`, pushes a fix every ~45s via `getCurrentPosition` while enabled) | Completed |
| New cron `GET /api/cron/rider-location-cleanup` — flips `sharingEnabled` off after 30 minutes of no fix, same `Bearer CRON_SECRET` pattern as the existing `cron/sos-resolve` | Completed |
| `PlacesService` (Google Places API (New) `searchNearby`, server-only key, Redis-cached ~1.1km grid cell/10min, rate-limited) + `GET /api/places/nearby` + a "Nearby Help" third tab on `/dashboard/sos` (`NearbyHelpPanel.tsx`) listing petrol pumps/mechanics/hospitals with a no-API-key-needed Google Maps directions link | Completed |
| `PushSubscription` model + `PushService` (`firebase-admin`, `sendEachForMulticast`, dead-token cleanup on `messaging/registration-token-not-registered`) wired into `NotificationService.notify()` — covers every existing notification type (bookings, trip requests, chat, moderation, SOS) through that one choke point | Completed |
| Client push wiring: `public/firebase-messaging-sw.js` (fetches its config from a new `GET /api/firebase-config` since static files can't read `NEXT_PUBLIC_*` vars), `lib/push-notifications.ts`, `PUT/DELETE /api/notifications/push-token`, and a Settings toggle (`PushNotificationToggle.tsx`) | Completed |
| `.env.example`: added `GOOGLE_PLACES_API_KEY`, moved Firebase from "FUTURE" to "ACTIVE" and added the three vars its config was missing (`NEXT_PUBLIC_FIREBASE_PROJECT_ID`/`_MESSAGING_SENDER_ID`/`_VAPID_KEY`), added `CRON_SECRET` (pre-existing gap — already consumed by `cron/sos-resolve` but never documented) | Completed |
| Web push only — native Flutter push (would need `firebase_messaging` + native FCM tokens) and a rendered Google Map (Maps JS SDK) are explicitly out of scope, see ADR-016 | Deferred |
| Resolved pre-existing migration drift on the dev database (`message_reaction`, `TripStatus` enum values, `message.metadata`, `user.lastActiveAt` existed live with no migration file) via `prisma migrate reset`, per explicit user consent (dev phase, no real users) — reseeded the 3 standard test accounts; any account created outside the seed script (e.g. a real phone-OTP signup) did not survive and needs to be recreated | Completed |

## Rider Registration Restructure + Modal Panic UI (2026-07-17, ADR-015)

Name collection moved out of the OTP signup step into onboarding; onboarding form
reordered/expanded per a reference rider-registration mockup; Panic Button rebuilt as a
modal confirm flow and moved above the Hero.

| Task | Status |
|---|---|
| `/signup`: removed the inline "Full name" field from the OTP-entry step (both Rider and Partner share this step); `completePhoneSignupSchema`/`UserService.completePhoneSignup` now treat `name` as optional, so the post-verify call only applies the chosen role | Completed |
| `/onboarding`: added Full Name field + rider photo upload (reusing the existing `/api/upload` → Cloudinary pipeline and `authClient.updateUser` — same pattern as `ProfileSettings.tsx`), reordered sections to Vehicle → Rider profile → Driving licence → Address → Emergency contacts → Government ID → Riding details | Completed |
| `RiderProfileExtraFields` split into 4 exported sub-components (`VehicleDetailsFields`, `RiderPersonalFields`, `GovernmentIdFields`, `RidingDetailsFields`) so onboarding can reorder them; combined export unchanged for Settings | Completed |
| `/partner-onboarding`: added a "Your details" → Full Name field, since Partner accounts also no longer get a name from the OTP step | Completed |
| `PanicButtonSection`: rebuilt as a modal-based confirm flow (Red = one-tap "Are you sure?", Amber = category picker) instead of an inline expanding panel; GPS captured silently in the background on modal open, city input only shown as a fallback if geolocation fails; moved above the Hero on the homepage | Completed |
| Added missing `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER` to `.env.example` — `SMSService` (Twilio) already sends OTP/SOS SMS when these are set, they just weren't documented | Completed |

## OTP Toast for Testing Builds (2026-07-16)

Made the OTP visible as a toast notification on production builds during testing, so the
team doesn't need to check the server console for the code.

| Task | Status |
|---|---|
| Removed `NODE_ENV === "production"` guards from `DevOtpStore` and `/api/dev/otp` route — replaced with `SHOW_OTP_TOAST` env var (defaults to enabled) | Completed |
| Added `ToastProvider` to root layout so auth pages can use toasts | Completed |
| Replaced dashed-border "Dev mode" OTP box with a toast notification on both `/login` and `/signup` | Completed |

## Onboarding Field Expansion + Welcome/Login Fixes (2026-07-16, ADR-014)

Follow-up round: a crash fix, an admin-login gap fix, and a second reference doc's onboarding
field list adopted onto the existing models (not its parallel schema — see ADR-014).

| Task | Status |
|---|---|
| Bug fix: stale Turbopack cache crash (`phoneInput is not defined`) on `/login` — confirmed source was already clean, no code change needed beyond a dev-server/browser refresh | Completed |
| Bug fix: `/login`'s full rewrite to phone/OTP had silently dropped the only UI path to email/password sign-in, which would have locked out the seeded admin account (email/password, no phone number). Added an "Log in with email instead" fallback toggle | Completed |
| `PhoneNumberInput` shared component: country-code dropdown (India +91 default, USA +1) + 10-digit number field, replacing the old free-form phone text input on both `/login` and `/signup` | Completed |
| `/welcome`: role selection now routes to `/login` for both roles (was: straight to homepage/marketing, no login required) — matches the client's described flow; visuals updated to a circular glowing logo badge + tagline + background image, closer to a provided reference mockup, still on the existing dark-navy/indigo theme | Completed |
| `RiderProfile` extended with father/mother name, DOB, gender, blood group, medical history, allergies, vehicle type/brand/model, government ID type+number (raw text, no verification), rider frequency, riding club type+name — migration applied live. New fields added to both `/onboarding` and the Settings "Rider Details" section | Completed |
| `Partner` extended with Aadhaar number + 2 contact persons (name+mobile) — migration applied live. New fields added to the shared partner-signup component, wired through both the signup and login-upgrade flows | Completed |
| Not built (explicit user decision): the reference doc's parallel `Biker`/`Provider`/`PanicAlert`/`Trip`/`Booking` schema — the existing `User`/`Partner`/`SOSAlert`/`Trip`/`Booking` models already cover this, adopting the doc's models too would duplicate/replace working systems for no gain | Deferred |

## Product Requests (2026-07-15)

Real bug report plus a batch of product asks from a client meeting, scoped down per explicit
user decisions (see ADR-012 in `.docs/DECISIONS.md` for what was descoped and why — no
Aadhaar/KYC verification, no mobile+OTP login, dark theme kept as-is).

| Task | Status |
|---|---|
| Bug fix: `/dashboard/requests` approve/reject called a `PATCH` method that doesn't exist on `/api/trips/[slug]/requests` (405, silently no-op) — now calls the real `POST .../requests/[id]/approve\|reject` routes, with error feedback surfaced on failure (e.g. `NO_SEATS`) | Completed |
| Homepage: new "Upcoming Rides" section (`components/home/UpcomingRides.tsx`, backed by `GET /api/trips?tab=upcoming`) — previously the homepage had zero ride content | Completed |
| Homepage: SOS CTA added to the Hero, linking to the existing `/dashboard/sos` feature (no new "nearby riders" live-location system built — explicitly descoped) | Completed |
| `/welcome` role-select page redesigned from full-bleed photo panels to a compact centered-logo + two-card layout, dark theme kept (no orange/purple) | Completed |
| New `RiderProfile`/`RiderEmergencyContact` schema + migration (applied live) + full API (`GET/PUT /api/rider-profile`, `POST /api/rider-profile/skip`) — driving licence, address, up to 3 emergency contacts | Completed |
| New skippable onboarding form (`/onboarding`), gated only on new rider signups (partner signups unaffected) | Completed |
| Dashboard Settings: dead "Emergency Contacts... coming soon" stub replaced with a real editable "Rider Details" section wired to the RiderProfile API. "Documents" upload stub intentionally left as-is (separate, larger feature) | Completed |
| Chat UI (Milestone 8.4): reply/edit/delete/reactions/typing/read-receipts — see that milestone's row below for detail | In Progress |
| Not built (explicit user decision): Aadhaar/government-ID verification (needs a licensed third-party vendor) | Deferred |
| **Follow-up (2026-07-15): mobile number + OTP login built after all** — see ADR-013 below | Completed |

## Phone Number + OTP Login (2026-07-15, ADR-013)

Reversed the "hold off on OTP" call from the row above once asked to build it anyway, for
both Rider and Partner. See ADR-013 in `.docs/DECISIONS.md` for the full design.

| Task | Status |
|---|---|
| Schema: `User.phoneNumber` (unique) / `phoneNumberVerified`, migration applied live (user-approved after an auto-mode safety check on the direct-DB-write step) | Completed |
| Better Auth `phoneNumber` plugin wired (`packages/auth/src/server.ts`): send/verify OTP, auto-register on first verification with a placeholder name/email, `callbackOnVerification` keeps the pre-existing `User.phone` field in sync | Completed |
| OTP delivery via the existing `SMSService` — console-logs the code when Twilio isn't configured (true today), sends real SMS the moment `TWILIO_*` env vars are added, zero code change needed either way | Completed |
| `GET /api/auth-helpers/phone-exists`, `PATCH /api/user/complete-phone-signup` (sets real name + role once, right after a brand-new phone's first verification), `POST /api/user/become-partner` (self-service Rider → Partner upgrade) | Completed |
| `/signup` and `/login` rewritten from email+password to phone+OTP for both roles; Settings gained a "Become a Service Provider" action (sign out → `/welcome` → re-verify same phone → business details → upgraded) | Completed |
| Fixed in passing: the partner-type list on signup was missing `FUEL_DELIVERY` (out of sync with the schema's 8-value enum) — now sourced from the same validated enum everywhere | Completed |

## Pre-Launch Audit Fixes (2026-07-14)

A full cross-functional audit (architecture, product/UX, security, performance, mobile,
community/admin) was run against the whole codebase and produced 42 findings (2 Critical,
12 High, 19 Medium, 9 Low). All 42 were fixed in this pass. Highlights:

- **Critical**: booking creation had no protection against two renters double-booking the
  same bike for overlapping dates — fixed with a transaction that locks the `Bike` row and
  checks for overlapping non-cancelled bookings before creating (`createBookingIfAvailable`
  in `booking.repository.ts`), returning a clean 409 instead of racing. The public navbar
  rendered no navigation at all for logged-out visitors/crawlers (nav config was keyed off a
  role-selection cookie with no default) — now defaults to the rider/public nav.
- **High**: added rate limiting (Better Auth's built-in limiter now backed by Upstash Redis
  `secondaryStorage` so it survives across serverless instances, plus per-route limits on SOS
  alert creation and message sending); rewrote the upload endpoint to validate size/MIME/magic
  bytes and upload to Cloudinary instead of writing to Vercel's ephemeral local filesystem;
  fixed admin "delete user" throwing an unhandled FK-constraint error (now a clean 409); added
  route-level loading/error boundaries; consolidated two competing `Skeleton` implementations
  down to one (`@bikie/ui`); added `robots.ts`/`sitemap.ts`; fixed the mobile app's release
  build silently defaulting to a known-broken production API; added real mobile test coverage
  (was a single trivial smoke test); built the Reports/Moderation admin UI and wired the
  already-existing notification feed to its expected `/dashboard/notifications` URL with a
  navbar bell — both were previously complete on the backend with no UI in front of them.
- **Medium/Low**: missing FK indexes, review-creation and trip-slug creation races, CSV
  formula-injection in admin export, a leaked participant email in 1:1 conversations, Zod
  validation gaps across ~15 routes, security headers, ride-discovery search/filters, two
  dead-end "manage" stub pages, a hardcoded "Pending Approvals" stat, admin Groups CRUD and
  editable Trips, and more — see the audit artifact for the full itemized list.
- As a side effect, two items in the pre-existing backlog below are now resolved: the rider
  dashboard Notifications tab (now the real feed, not a stub) and the read-only Admin Trips
  page (now has edit/cancel/delete) — both removed from the backlog table.
- Not run: applying the two new FK-index-only migration was safe and was applied directly to
  the live DB (additive `CREATE INDEX`, no data risk); no other schema/data migration was run
  against the shared DB in this pass.

## Milestone 8 — Community Platform v2 (Ride Rooms, Encrypted Chat, Moderation, Mobile Parity)

See ADR-011 in `.docs/DECISIONS.md` for the full architecture. Triggered by a full-project
audit that found Communities/Groups/Clubs/Events/Reports/Moderation/Notification had no
Prisma models at all, and chat had zero encryption + a realtime mechanism confirmed broken
across Vercel's serverless instances.

| Task | Status |
|---|---|
| 8.0 — ADR-011 written; ARCHITECTURE.md/API.md doc stubs | Completed |
| 8.1 — Schema/migration (Group, GroupMember, Announcement, MessageAttachment, MessageReceipt, Report, ModerationAction, Notification, field additions, `TripType.EVENT`); migration applied to the live DB (user-approved). `encrypt-existing-messages.ts` backfill script written, **not run** (needs separate explicit sign-off — no plaintext-message backfill has occurred) | Completed |
| 8.2 — Upstash Redis realtime swap (`RealtimeService`: per-user inbox + non-destructive cursor-based broadcast channels for global/admin), `sse-manager.ts` deleted, SSE route + SOS route migrated | Completed |
| 8.3 — Encryption (AES-256-GCM, `message-crypto.ts`) + Message model overhaul (reply/edit/delete/per-participant receipts/system messages). Verified live: message send/edit/delete/typing/read-receipt all confirmed working via the API; direct DB inspection confirmed `content` is null and `ciphertext` populated for new messages | Completed |
| 8.4 — Chat UI (web): reply/edit/delete/emoji reactions/typing indicator/read receipts UI (`apps/web/components/chat/ChatArea.tsx`, `MessageItem.tsx`) — all wired to the already-complete 8.3 backend, no server-side changes needed (typing/edit/delete/reaction/read-receipt SSE fan-out was already implemented in `MessageService`, just not yet consumed client-side). Cloudinary upload/attachment composer UI still not built (`MessageAttachmentDTO`/backend attachment support exists, no image/file picker wired in) | In Progress |
| 8.5 — Ride Room **backend**: `assertRideRoomAccess` guard, `Announcement` service/repo, `/api/trips/[slug]/room/**` routes (room/announcements/meeting-point/emergency-contacts/media). Typecheck-clean, not live-tested (see note below) | Completed (backend) |
| 8.5b — Ride Room **web UI**: `/dashboard/rides/[slug]/room` page with tabs | Planned |
| 8.6 — Reports + Admin Moderation **backend**: `ReportService`/`ModerationService`, warn/mute/suspend/ban/restore, conversation lock/delete, message delete, `AuditLog` integration, BANNED/SUSPENDED enforcement in `requireSession`, MUTED enforcement in `MessageService.sendMessage`. Typecheck-clean, not live-tested | Completed (backend) |
| 8.6b — Reports + Admin Moderation **UI**: `/admin/moderation` (Reports queue with status/target-type filters, per-report detail panel, warn/mute/suspend/ban/restore actions, message delete, conversation lock/unlock/delete — all wired to the existing 8.6 routes) plus `/admin/reports` disambiguated to "Revenue Reports" (unrelated business-reporting stub) so the two no longer collide in the nav. Typecheck-clean, not live-tested (see 8.6 note) | Completed |
| 8.7 — Admin dashboard build-out: **Rides edit/cancel** (`/admin/trips` — new `AdminService.updateTrip`/`deleteTrip` + `GET/PATCH/DELETE /api/admin/trips(/[id])`, edit modal covering title/description/seatsTotal/dates/status, one-click "Cancel Ride") and **Groups CRUD** (`/admin/groups` — new `AdminService.getAllGroups`/`createGroup`/`updateGroup`/`deleteGroup` + `GET/POST /api/admin/groups`, `PATCH/DELETE /api/admin/groups/[id]`, full create/edit/delete table filterable by COMMUNITY/CLUB) done. Still Planned: Ride Requests admin view, Notifications broadcast UI | In Progress |
| 8.8 — Mobile parity (`ride_room`, `notifications` Flutter features) | In Progress — Milestones 1-3 + an auth/onboarding fix done, see sub-table below |
| 8.9 — Docs update + backlog log (below) | Planned |

### Milestone 8.8 — Mobile Parity (2026-07-28)

`apps/mobile` predates Milestone 7/8 — it has read-only Rides browse/detail and plain-polling
messaging, but no request/approve flow, no Ride Room, no chat reply/edit/delete/reactions/
receipts, no Nearby Riders, no in-app Notifications feed, and its dark-theme color tokens
matched an earlier, already-superseded version of `globals.css`. Bringing it to parity with
the current site, one milestone at a time (see this row's sub-tasks as they land).

| Task | Status |
|---|---|
| Milestone 1 — Design system fix: `AppColors` dark/light tokens corrected to match the *live* `apps/web/app/globals.css` values (dark bg/card/surface were `#0A0E1A`/`#111827`/`#0F172A`, an earlier palette `.docs/UI_GUIDELINES.md` still describes; live site is `#26258F`/`#1E1D72`/`#1E1D72`, accent `#3B3A91`, foreground `#EDF0F7`). Added a `darkAccentHover`/`lightAccentHover` token pair (previously missing) and wired it into `ElevatedButtonThemeData`'s pressed state via `WidgetStateProperty`. Also fixed button/input shape (buttons are `rounded-full` per `packages/ui/src/button.tsx`, not the card's `rounded-3xl`; inputs use `rounded-xl`/12px, a distinct `kInputRadius`) and replaced two ad hoc `Colors.redAccent` SOS usages with the theme's `colorScheme.error` (already `#EF4444`, matching Tailwind red-500). `flutter analyze`/`flutter test` clean, not yet visually verified on-device | Completed |
| Milestone 2 — Community: Ride Feed, Ride Details, Ride Requests, Ride Creation, Request Approval. Extended `apps/mobile/lib/features/trips/*` (not a new feature module): `TripDetail`/`TripSummary` models gained `organizer.id`, `meetingPoint`, `members`; new `RideJoinRequest`/`MyRideRequestStatus`/`RideStats`/`MyRides` models; `TripRepository` gained `create`/`getMine`/`getPendingRequestsFor`/`getAllPendingRequests`/`requestToJoin`/`getMyRequestStatus`/`approveRequest`/`rejectRequest`/`leaveRide`/`getGroupConversationId` — all against existing routes, no backend changes. New screens: `create_ride_screen.dart` (`/trips/create`, full-screen form mirroring `createTripSchema`), `my_rides_screen.dart` (`/rides/mine`, organized/joined/requested tabs + `RideStatsDTO` tiles), `ride_requests_screen.dart` (`/requests`, aggregated organizer inbox via `GET /api/requests/pending`). `trip_detail_screen.dart` rebuilt with a `RideActionsPanel`-equivalent (sign-in CTA / rider request-or-pending-or-approved states / organizer's inline per-ride request queue / "Open Ride Room" group-chat link). `trips_list_screen.dart` gained a "Create Ride" FAB, a "My Rides" app bar action, and free/priced + seats-left badges. Router: `/trips` moved inside the bottom-nav `ShellRoute` (previously lost the nav bar when browsing rides); added a "Rides" bottom-nav tab. 11 new repository unit tests. `flutter analyze`/`flutter test` clean (44/44), not yet visually verified on-device — Ride Room itself (announcements/media/emergency contacts) is out of scope for this milestone, see Milestone 3 below | Completed |
| Milestone 3 — Ride Room (new `apps/mobile/lib/features/ride_room/*`: `RideRoom`/`Announcement`/`MediaItem`/`EmergencyContact` models, `RideRoomRepository` against all 6 `/api/trips/[slug]/room/**` routes, `RideRoomScreen` at `/trips/[slug]/room` with Chat/Info/Members/Announcements/Media tabs — role-gated edit affordances via `RideRoom.canManage`; "Members" sourced from `GET /api/conversations` participants since `TripDetailDTO.members` is never populated server-side; "Ride Timeline" deliberately not built — the web page it would mirror (`/trips/[slug]/manage/timeline`) is itself a non-functional stub with no real backing data). Messaging upgrade (`apps/mobile/lib/features/messaging/*`, same module, no new architecture): fixed a live parsing bug (`ConversationParticipant.email` was `required` but the API never sends one, post-audit-fix — every real `GET /api/conversations` response would have failed to parse); `MessageModel` extended to the full `MessageDTO` shape; `MessageRepository` gained `editMessage`/`deleteMessage`/`reactToMessage`/`removeReaction`/`setTyping`/`markRead`; chat UI rebuilt (`conversation_thread_body.dart`, factored out of the screen so the Ride Room's Chat tab reuses it) with reply/edit/delete/reactions/read-receipt ticks/edited label/deleted-message placeholder/client-side search; polling interval is now a `{conversationId, fast}` family key (6s normal, 3s for a Ride Room thread, per ADR-011). Typing indicator is send-only on mobile — there's no polling-friendly way to read back *other* users' typing state without SSE. New Notifications feature (`apps/mobile/lib/features/notifications/*`) at `/notifications`, polling `GET/POST /api/notifications` every 45s (matches web's `NotificationsTab.tsx`) — found live but undocumented in `.docs/API.md`, added there in this pass along with the previously-prose-only Ride Room/message-mutation routes. 24 new unit tests (66/66 total). `flutter analyze`/`flutter test` clean, not yet visually verified on-device | Completed |
| Out-of-sequence fix (2026-07-28, ADR-019) — Auth/onboarding gate + production API default, done ahead of Milestone 4 per explicit user request ("fix that first, most important"). New `apps/mobile/lib/features/onboarding/*`: `SplashScreen` (replaces the bare boot spinner in `main.dart`), `IntroScreen` (first-launch 3-slide carousel, gated on a new `AppPreferences`/`SharedPreferences` flag), `WelcomeScreen` (ports web's `/welcome` role cards, both leading to `/login` per ADR-014). `app_router.dart` rewired: every route except `/intro`/`/welcome`/`/login`/`/signup` now requires a session (mobile-only decision — web still allows anonymous browsing, ADR-014) — this replaced and simplified the old `_authRequiredPrefixes` allowlist entirely. `login_screen.dart`/`signup_screen.dart` rebuilt around Better Auth's `phoneNumber` plugin (`AuthRepository` gained `sendOtp`/`verifyOtp`/`phoneExists`/`completePhoneSignup`/`fetchDevOtp`, calling the plugin's raw REST endpoints directly — no Dart client exists for it), with email/password kept as a fallback toggle for the seeded admin account, exactly mirroring web's ADR-013 posture. `app_config.dart`'s API base URL now defaults to the live `https://bikie.app` (verified reachable and serving real data via `GET /api/bikes/featured`) for both debug and release builds, replacing the old release-mode hard failure from when production genuinely lagged. Not ported (separate, larger features, see ADR-019): the mid-login Rider→Partner upgrade mini-form, and the post-signup `/onboarding` rider-profile form. 15 new `AuthRepository` unit tests (73/73 total). `flutter analyze`/`flutter test` clean, not yet visually verified on-device | Completed |
| Milestone 4 — SOS 3-tab parity (Active Alerts city-gating, respond, Nearby Help), Nearby Riders | Planned |
| Milestone 5 — Rider Profile/onboarding fields, Membership, Settings (Become-a-Partner, Rider Details) | Planned |
| Milestone 6 — Performance, offline caching, final polish | Planned |

Note on "not live-tested": the permission classifier blocks further ad hoc data-mutating test
calls against the shared prod/dev DB beyond the initial migration + encryption verification
already approved; the user chose "code review only" for the remainder of this build rather
than granting broader live-testing permission. 8.5/8.6/8.6b/8.7 backends are typecheck-clean
and traced against the same call patterns already verified working in 8.1–8.3, but have not
been exercised end-to-end via real HTTP calls the way messaging was.

## Backlog — pre-existing bugs found during Milestone 8's pre-build audit (not in scope for Milestone 8)

Deferred per explicit user decision — tracked here for a future pass:

| Bug | Area |
|---|---|
| No bike edit/update capability anywhere for partners | Partner dashboard |
| Partner Bookings page is read-only, no accept/reject route exists | Partner dashboard |
| Partner Settings/business-profile page is read-only despite a working `PUT /api/partner/profile` underneath | Partner dashboard |
| `/partners/services` promises 8 partner types (mechanic, fuel delivery, tour guide, hotel, camping, accessories, photography); dashboard only supports bike-fleet listing | Partner marketing vs. dashboard gap |
| `lib/partner-content.ts` (services/benefits/pricing/success-stories) is 100% hardcoded, no admin CMS management | Partner marketing |
| `/community` page's "Featured Riders" and "Rider Clubs" sections are still hardcoded fake data with dead-click cards, zero API calls (the "Upcoming Rides" section was fixed — now shows real API-backed rides with working Create/Join CTAs, per direct user report of not being able to find ride creation) | Rider public site |
| `/clubs` page is 100% hardcoded fake data; "+ Create Club" CTA is non-functional | Rider public site |
| Contact form (`ContactForm`) never calls an API — `onSubmit` just sets local state, message is never sent | Rider public site |
| `/safety-center` is static hardcoded topics, no API | Rider public site |
| Settings page has two dead "coming soon" stub sections (document upload, emergency contacts — note: ride-level emergency contacts are being built in Milestone 8, but this is a *profile-level* stub, distinct) | Rider dashboard |
| Admin Settings page is a non-functional stub (readOnly inputs, no save) | Admin |
| CMS is limited to Testimonials only; no generic content/page management | Admin |

## Milestone 7 — Rides: Community v1

| Task | Status |
|---|---|
| Schema: `ParticipantStatus` request/approve enum, `TripParticipant.message`/`decidedAt`, `Trip.meetingPoint`, `Conversation.tripId` (ADR-010) | Completed |
| Data migration: remap 2 live `JOINED` rows → `APPROVED` inline during enum swap | Completed |
| Repository + service: request/approve/reject/leave, atomic seat accounting, group conversation creation, ride stats | Completed |
| `POST /api/trips` (ride creation, membership-gated) | Completed |
| `/api/trips/[slug]/requests` (POST request, GET organizer queue), `/requests/mine`, `/requests/[id]/approve`, `/requests/[id]/reject`, `/leave`, `/group` | Completed |
| `/api/trips/mine` extended with `requested` + `stats` | Completed |
| Web: `/trips/create` ride creation form | Completed |
| Web: `RideActionsPanel` (replaces `JoinTripCard` stub) — request/pending/approved states + organizer request-review queue | Completed |
| Web: Ride Group entry via `?conversation=` deep link into `/dashboard/messages` | Completed |
| Web: `/dashboard/trips` extended with Requested section + reputation stat tiles | Completed |
| Nav/copy relabel "Trips" → "Rides" | Completed |
| End-to-end browser verification (Playwright: create → browse → request → approve → group chat) | Completed — found and fixed a real bug (unauthenticated visitors could see the full create-ride form before the redirect fired; now gated on `session` before render, not just a `useEffect` side-effect) |
| Bug fix: `/dashboard/trips` had no path to `/trips/create` — the "Rides You Organize" section rendered nothing at all when empty, so a rider who hadn't organized a ride yet had no way to discover ride creation from the dashboard. Added a "+ Create a Ride" header button plus an `EmptyState` CTA in that section; also fixed `requireMembership()`'s 403 payload, which was returning SOS-specific copy ("SOS Emergency is a BIKIE Membership perk...") for the shared membership gate used by ride creation | Completed |
| Mobile port (Milestone 7b): ride browse list + detail screen (`apps/mobile/lib/features/trips/*`) | Completed (undocumented until now) |
| Mobile port (Milestone 7b): request-to-join, organizer's request-review screen, ride creation | Backlog |
| Rider-to-rider reviews, badges, membership tiers, clubs (deferred per ADR-10) | Backlog |

## Milestone 6 — Mobile App

| Task | Status |
|---|---|
| Better Auth `bearer` plugin (ADR-007) | Completed |
| `POST /api/bookings` (booking creation, service + repository + route + validation) | Completed |
| `POST /api/bikes/[slug]/reviews` (review creation, gated on completed booking) | Completed |
| Wishlist add/remove (`POST`/`DELETE /api/wishlist/[bikeId]`) | Completed |
| `.docs/API.md` reconciliation (undocumented routes, stale entries, bearer auth section) | Completed |
| Flutter scaffolding (`apps/mobile`), theme parity, networking layer, auth flow | Completed |
| Browse/search screens (bikes, destinations, trips) | Completed |
| Bookings, reviews, wishlist screens | Completed |
| SOS, membership, referrals screens | Completed |
| Messaging (polling), profile, polish | Completed |
| Bundle Inter font locally instead of `google_fonts` runtime fetch (ADR-008 correction — crashed on a device/emulator with no general internet DNS) | Completed |
| Full on-device smoke test (Android emulator) | Blocked — emulator (`Pixel_9` and `Pixel_3a_API_34`) repeatedly crashes/disconnects within seconds of app launch on this dev machine; appears to be a local virtualization/resource issue, not an app defect. `flutter analyze`/`flutter test` pass; app builds, installs, and launched without runtime exceptions in the one run that got far enough to confirm the font fix. Needs a stable device/emulator to finish. |
| Point mobile app at production API (`https://bikie-web-rs8i.vercel.app`) | Done, with caveat — production has not yet deployed the Phase 0 backend routes (confirmed via curl: no `set-auth-token` header, `POST /api/bookings` → 405, wishlist route → 404) even though the commit is on `origin/master`. App falls back to a local dev server via `--dart-define=API_BASE_URL=...` in the meantime. |

## Milestone 3b — SOS Hardening, Membership Gating, Referrals

| Task | Status |
|---|---|
| SOS alert cards show full reporter info (email, phone, map link) | Completed |
| SOS send/view/respond gated behind active membership (admin bypass) | Completed |
| Referral schema (`User.referralCode` / `referredById`) + migration | Completed |
| Referral API (`/api/referrals/me`, `/api/referrals/link`) + dashboard page | Completed |
| Signup accepts optional referral code / `?ref=` link | Completed |
| Admin Referrals page (`/admin/referrals`) | Completed |
| Dummy payment checkout modal for membership purchase | Completed |
| Admin Membership Plans CRUD (`/admin/membership`) | Completed |

## Milestone 3 — Real-time + Admin Overhaul

| Task | Status |
|---|---|
| SSE endpoint + React hook | Completed |
| AuditLog model + migration + repo + service + API | Completed |
| Audit logging in all admin CRUD routes | Completed |
| Admin charts (recharts) on overview | Completed |
| CSV export API (users/bookings/partners) | Completed |
| Email service (Resend-compatible stub) | Completed |
| SMS gateway (Twilio-compatible stub) | Completed |
| Admin email/SMS send pages | Completed |
| SOS auto-resolve cron endpoint | Completed |
| SOS history API route | Completed |
| CMS testimonial management API + admin page | Completed |
| New admin nav items: SOS, Audit Logs, Testimonials, Email, SMS | Completed |

## Milestone 2 — Messaging, Membership, SOS

| Task | Status |
|---|---|
| Messaging schema + repo + service + API + UI | Completed |
| Membership schema + repo + service + API + UI | Completed |
| SOS schema + repo + service + API + UI | Completed |
| SSE manager | Completed |
| Partner fleet management | Completed |

## Milestone 1 — Foundation

| Task | Status |
|---|---|
| Theme + globals | Completed |
| Login/Register | Completed |
| Navbar + Footer | Completed |
| Admin CRUD (users, partners, bikes, bookings) | Completed |
| Layouts (admin, dashboard, partner) | Completed |
