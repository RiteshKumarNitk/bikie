import 'package:freezed_annotation/freezed_annotation.dart';

part 'sos_model.freezed.dart';
part 'sos_model.g.dart';

/// Mirrors `packages/types/src/sos.ts` `SOSAlertDTO` (ADR-033).
@freezed
class SOSAlert with _$SOSAlert {
  const factory SOSAlert({
    required String id,
    required String userId,
    required String userName,
    // ADR-045 — phone/email/exact location are null unless the viewer is the reporter, the
    // assigned helper, or an admin (see redactAlertForViewer, packages/services). Every screen
    // that reads these must handle null, not just "missing profile field."
    String? userPhone,
    String? userEmail,
    required String type,
    String? description,
    num? latitude,
    num? longitude,
    required String city,
    required String status,
    required String severity,
    required String escalationTier,
    required int currentRadiusMeters,
    String? assignedHelperId,
    String? resolvedAt,
    required String createdAt,
    // Reverse-geocoded from latitude/longitude at creation time (ADR-038) — null if the
    // lookup failed/timed out, OR redacted for a non-privileged pre-assignment viewer (ADR-045);
    // fall back to `city`/raw coordinates when null.
    String? placeName,
    String? area,
    String? formattedAddress,
    // From the reporting rider's own RiderProfile (ADR-044) — most riders never fill this in.
    String? riderVehicleType,
    String? riderVehicleBrand,
    String? riderVehicleModel,
    // ADR-045 — server-computed distance from the viewer's own supplied lat/lng; only populated
    // on the active-alerts list (`GET /api/sos/alerts?lat=&lng=`), null elsewhere. Compensates
    // for latitude/longitude being redacted pre-assignment.
    num? distanceMeters,
  }) = _SOSAlert;

  factory SOSAlert.fromJson(Map<String, dynamic> json) => _$SOSAlertFromJson(json);
}

/// Emoji + label per SOS category — shared between `sos_detail_screen.dart` (rider/generic
/// helper view) and `partner_sos_request_screen.dart` (ADR-044) so both render identical
/// category text instead of two copies silently drifting apart.
const sosTypeLabels = {
  'ACCIDENT': '🚨 Accident',
  'LIFE_THREATENING': '🔥 Life Threatening',
  'MEDICAL': '🏥 Medical Emergency',
  'BIKE_BREAKDOWN': '🔧 Bike Breakdown',
  'FLAT_TYRE': '🔩 Flat Tyre',
  'FUEL_EMPTY': '⛽ Fuel Required',
  'BATTERY_ISSUE': '🔋 Battery Issue',
  'LOST': '🗺️ Lost',
  'OTHER': '❗ Other',
};

/// Human-readable location for display — mirrors the web's `describeLocation()`
/// (`dispatch-message.ts`, ADR-038): prefers the reverse-geocoded address, falls back to a
/// placeName/area/city join, falls back to bare city. Never shows raw lat/long as the primary
/// label — the "view on map" link stays available separately for that.
String describeSosLocation({String? formattedAddress, String? placeName, String? area, required String city}) {
  if (formattedAddress != null && formattedAddress.isNotEmpty) return formattedAddress;
  final parts = [placeName, area, city].where((p) => p != null && p.isNotEmpty).toList();
  return parts.isNotEmpty ? parts.join(', ') : city;
}

/// The caller's own alert history has a different (smaller) shape than
/// `SOSAlert` — no reporter fields, since the caller already knows who they
/// are. Was previously force-parsed as a full `SOSAlert`, which would throw
/// on every required-field mismatch (a pre-existing bug, fixed here).
@freezed
class SOSHistoryEntry with _$SOSHistoryEntry {
  const factory SOSHistoryEntry({
    required String id,
    required String type,
    String? description,
    required String city,
    required String status,
    required String severity,
    required String escalationTier,
    String? assignedHelperId,
    String? resolvedAt,
    required String createdAt,
    @Default([]) List<SOSHistoryResponse> responses,
  }) = _SOSHistoryEntry;

  factory SOSHistoryEntry.fromJson(Map<String, dynamic> json) => _$SOSHistoryEntryFromJson(json);
}

@freezed
class SOSHistoryResponse with _$SOSHistoryResponse {
  const factory SOSHistoryResponse({
    required String id,
    required String responderName,
    String? message,
    required String createdAt,
  }) = _SOSHistoryResponse;

  factory SOSHistoryResponse.fromJson(Map<String, dynamic> json) => _$SOSHistoryResponseFromJson(json);
}

/// Mirrors `SOSOfferDTO`.
@freezed
class SOSOffer with _$SOSOffer {
  const factory SOSOffer({
    required String id,
    required String alertId,
    required String responderId,
    required String responderName,
    String? responderPhone,
    required String status,
    num? distanceMeters,
    int? etaMinutes,
    String? message,
    required String createdAt,
  }) = _SOSOffer;

  factory SOSOffer.fromJson(Map<String, dynamic> json) => _$SOSOfferFromJson(json);
}

