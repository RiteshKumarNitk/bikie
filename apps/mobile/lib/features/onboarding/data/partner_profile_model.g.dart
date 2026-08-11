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
  workingHours: json['workingHours'] as String?,
  serviceRadiusKm: (json['serviceRadiusKm'] as num?)?.toInt(),
  yearsOfExperience: (json['yearsOfExperience'] as num?)?.toInt(),
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
  'workingHours': instance.workingHours,
  'serviceRadiusKm': instance.serviceRadiusKm,
  'yearsOfExperience': instance.yearsOfExperience,
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
  city: json['city'] as String?,
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
  workingHours: json['workingHours'] as String?,
  serviceRadiusKm: (json['serviceRadiusKm'] as num?)?.toInt(),
  yearsOfExperience: (json['yearsOfExperience'] as num?)?.toInt(),
  verificationStatus: json['verificationStatus'] as String?,
  rejectionReason: json['rejectionReason'] as String?,
  reviewNote: json['reviewNote'] as String?,
  submittedAt: json['submittedAt'] as String?,
  reviewedAt: json['reviewedAt'] as String?,
  profilePhotoUrl: json['profilePhotoUrl'] as String?,
  shopPhotoUrls:
      (json['shopPhotoUrls'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList() ??
      const [],
  identityDocumentUrl: json['identityDocumentUrl'] as String?,
  businessDocumentUrl: json['businessDocumentUrl'] as String?,
  ratingAvg: (json['ratingAvg'] as num?)?.toDouble() ?? 0,
  ratingCount: (json['ratingCount'] as num?)?.toInt() ?? 0,
);

Map<String, dynamic> _$$PartnerProfileSummaryImplToJson(
  _$PartnerProfileSummaryImpl instance,
) => <String, dynamic>{
  'businessName': instance.businessName,
  'type': instance.type,
  'isVerified': instance.isVerified,
  'isAvailable': instance.isAvailable,
  'isGeneralResponder': instance.isGeneralResponder,
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
  'workingHours': instance.workingHours,
  'serviceRadiusKm': instance.serviceRadiusKm,
  'yearsOfExperience': instance.yearsOfExperience,
  'verificationStatus': instance.verificationStatus,
  'rejectionReason': instance.rejectionReason,
  'reviewNote': instance.reviewNote,
  'submittedAt': instance.submittedAt,
  'reviewedAt': instance.reviewedAt,
  'profilePhotoUrl': instance.profilePhotoUrl,
  'shopPhotoUrls': instance.shopPhotoUrls,
  'identityDocumentUrl': instance.identityDocumentUrl,
  'businessDocumentUrl': instance.businessDocumentUrl,
  'ratingAvg': instance.ratingAvg,
  'ratingCount': instance.ratingCount,
};

_$PartnerApplicationImpl _$$PartnerApplicationImplFromJson(
  Map<String, dynamic> json,
) => _$PartnerApplicationImpl(
  status: json['status'] as String,
  profile: json['profile'] == null
      ? null
      : PartnerProfileSummary.fromJson(json['profile'] as Map<String, dynamic>),
);

Map<String, dynamic> _$$PartnerApplicationImplToJson(
  _$PartnerApplicationImpl instance,
) => <String, dynamic>{'status': instance.status, 'profile': instance.profile};
