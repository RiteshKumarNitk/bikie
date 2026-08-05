// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'partner_profile_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$PartnerProfileInputImpl _$$PartnerProfileInputImplFromJson(
  Map<String, dynamic> json,
) => _$PartnerProfileInputImpl(
  businessName: json['businessName'] as String,
  type: json['type'] as String,
  city: json['city'] as String,
  description: json['description'] as String?,
  aadhaarNumber: json['aadhaarNumber'] as String?,
  contactPerson1Name: json['contactPerson1Name'] as String?,
  contactPerson1Mobile: json['contactPerson1Mobile'] as String?,
  contactPerson2Name: json['contactPerson2Name'] as String?,
  contactPerson2Mobile: json['contactPerson2Mobile'] as String?,
);

Map<String, dynamic> _$$PartnerProfileInputImplToJson(
  _$PartnerProfileInputImpl instance,
) => <String, dynamic>{
  'businessName': instance.businessName,
  'type': instance.type,
  'city': instance.city,
  'description': instance.description,
  'aadhaarNumber': instance.aadhaarNumber,
  'contactPerson1Name': instance.contactPerson1Name,
  'contactPerson1Mobile': instance.contactPerson1Mobile,
  'contactPerson2Name': instance.contactPerson2Name,
  'contactPerson2Mobile': instance.contactPerson2Mobile,
};
