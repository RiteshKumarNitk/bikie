// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'referral_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ReferredUserImpl _$$ReferredUserImplFromJson(Map<String, dynamic> json) =>
    _$ReferredUserImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$$ReferredUserImplToJson(_$ReferredUserImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'email': instance.email,
      'createdAt': instance.createdAt,
    };

_$ReferralInfoImpl _$$ReferralInfoImplFromJson(Map<String, dynamic> json) =>
    _$ReferralInfoImpl(
      code: json['code'] as String,
      referrals: (json['referrals'] as List<dynamic>)
          .map((e) => ReferredUser.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$$ReferralInfoImplToJson(_$ReferralInfoImpl instance) =>
    <String, dynamic>{'code': instance.code, 'referrals': instance.referrals};
