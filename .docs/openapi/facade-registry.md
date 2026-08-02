# Compatibility facade registry (Phase 9)

Facades keep import paths stable while modules own behavior. **Do not delete** a facade
until zero-use proof + ADR. Status as of ADR-028:

| Facade | Module | Removal status |
|---|---|---|
| `EmailService` / `SMSService` / `WhatsAppService` / `PushService` | `communications` | Keep — still imported by routes/modules |
| `SOSService` / `SOSDispatchService` / `RiderLocationService` / `PlacesService` | `safety-location` | Keep |
| `BikeService` / `DestinationService` / `CategoryService` / `TestimonialService` | `catalog` | Keep |
| `BookingService` / `ReviewService` / `WishlistService` | `rentals-bookings` | Keep |
| `PartnerService` | `partners` | Keep |
| `TripService` / `RideRoomService` | `rides-community` | Keep |
| `MessageService` | `messaging` | Keep |
| `AdminService` | `administration` | Keep |
| `ReportService` / `ModerationService` / `AuditService` | `trust-safety` | Keep |
| `UserService` / `MembershipService` / `ReferralService` / `NotificationService` / `UploadService` / `RiderProfileService` | not fully modularized | Keep until those contexts are extracted |

## Feature flags retained

| Flag | Purpose | Removal condition |
|---|---|---|
| `SOS_ASYNC_DISPATCH` | Reserved async fan-out enqueue | Remove only after worker/outbox ships + telemetry shows unused |

## `/api/v2`

Not created. Breaking changes require an ADR, OpenAPI `v2` document, deprecation headers on
v1 successors, and a consumer migration window with telemetry.
