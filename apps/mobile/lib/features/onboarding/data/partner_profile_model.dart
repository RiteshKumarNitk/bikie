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
  }) = _PartnerProfileInput;

  factory PartnerProfileInput.fromJson(Map<String, dynamic> json) => _$PartnerProfileInputFromJson(json);
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
