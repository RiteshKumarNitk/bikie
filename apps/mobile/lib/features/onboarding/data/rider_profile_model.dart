import 'package:freezed_annotation/freezed_annotation.dart';

part 'rider_profile_model.freezed.dart';
part 'rider_profile_model.g.dart';

/// Mirrors `packages/validation/src/rider-profile.schema.ts`'s `emergencyContactSchema` — one
/// of up to 3 people SOS fan-out reaches by SMS/WhatsApp/email in addition to nearby riders.
@freezed
class EmergencyContactInput with _$EmergencyContactInput {
  const factory EmergencyContactInput({
    required String name,
    required String phone,
    String? email,
    String? relation,
  }) = _EmergencyContactInput;

  factory EmergencyContactInput.fromJson(Map<String, dynamic> json) => _$EmergencyContactInputFromJson(json);
}

/// Mirrors `riderProfileSchema`/`RiderProfileDTO` — every field is optional server-side (the
/// whole form is skippable, ADR-012), but the more that's filled in, the more useful an SOS
/// alert is to the responders who see it (blood group, medical history, vehicle, emergency
/// contacts).
@freezed
class RiderProfileInput with _$RiderProfileInput {
  const factory RiderProfileInput({
    String? drivingLicenceNumber,
    String? drivingLicenceExpiry, // ISO-8601
    String? addressLine,
    String? area,
    String? district,
    String? pincode,
    String? country,
    String? fatherName,
    String? motherName,
    String? dateOfBirth, // ISO-8601
    String? gender,
    String? bloodGroup,
    String? medicalHistory,
    String? allergies,
    String? vehicleType,
    String? vehicleBrand,
    String? vehicleModel,
    String? vehicleRegistrationNumber,
    String? governmentIdType, // "AADHAAR" | "PASSPORT"
    String? governmentIdNumber,
    String? riderFrequency, // "OCCASIONAL" | "WEEKLY" | "DAILY"
    String? ridingClubType, // "SOLO" | "CLUB_MEMBER"
    String? clubName,
    @Default([]) List<EmergencyContactInput> emergencyContacts,
  }) = _RiderProfileInput;

  factory RiderProfileInput.fromJson(Map<String, dynamic> json) => _$RiderProfileInputFromJson(json);
}

const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const vehicleTypeOptions = ['Motorbike', 'Scooter', 'Bicycle', 'Other'];
const governmentIdTypeOptions = {'AADHAAR': 'Aadhaar', 'PASSPORT': 'Passport'};
const riderFrequencyOptions = {'OCCASIONAL': 'Occasional', 'WEEKLY': 'Weekly', 'DAILY': 'Daily'};
