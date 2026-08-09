// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'partner_dashboard_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$PartnerSosStatsImpl _$$PartnerSosStatsImplFromJson(
  Map<String, dynamic> json,
) => _$PartnerSosStatsImpl(
  activeRequests: (json['activeRequests'] as num).toInt(),
  todayAssistanceCount: (json['todayAssistanceCount'] as num).toInt(),
  completedCount: (json['completedCount'] as num).toInt(),
  ratingAvg: json['ratingAvg'] as num,
  ratingCount: (json['ratingCount'] as num).toInt(),
);

Map<String, dynamic> _$$PartnerSosStatsImplToJson(
  _$PartnerSosStatsImpl instance,
) => <String, dynamic>{
  'activeRequests': instance.activeRequests,
  'todayAssistanceCount': instance.todayAssistanceCount,
  'completedCount': instance.completedCount,
  'ratingAvg': instance.ratingAvg,
  'ratingCount': instance.ratingCount,
};

_$PartnerNearbyRequestImpl _$$PartnerNearbyRequestImplFromJson(
  Map<String, dynamic> json,
) => _$PartnerNearbyRequestImpl(
  id: json['id'] as String,
  type: json['type'] as String,
  severity: json['severity'] as String,
  city: json['city'] as String,
  distanceMeters: json['distanceMeters'] as num,
  createdAt: json['createdAt'] as String,
);

Map<String, dynamic> _$$PartnerNearbyRequestImplToJson(
  _$PartnerNearbyRequestImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'type': instance.type,
  'severity': instance.severity,
  'city': instance.city,
  'distanceMeters': instance.distanceMeters,
  'createdAt': instance.createdAt,
};

_$PartnerActiveSessionImpl _$$PartnerActiveSessionImplFromJson(
  Map<String, dynamic> json,
) => _$PartnerActiveSessionImpl(
  id: json['id'] as String,
  alertId: json['alertId'] as String,
  status: json['status'] as String,
  riderName: json['riderName'] as String,
  alertType: json['alertType'] as String,
  distanceMeters: json['distanceMeters'] as num?,
  etaMinutes: (json['etaMinutes'] as num?)?.toInt(),
);

Map<String, dynamic> _$$PartnerActiveSessionImplToJson(
  _$PartnerActiveSessionImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'alertId': instance.alertId,
  'status': instance.status,
  'riderName': instance.riderName,
  'alertType': instance.alertType,
  'distanceMeters': instance.distanceMeters,
  'etaMinutes': instance.etaMinutes,
};
