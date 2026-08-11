// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'account_type_request_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AccountTypeChangeRequestImpl _$$AccountTypeChangeRequestImplFromJson(
  Map<String, dynamic> json,
) => _$AccountTypeChangeRequestImpl(
  id: json['id'] as String,
  currentType: json['currentType'] as String,
  requestedType: json['requestedType'] as String,
  reason: json['reason'] as String,
  supportingInfo: json['supportingInfo'] as String?,
  status: json['status'] as String,
  adminRemarks: json['adminRemarks'] as String?,
  reviewedByName: json['reviewedByName'] as String?,
  reviewedAt: json['reviewedAt'] as String?,
  createdAt: json['createdAt'] as String,
);

Map<String, dynamic> _$$AccountTypeChangeRequestImplToJson(
  _$AccountTypeChangeRequestImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'currentType': instance.currentType,
  'requestedType': instance.requestedType,
  'reason': instance.reason,
  'supportingInfo': instance.supportingInfo,
  'status': instance.status,
  'adminRemarks': instance.adminRemarks,
  'reviewedByName': instance.reviewedByName,
  'reviewedAt': instance.reviewedAt,
  'createdAt': instance.createdAt,
};
