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
    String? userPhone,
    required String userEmail,
    required String type,
    String? description,
    required num latitude,
    required num longitude,
    required String city,
    required String status,
    required String severity,
    required String escalationTier,
    required int currentRadiusMeters,
    String? assignedHelperId,
    String? resolvedAt,
    required String createdAt,
  }) = _SOSAlert;

  factory SOSAlert.fromJson(Map<String, dynamic> json) => _$SOSAlertFromJson(json);
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
