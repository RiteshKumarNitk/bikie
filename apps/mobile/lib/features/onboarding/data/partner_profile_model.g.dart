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
  contactPerson1Name: json['contactPerson1Name'] as String?,
  contactPerson1Mobile: json['contactPerson1Mobile'] as String?,
  contactPerson2Name: json['contactPerson2Name'] as String?,
  contactPerson2Mobile: json['contactPerson2Mobile'] as String?,
  addressLine: json['addressLine'] as String?,
  area: json['area'] as String?,
  pincode: json['pincode'] as String?,
  latitude: (json['latitude'] as num?)?.toDouble(),
  longitude: (json['longitude'] as num?)?.toDouble(),
  governmentIdType: json['governmentIdType'] as String?,
  governmentIdNumber: json['governmentIdNumber'] as String?,
  isGeneralResponder: json['isGeneralResponder'] as bool?,
);

Map<String, dynamic> _$$PartnerProfileInputImplToJson(
  _$PartnerProfileInputImpl instance,
) => <String, dynamic>{
  'businessName': instance.businessName,
  'type': instance.type,
  'city': instance.city,
  'description': instance.description,
  'contactPerson1Name': instance.contactPerson1Name,
  'contactPerson1Mobile': instance.contactPerson1Mobile,
  'contactPerson2Name': instance.contactPerson2Name,
  'contactPerson2Mobile': instance.contactPerson2Mobile,
  'addressLine': instance.addressLine,
  'area': instance.area,
  'pincode': instance.pincode,
  'latitude': instance.latitude,
  'longitude': instance.longitude,
  'governmentIdType': instance.governmentIdType,
  'governmentIdNumber': instance.governmentIdNumber,
  'isGeneralResponder': instance.isGeneralResponder,
};

_$PartnerProfileSummaryImpl _$$PartnerProfileSummaryImplFromJson(
  Map<String, dynamic> json,
) => _$PartnerProfileSummaryImpl(
  businessName: json['businessName'] as String,
  type: json['type'] as String,
  isVerified: json['isVerified'] as bool,
  isAvailable: json['isAvailable'] as bool,
  isGeneralResponder: json['isGeneralResponder'] as bool,
);

Map<String, dynamic> _$$PartnerProfileSummaryImplToJson(
  _$PartnerProfileSummaryImpl instance,
) => <String, dynamic>{
  'businessName': instance.businessName,
  'type': instance.type,
  'isVerified': instance.isVerified,
  'isAvailable': instance.isAvailable,
  'isGeneralResponder': instance.isGeneralResponder,
};
