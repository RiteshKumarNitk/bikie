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
    String? addressLine,
    String? area,
    String? pincode,
    double? latitude,
    double? longitude,
    String? governmentIdType, // "AADHAAR" | "PASSPORT"
    String? governmentIdNumber,
    // --- ADR-044 ---
    bool? isGeneralResponder,
  }) = _PartnerProfileInput;

  factory PartnerProfileInput.fromJson(Map<String, dynamic> json) => _$PartnerProfileInputFromJson(json);
}

/// `GET /api/partner/profile` (ADR-044) — a mirror of `PartnerProfileDTO` (`packages/types`),
/// used both for the dashboard's stats/availability read and (as of the Profile "Business
/// Profile" editor) to pre-fill an edit of the same fields `PartnerProfileInput` writes.
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
    String? addressLine,
    String? area,
    String? pincode,
    double? latitude,
    double? longitude,
    String? governmentIdType,
    String? governmentIdNumber,
  }) = _PartnerProfileSummary;

  factory PartnerProfileSummary.fromJson(Map<String, dynamic> json) => _$PartnerProfileSummaryFromJson(json);
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
