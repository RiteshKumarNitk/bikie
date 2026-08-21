// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'partner_membership_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$PartnerMembershipPlanImpl _$$PartnerMembershipPlanImplFromJson(
  Map<String, dynamic> json,
) => _$PartnerMembershipPlanImpl(
  id: json['id'] as String,
  name: json['name'] as String,
  description: json['description'] as String,
  price: json['price'] as num,
  durationDays: (json['durationDays'] as num).toInt(),
  benefits: (json['benefits'] as List<dynamic>)
      .map((e) => e as String)
      .toList(),
  isActive: json['isActive'] as bool,
);

Map<String, dynamic> _$$PartnerMembershipPlanImplToJson(
  _$PartnerMembershipPlanImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'description': instance.description,
  'price': instance.price,
  'durationDays': instance.durationDays,
  'benefits': instance.benefits,
  'isActive': instance.isActive,
};

_$PartnerMembershipImpl _$$PartnerMembershipImplFromJson(
  Map<String, dynamic> json,
) => _$PartnerMembershipImpl(
  id: json['id'] as String,
  userId: json['userId'] as String,
  planId: json['planId'] as String,
  plan: PartnerMembershipPlan.fromJson(json['plan'] as Map<String, dynamic>),
  startDate: json['startDate'] as String,
  endDate: json['endDate'] as String,
  status: json['status'] as String,
  daysLeft: (json['daysLeft'] as num).toInt(),
);

Map<String, dynamic> _$$PartnerMembershipImplToJson(
  _$PartnerMembershipImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'userId': instance.userId,
  'planId': instance.planId,
  'plan': instance.plan,
  'startDate': instance.startDate,
  'endDate': instance.endDate,
  'status': instance.status,
  'daysLeft': instance.daysLeft,
};
