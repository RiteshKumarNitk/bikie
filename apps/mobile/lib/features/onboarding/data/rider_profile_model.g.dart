// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'rider_profile_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$EmergencyContactInputImpl _$$EmergencyContactInputImplFromJson(
  Map<String, dynamic> json,
) => _$EmergencyContactInputImpl(
  name: json['name'] as String,
  phone: json['phone'] as String,
  email: json['email'] as String?,
  relation: json['relation'] as String?,
);

Map<String, dynamic> _$$EmergencyContactInputImplToJson(
  _$EmergencyContactInputImpl instance,
) => <String, dynamic>{
  'name': instance.name,
  'phone': instance.phone,
  'email': instance.email,
  'relation': instance.relation,
};

_$RiderProfileInputImpl _$$RiderProfileInputImplFromJson(
  Map<String, dynamic> json,
) => _$RiderProfileInputImpl(
  drivingLicenceNumber: json['drivingLicenceNumber'] as String?,
  drivingLicenceExpiry: json['drivingLicenceExpiry'] as String?,
  addressLine: json['addressLine'] as String?,
  area: json['area'] as String?,
  district: json['district'] as String?,
  pincode: json['pincode'] as String?,
  country: json['country'] as String?,
  fatherName: json['fatherName'] as String?,
  motherName: json['motherName'] as String?,
  dateOfBirth: json['dateOfBirth'] as String?,
  gender: json['gender'] as String?,
  bloodGroup: json['bloodGroup'] as String?,
  medicalHistory: json['medicalHistory'] as String?,
  allergies: json['allergies'] as String?,
  vehicleType: json['vehicleType'] as String?,
  vehicleBrand: json['vehicleBrand'] as String?,
  vehicleModel: json['vehicleModel'] as String?,
  governmentIdType: json['governmentIdType'] as String?,
  governmentIdNumber: json['governmentIdNumber'] as String?,
  riderFrequency: json['riderFrequency'] as String?,
  ridingClubType: json['ridingClubType'] as String?,
  clubName: json['clubName'] as String?,
  emergencyContacts:
      (json['emergencyContacts'] as List<dynamic>?)
          ?.map(
            (e) => EmergencyContactInput.fromJson(e as Map<String, dynamic>),
          )
          .toList() ??
      const [],
);

Map<String, dynamic> _$$RiderProfileInputImplToJson(
  _$RiderProfileInputImpl instance,
) => <String, dynamic>{
  'drivingLicenceNumber': instance.drivingLicenceNumber,
  'drivingLicenceExpiry': instance.drivingLicenceExpiry,
  'addressLine': instance.addressLine,
  'area': instance.area,
  'district': instance.district,
  'pincode': instance.pincode,
  'country': instance.country,
  'fatherName': instance.fatherName,
  'motherName': instance.motherName,
  'dateOfBirth': instance.dateOfBirth,
  'gender': instance.gender,
  'bloodGroup': instance.bloodGroup,
  'medicalHistory': instance.medicalHistory,
  'allergies': instance.allergies,
  'vehicleType': instance.vehicleType,
  'vehicleBrand': instance.vehicleBrand,
  'vehicleModel': instance.vehicleModel,
  'governmentIdType': instance.governmentIdType,
  'governmentIdNumber': instance.governmentIdNumber,
  'riderFrequency': instance.riderFrequency,
  'ridingClubType': instance.ridingClubType,
  'clubName': instance.clubName,
  'emergencyContacts': instance.emergencyContacts,
};