@freezed
class SOSParticipant with _$SOSParticipant {
  const factory SOSParticipant({
    required String id,
    required String name,
    String? phone,
    required String email,
  }) = _SOSParticipant;

  factory SOSParticipant.fromJson(Map<String, dynamic> json) => _$SOSParticipantFromJson(json);
}

/// Mirrors `SOSSessionDTO` plus the `helper`/`rider` participant objects the
/// detail routes attach (`GET /api/sos/alerts/[id]`, `GET /api/sos/sessions/[id]`).
@freezed
class SOSSessionDetail with _$SOSSessionDetail {
  const factory SOSSessionDetail({
    required String id,
    required String status,
    String? conversationId,
    int? rating,
    required SOSParticipant helper,
    required SOSParticipant rider,
  }) = _SOSSessionDetail;

  factory SOSSessionDetail.fromJson(Map<String, dynamic> json) => _$SOSSessionDetailFromJson(json);
}

/// Mirrors `SOSTimelineEventDTO`.
@freezed
class SOSTimelineEvent with _$SOSTimelineEvent {
  const factory SOSTimelineEvent({
    required String id,
    required String type,
    String? actorName,
    required String createdAt,
  }) = _SOSTimelineEvent;

  factory SOSTimelineEvent.fromJson(Map<String, dynamic> json) => _$SOSTimelineEventFromJson(json);
}

/// `GET /api/sos/alerts/[id]` response — the alert, its full timeline, and
/// (if the caller is a participant or admin) the active session.
@freezed
class SOSAlertDetail with _$SOSAlertDetail {
  const factory SOSAlertDetail({
    required SOSAlert alert,
    @Default([]) List<SOSTimelineEvent> timeline,
    SOSSessionDetail? session,
  }) = _SOSAlertDetail;

  factory SOSAlertDetail.fromJson(Map<String, dynamic> json) => _$SOSAlertDetailFromJson(json);
}

/// Mirrors `ChannelAvailability` from `safety-location/domain/channel-selection.ts` — which
/// channels this deployment could actually deliver on for a given dispatch.
@freezed
class SOSDispatchChannels with _$SOSDispatchChannels {
  const factory SOSDispatchChannels({
    @Default(false) bool sms,
    @Default(false) bool whatsapp,
    @Default(false) bool email,
  }) = _SOSDispatchChannels;

  factory SOSDispatchChannels.fromJson(Map<String, dynamic> json) => _$SOSDispatchChannelsFromJson(json);
}

/// Mirrors `SOSDispatchSummary` (`fan-out.application.ts`) — the fields the web's
/// `PanicAlertCards.tsx` `DispatchReport` actually renders. ADR-030: the success screen must
/// report what really happened (recipients reached, per-channel sent/attempted, a distinct
/// "nobody reached" state) instead of a fixed "sent via SMS/WhatsApp/email" sentence.
@freezed
class SOSDispatchSummary with _$SOSDispatchSummary {
  const factory SOSDispatchSummary({
    @Default(0) int nearbyRiders,
    @Default(0) int serviceProviders,
    @Default(0) int emergencyContacts,
    @Default(0) int emergencyServices,
    @Default(0) int smsAttempted,
    @Default(0) int smsSent,
    @Default(0) int whatsappAttempted,
    @Default(0) int whatsappSent,
    @Default(0) int emailAttempted,
    @Default(0) int emailSent,
    @Default(0) int escalatedToAdmins,
    SOSDispatchChannels? channels,
  }) = _SOSDispatchSummary;

  factory SOSDispatchSummary.fromJson(Map<String, dynamic> json) => _$SOSDispatchSummaryFromJson(json);
}

/// `POST /api/sos/alerts` response envelope — the created alert plus the fan-out's dispatch
/// summary (null if the fan-out itself threw) and an optional profile-completeness warning.
@freezed
class SOSCreateResult with _$SOSCreateResult {
  const factory SOSCreateResult({
    required SOSAlert alert,
    SOSDispatchSummary? dispatch,
    String? profileWarning,
  }) = _SOSCreateResult;

  factory SOSCreateResult.fromJson(Map<String, dynamic> json) => _$SOSCreateResultFromJson(json);
}

/// `GET /api/sos/partners` — backs "Share Mechanic" / "Share Fuel Contact". Plain class (not
/// freezed) since it just flattens one nested `user.phone` field from the API response.
class SOSPartner {
  const SOSPartner({
    required this.userId,
    required this.businessName,
    this.userPhone,
    this.contactPerson1Mobile,
    this.latitude,
    this.longitude,
  });

  final String userId;
  final String businessName;
  final String? userPhone;
  final String? contactPerson1Mobile;
  final double? latitude;
  final double? longitude;

  factory SOSPartner.fromJson(Map<String, dynamic> json) => SOSPartner(
        userId: json['userId'] as String,
        businessName: json['businessName'] as String,
        userPhone: (json['user'] as Map<String, dynamic>?)?['phone'] as String?,
        contactPerson1Mobile: json['contactPerson1Mobile'] as String?,
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
      );
}
