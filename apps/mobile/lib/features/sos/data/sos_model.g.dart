// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sos_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$SOSAlertImpl _$$SOSAlertImplFromJson(Map<String, dynamic> json) =>
    _$SOSAlertImpl(
      id: json['id'] as String,
      userId: json['userId'] as String,
      userName: json['userName'] as String,
      userPhone: json['userPhone'] as String?,
      userEmail: json['userEmail'] as String,
      type: json['type'] as String,
      description: json['description'] as String?,
      latitude: json['latitude'] as num,
      longitude: json['longitude'] as num,
      city: json['city'] as String,
      status: json['status'] as String,
      severity: json['severity'] as String,
      escalationTier: json['escalationTier'] as String,
      currentRadiusMeters: (json['currentRadiusMeters'] as num).toInt(),
      assignedHelperId: json['assignedHelperId'] as String?,
      resolvedAt: json['resolvedAt'] as String?,
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$$SOSAlertImplToJson(_$SOSAlertImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'userName': instance.userName,
      'userPhone': instance.userPhone,
      'userEmail': instance.userEmail,
      'type': instance.type,
      'description': instance.description,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'city': instance.city,
      'status': instance.status,
      'severity': instance.severity,
      'escalationTier': instance.escalationTier,
      'currentRadiusMeters': instance.currentRadiusMeters,
      'assignedHelperId': instance.assignedHelperId,
      'resolvedAt': instance.resolvedAt,
      'createdAt': instance.createdAt,
    };

_$SOSHistoryEntryImpl _$$SOSHistoryEntryImplFromJson(
  Map<String, dynamic> json,
) => _$SOSHistoryEntryImpl(
  id: json['id'] as String,
  type: json['type'] as String,
  description: json['description'] as String?,
  city: json['city'] as String,
  status: json['status'] as String,
  severity: json['severity'] as String,
  escalationTier: json['escalationTier'] as String,
  assignedHelperId: json['assignedHelperId'] as String?,
  resolvedAt: json['resolvedAt'] as String?,
  createdAt: json['createdAt'] as String,
  responses:
      (json['responses'] as List<dynamic>?)
          ?.map((e) => SOSHistoryResponse.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
);

Map<String, dynamic> _$$SOSHistoryEntryImplToJson(
  _$SOSHistoryEntryImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'type': instance.type,
  'description': instance.description,
  'city': instance.city,
  'status': instance.status,
  'severity': instance.severity,
  'escalationTier': instance.escalationTier,
  'assignedHelperId': instance.assignedHelperId,
  'resolvedAt': instance.resolvedAt,
  'createdAt': instance.createdAt,
  'responses': instance.responses,
};

_$SOSHistoryResponseImpl _$$SOSHistoryResponseImplFromJson(
  Map<String, dynamic> json,
) => _$SOSHistoryResponseImpl(
  id: json['id'] as String,
  responderName: json['responderName'] as String,
  message: json['message'] as String?,
  createdAt: json['createdAt'] as String,
);

Map<String, dynamic> _$$SOSHistoryResponseImplToJson(
  _$SOSHistoryResponseImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'responderName': instance.responderName,
  'message': instance.message,
  'createdAt': instance.createdAt,
};

_$SOSOfferImpl _$$SOSOfferImplFromJson(Map<String, dynamic> json) =>
    _$SOSOfferImpl(
      id: json['id'] as String,
      alertId: json['alertId'] as String,
      responderId: json['responderId'] as String,
      responderName: json['responderName'] as String,
      responderPhone: json['responderPhone'] as String?,
      status: json['status'] as String,
      distanceMeters: json['distanceMeters'] as num?,
      etaMinutes: (json['etaMinutes'] as num?)?.toInt(),
      message: json['message'] as String?,
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$$SOSOfferImplToJson(_$SOSOfferImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'alertId': instance.alertId,
      'responderId': instance.responderId,
      'responderName': instance.responderName,
      'responderPhone': instance.responderPhone,
      'status': instance.status,
      'distanceMeters': instance.distanceMeters,
      'etaMinutes': instance.etaMinutes,
      'message': instance.message,
      'createdAt': instance.createdAt,
    };

_$SOSParticipantImpl _$$SOSParticipantImplFromJson(Map<String, dynamic> json) =>
    _$SOSParticipantImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String?,
      email: json['email'] as String,
    );

Map<String, dynamic> _$$SOSParticipantImplToJson(
  _$SOSParticipantImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'phone': instance.phone,
  'email': instance.email,
};

_$SOSSessionDetailImpl _$$SOSSessionDetailImplFromJson(
  Map<String, dynamic> json,
) => _$SOSSessionDetailImpl(
  id: json['id'] as String,
  status: json['status'] as String,
  conversationId: json['conversationId'] as String?,
  rating: (json['rating'] as num?)?.toInt(),
  helper: SOSParticipant.fromJson(json['helper'] as Map<String, dynamic>),
  rider: SOSParticipant.fromJson(json['rider'] as Map<String, dynamic>),
);

Map<String, dynamic> _$$SOSSessionDetailImplToJson(
  _$SOSSessionDetailImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'status': instance.status,
  'conversationId': instance.conversationId,
  'rating': instance.rating,
  'helper': instance.helper,
  'rider': instance.rider,
};

_$SOSTimelineEventImpl _$$SOSTimelineEventImplFromJson(
  Map<String, dynamic> json,
) => _$SOSTimelineEventImpl(
  id: json['id'] as String,
  type: json['type'] as String,
  actorName: json['actorName'] as String?,
  createdAt: json['createdAt'] as String,
);

Map<String, dynamic> _$$SOSTimelineEventImplToJson(
  _$SOSTimelineEventImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'type': instance.type,
  'actorName': instance.actorName,
  'createdAt': instance.createdAt,
};

_$SOSAlertDetailImpl _$$SOSAlertDetailImplFromJson(Map<String, dynamic> json) =>
    _$SOSAlertDetailImpl(
      alert: SOSAlert.fromJson(json['alert'] as Map<String, dynamic>),
      timeline:
          (json['timeline'] as List<dynamic>?)
              ?.map((e) => SOSTimelineEvent.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      session: json['session'] == null
          ? null
          : SOSSessionDetail.fromJson(json['session'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$SOSAlertDetailImplToJson(
  _$SOSAlertDetailImpl instance,
) => <String, dynamic>{
  'alert': instance.alert,
  'timeline': instance.timeline,
  'session': instance.session,
};

_$SOSDispatchChannelsImpl _$$SOSDispatchChannelsImplFromJson(
  Map<String, dynamic> json,
) => _$SOSDispatchChannelsImpl(
  sms: json['sms'] as bool? ?? false,
  whatsapp: json['whatsapp'] as bool? ?? false,
  email: json['email'] as bool? ?? false,
);

Map<String, dynamic> _$$SOSDispatchChannelsImplToJson(
  _$SOSDispatchChannelsImpl instance,
) => <String, dynamic>{
  'sms': instance.sms,
  'whatsapp': instance.whatsapp,
  'email': instance.email,
};

_$SOSDispatchSummaryImpl _$$SOSDispatchSummaryImplFromJson(
  Map<String, dynamic> json,
) => _$SOSDispatchSummaryImpl(
  nearbyRiders: (json['nearbyRiders'] as num?)?.toInt() ?? 0,
  serviceProviders: (json['serviceProviders'] as num?)?.toInt() ?? 0,
  emergencyContacts: (json['emergencyContacts'] as num?)?.toInt() ?? 0,
  emergencyServices: (json['emergencyServices'] as num?)?.toInt() ?? 0,
  smsAttempted: (json['smsAttempted'] as num?)?.toInt() ?? 0,
  smsSent: (json['smsSent'] as num?)?.toInt() ?? 0,
  whatsappAttempted: (json['whatsappAttempted'] as num?)?.toInt() ?? 0,
  whatsappSent: (json['whatsappSent'] as num?)?.toInt() ?? 0,
  emailAttempted: (json['emailAttempted'] as num?)?.toInt() ?? 0,
  emailSent: (json['emailSent'] as num?)?.toInt() ?? 0,
  escalatedToAdmins: (json['escalatedToAdmins'] as num?)?.toInt() ?? 0,
  channels: json['channels'] == null
      ? null
      : SOSDispatchChannels.fromJson(json['channels'] as Map<String, dynamic>),
);

Map<String, dynamic> _$$SOSDispatchSummaryImplToJson(
  _$SOSDispatchSummaryImpl instance,
) => <String, dynamic>{
  'nearbyRiders': instance.nearbyRiders,
  'serviceProviders': instance.serviceProviders,
  'emergencyContacts': instance.emergencyContacts,
  'emergencyServices': instance.emergencyServices,
  'smsAttempted': instance.smsAttempted,
  'smsSent': instance.smsSent,
  'whatsappAttempted': instance.whatsappAttempted,
  'whatsappSent': instance.whatsappSent,
  'emailAttempted': instance.emailAttempted,
  'emailSent': instance.emailSent,
  'escalatedToAdmins': instance.escalatedToAdmins,
  'channels': instance.channels,
};

_$SOSCreateResultImpl _$$SOSCreateResultImplFromJson(
  Map<String, dynamic> json,
) => _$SOSCreateResultImpl(
  alert: SOSAlert.fromJson(json['alert'] as Map<String, dynamic>),
  dispatch: json['dispatch'] == null
      ? null
      : SOSDispatchSummary.fromJson(json['dispatch'] as Map<String, dynamic>),
  profileWarning: json['profileWarning'] as String?,
);

Map<String, dynamic> _$$SOSCreateResultImplToJson(
  _$SOSCreateResultImpl instance,
) => <String, dynamic>{
  'alert': instance.alert,
  'dispatch': instance.dispatch,
  'profileWarning': instance.profileWarning,
};
