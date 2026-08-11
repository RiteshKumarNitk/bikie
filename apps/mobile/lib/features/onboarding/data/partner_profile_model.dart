import 'package:freezed_annotation/freezed_annotation.dart';

part 'partner_profile_model.freezed.dart';
part 'partner_profile_model.g.dart';

/// Mirrors `packages/validation/src/partner.schema.ts`'s `partnerProfileSchema` and
/// `apps/web/components/auth/PartnerBusinessFields.tsx`'s `PartnerBusinessDetails` — same field
/// set, same required/optional split (`businessName`/`type`/`city` required, the rest optional).
/// `aadhaarNumber` (ADR-014) is gone as of ADR-036 — replaced by the typed
/// `governmentIdType`/`governmentIdNumber` pair, same shape as `RiderProfileInput`'s.
@freezed
class PartnerProfileInput with _$PartnerProfileInput {
  const factory PartnerProfileInput({
    required String businessName,
    required String type,
    required String city,
    String? description,
    String? contactPerson1Name,
    String? contactPerson1Mobile,
    String? contactPerson2Name,
    String? contactPerson2Mobile,
    String? businessMobile,
    String? businessEmail,
    String? addressLine,
    String? area,
    String? pincode,
    double? latitude,
    double? longitude,
    String? governmentIdType, // "AADHAAR" | "PASSPORT"
    String? governmentIdNumber,
    // --- §6 (OPERATIONS) ---
    String? workingHours,
    int? serviceRadiusKm,
    int? yearsOfExperience,
    // --- ADR-044 ---
    bool? isGeneralResponder,
  }) = _PartnerProfileInput;

  factory PartnerProfileInput.fromJson(Map<String, dynamic> json) => _$PartnerProfileInputFromJson(json);
}

/// Mirrors `PartnerProfileDTO` (`packages/types`) in full — used by the approved-partner
/// dashboard/settings read (`GET /api/partner/profile`) and, since ADR-046b, by
/// `GET /api/partner/application`'s `profile` field for every other verification state too. One
/// shape either way; the Profile "Business Profile" editor and the "Become a Service Provider"
/// screen both pre-fill `PartnerOnboardingScreen` from it.
@freezed
class PartnerProfileSummary with _$PartnerProfileSummary {
  const factory PartnerProfileSummary({
    required String businessName,
    required String type,
    required bool isVerified,
    required bool isAvailable,
    required bool isGeneralResponder,
    String? city,
    String? description,
    String? contactPerson1Name,
    String? contactPerson1Mobile,
    String? contactPerson2Name,
    String? contactPerson2Mobile,
    String? businessMobile,
    String? businessEmail,
    String? addressLine,
    String? area,
    String? pincode,
    double? latitude,
    double? longitude,
    String? governmentIdType,
    String? governmentIdNumber,
    // --- §6 (OPERATIONS) ---
    String? workingHours,
    int? serviceRadiusKm,
    int? yearsOfExperience,
    // --- ADR-046b: application/verification state ---
    String? verificationStatus,
    String? rejectionReason,
    String? reviewNote,
    String? submittedAt,
    String? reviewedAt,
    String? profilePhotoUrl,
    @Default([]) List<String> shopPhotoUrls,
    String? identityDocumentUrl,
    String? businessDocumentUrl,
    // --- §25 - aggregates for the discovery card and reviews section ---
    @Default(0) double ratingAvg,
    @Default(0) int ratingCount,
  }) = _PartnerProfileSummary;

  factory PartnerProfileSummary.fromJson(Map<String, dynamic> json) => _$PartnerProfileSummaryFromJson(json);
}

/// `GET /api/partner/application` (ADR-046b) — `status` is always one of the 7 conceptual
/// `PartnerVerificationStatus` values, including `'NOT_APPLIED'` (never stored server-side,
/// synthesized when there's no `Partner` row yet — `profile` is `null` in exactly that case).
@freezed
class PartnerApplication with _$PartnerApplication {
  const factory PartnerApplication({
    required String status,
    PartnerProfileSummary? profile,
  }) = _PartnerApplication;

  factory PartnerApplication.fromJson(Map<String, dynamic> json) => _$PartnerApplicationFromJson(json);
}

const partnerTypes = [
  'RENTAL',
  'MECHANIC',
  'FUEL_DELIVERY',
  'TOUR_GUIDE',
  'HOTEL',
  'CAMPING',
  'ACCESSORIES',
  'PHOTOGRAPHY',
];

const governmentIdTypes = {'AADHAAR': 'Aadhaar', 'PASSPORT': 'Passport'};
