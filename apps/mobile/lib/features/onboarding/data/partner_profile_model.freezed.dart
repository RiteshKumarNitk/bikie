// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'partner_profile_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

PartnerProfileInput _$PartnerProfileInputFromJson(Map<String, dynamic> json) {
  return _PartnerProfileInput.fromJson(json);
}

/// @nodoc
mixin _$PartnerProfileInput {
  String get businessName => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String get city => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  String? get contactPerson1Name => throw _privateConstructorUsedError;
  String? get contactPerson1Mobile => throw _privateConstructorUsedError;
  String? get contactPerson2Name => throw _privateConstructorUsedError;
  String? get contactPerson2Mobile => throw _privateConstructorUsedError;
  String? get businessMobile => throw _privateConstructorUsedError;
  String? get businessEmail => throw _privateConstructorUsedError;
  String? get addressLine => throw _privateConstructorUsedError;
  String? get area => throw _privateConstructorUsedError;
  String? get pincode => throw _privateConstructorUsedError;
  double? get latitude => throw _privateConstructorUsedError;
  double? get longitude => throw _privateConstructorUsedError;
  String? get governmentIdType =>
      throw _privateConstructorUsedError; // "AADHAAR" | "PASSPORT"
  String? get governmentIdNumber =>
      throw _privateConstructorUsedError; // --- §6 (OPERATIONS) ---
  String? get workingHours => throw _privateConstructorUsedError;
  int? get serviceRadiusKm => throw _privateConstructorUsedError;
  int? get yearsOfExperience =>
      throw _privateConstructorUsedError; // --- ADR-044 ---
  bool? get isGeneralResponder => throw _privateConstructorUsedError;

  /// Serializes this PartnerProfileInput to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of PartnerProfileInput
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $PartnerProfileInputCopyWith<PartnerProfileInput> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PartnerProfileInputCopyWith<$Res> {
  factory $PartnerProfileInputCopyWith(
    PartnerProfileInput value,
    $Res Function(PartnerProfileInput) then,
  ) = _$PartnerProfileInputCopyWithImpl<$Res, PartnerProfileInput>;
  @useResult
  $Res call({
    String businessName,
    String type,
    String city,
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
    String? workingHours,
    int? serviceRadiusKm,
    int? yearsOfExperience,
    bool? isGeneralResponder,
  });
}

/// @nodoc
class _$PartnerProfileInputCopyWithImpl<$Res, $Val extends PartnerProfileInput>
    implements $PartnerProfileInputCopyWith<$Res> {
  _$PartnerProfileInputCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of PartnerProfileInput
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? businessName = null,
    Object? type = null,
    Object? city = null,
    Object? description = freezed,
    Object? contactPerson1Name = freezed,
    Object? contactPerson1Mobile = freezed,
    Object? contactPerson2Name = freezed,
    Object? contactPerson2Mobile = freezed,
    Object? businessMobile = freezed,
    Object? businessEmail = freezed,
    Object? addressLine = freezed,
    Object? area = freezed,
    Object? pincode = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? governmentIdType = freezed,
    Object? governmentIdNumber = freezed,
    Object? workingHours = freezed,
    Object? serviceRadiusKm = freezed,
    Object? yearsOfExperience = freezed,
    Object? isGeneralResponder = freezed,
  }) {
    return _then(
      _value.copyWith(
            businessName: null == businessName
                ? _value.businessName
                : businessName // ignore: cast_nullable_to_non_nullable
                      as String,
            type: null == type
                ? _value.type
                : type // ignore: cast_nullable_to_non_nullable
                      as String,
            city: null == city
                ? _value.city
                : city // ignore: cast_nullable_to_non_nullable
                      as String,
            description: freezed == description
                ? _value.description
                : description // ignore: cast_nullable_to_non_nullable
                      as String?,
            contactPerson1Name: freezed == contactPerson1Name
                ? _value.contactPerson1Name
                : contactPerson1Name // ignore: cast_nullable_to_non_nullable
                      as String?,
            contactPerson1Mobile: freezed == contactPerson1Mobile
                ? _value.contactPerson1Mobile
                : contactPerson1Mobile // ignore: cast_nullable_to_non_nullable
                      as String?,
            contactPerson2Name: freezed == contactPerson2Name
                ? _value.contactPerson2Name
                : contactPerson2Name // ignore: cast_nullable_to_non_nullable
                      as String?,
            contactPerson2Mobile: freezed == contactPerson2Mobile
                ? _value.contactPerson2Mobile
                : contactPerson2Mobile // ignore: cast_nullable_to_non_nullable
                      as String?,
            businessMobile: freezed == businessMobile
                ? _value.businessMobile
                : businessMobile // ignore: cast_nullable_to_non_nullable
                      as String?,
            businessEmail: freezed == businessEmail
                ? _value.businessEmail
                : businessEmail // ignore: cast_nullable_to_non_nullable
                      as String?,
            addressLine: freezed == addressLine
                ? _value.addressLine
                : addressLine // ignore: cast_nullable_to_non_nullable
                      as String?,
            area: freezed == area
                ? _value.area
                : area // ignore: cast_nullable_to_non_nullable
                      as String?,
            pincode: freezed == pincode
                ? _value.pincode
                : pincode // ignore: cast_nullable_to_non_nullable
                      as String?,
            latitude: freezed == latitude
                ? _value.latitude
                : latitude // ignore: cast_nullable_to_non_nullable
                      as double?,
            longitude: freezed == longitude
                ? _value.longitude
                : longitude // ignore: cast_nullable_to_non_nullable
                      as double?,
            governmentIdType: freezed == governmentIdType
                ? _value.governmentIdType
                : governmentIdType // ignore: cast_nullable_to_non_nullable
                      as String?,
            governmentIdNumber: freezed == governmentIdNumber
                ? _value.governmentIdNumber
                : governmentIdNumber // ignore: cast_nullable_to_non_nullable
                      as String?,
            workingHours: freezed == workingHours
                ? _value.workingHours
                : workingHours // ignore: cast_nullable_to_non_nullable
                      as String?,
            serviceRadiusKm: freezed == serviceRadiusKm
                ? _value.serviceRadiusKm
                : serviceRadiusKm // ignore: cast_nullable_to_non_nullable
                      as int?,
            yearsOfExperience: freezed == yearsOfExperience
                ? _value.yearsOfExperience
                : yearsOfExperience // ignore: cast_nullable_to_non_nullable
                      as int?,
            isGeneralResponder: freezed == isGeneralResponder
                ? _value.isGeneralResponder
                : isGeneralResponder // ignore: cast_nullable_to_non_nullable
                      as bool?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$PartnerProfileInputImplCopyWith<$Res>
    implements $PartnerProfileInputCopyWith<$Res> {
  factory _$$PartnerProfileInputImplCopyWith(
    _$PartnerProfileInputImpl value,
    $Res Function(_$PartnerProfileInputImpl) then,
  ) = __$$PartnerProfileInputImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String businessName,
    String type,
    String city,
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
    String? workingHours,
    int? serviceRadiusKm,
    int? yearsOfExperience,
    bool? isGeneralResponder,
  });
}

/// @nodoc
class __$$PartnerProfileInputImplCopyWithImpl<$Res>
    extends _$PartnerProfileInputCopyWithImpl<$Res, _$PartnerProfileInputImpl>
    implements _$$PartnerProfileInputImplCopyWith<$Res> {
  __$$PartnerProfileInputImplCopyWithImpl(
    _$PartnerProfileInputImpl _value,
    $Res Function(_$PartnerProfileInputImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of PartnerProfileInput
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? businessName = null,
    Object? type = null,
    Object? city = null,
    Object? description = freezed,
    Object? contactPerson1Name = freezed,
    Object? contactPerson1Mobile = freezed,
    Object? contactPerson2Name = freezed,
    Object? contactPerson2Mobile = freezed,
    Object? businessMobile = freezed,
    Object? businessEmail = freezed,
    Object? addressLine = freezed,
    Object? area = freezed,
    Object? pincode = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? governmentIdType = freezed,
    Object? governmentIdNumber = freezed,
    Object? workingHours = freezed,
    Object? serviceRadiusKm = freezed,
    Object? yearsOfExperience = freezed,
    Object? isGeneralResponder = freezed,
  }) {
    return _then(
      _$PartnerProfileInputImpl(
        businessName: null == businessName
            ? _value.businessName
            : businessName // ignore: cast_nullable_to_non_nullable
                  as String,
        type: null == type
            ? _value.type
            : type // ignore: cast_nullable_to_non_nullable
                  as String,
        city: null == city
            ? _value.city
            : city // ignore: cast_nullable_to_non_nullable
                  as String,
        description: freezed == description
            ? _value.description
            : description // ignore: cast_nullable_to_non_nullable
                  as String?,
        contactPerson1Name: freezed == contactPerson1Name
            ? _value.contactPerson1Name
            : contactPerson1Name // ignore: cast_nullable_to_non_nullable
                  as String?,
        contactPerson1Mobile: freezed == contactPerson1Mobile
            ? _value.contactPerson1Mobile
            : contactPerson1Mobile // ignore: cast_nullable_to_non_nullable
                  as String?,
        contactPerson2Name: freezed == contactPerson2Name
            ? _value.contactPerson2Name
            : contactPerson2Name // ignore: cast_nullable_to_non_nullable
                  as String?,
        contactPerson2Mobile: freezed == contactPerson2Mobile
            ? _value.contactPerson2Mobile
            : contactPerson2Mobile // ignore: cast_nullable_to_non_nullable
                  as String?,
        businessMobile: freezed == businessMobile
            ? _value.businessMobile
            : businessMobile // ignore: cast_nullable_to_non_nullable
                  as String?,
        businessEmail: freezed == businessEmail
            ? _value.businessEmail
            : businessEmail // ignore: cast_nullable_to_non_nullable
                  as String?,
        addressLine: freezed == addressLine
            ? _value.addressLine
            : addressLine // ignore: cast_nullable_to_non_nullable
                  as String?,
        area: freezed == area
            ? _value.area
            : area // ignore: cast_nullable_to_non_nullable
                  as String?,
        pincode: freezed == pincode
            ? _value.pincode
            : pincode // ignore: cast_nullable_to_non_nullable
                  as String?,
        latitude: freezed == latitude
            ? _value.latitude
            : latitude // ignore: cast_nullable_to_non_nullable
                  as double?,
        longitude: freezed == longitude
            ? _value.longitude
            : longitude // ignore: cast_nullable_to_non_nullable
                  as double?,
        governmentIdType: freezed == governmentIdType
            ? _value.governmentIdType
            : governmentIdType // ignore: cast_nullable_to_non_nullable
                  as String?,
        governmentIdNumber: freezed == governmentIdNumber
            ? _value.governmentIdNumber
            : governmentIdNumber // ignore: cast_nullable_to_non_nullable
                  as String?,
        workingHours: freezed == workingHours
            ? _value.workingHours
            : workingHours // ignore: cast_nullable_to_non_nullable
                  as String?,
        serviceRadiusKm: freezed == serviceRadiusKm
            ? _value.serviceRadiusKm
            : serviceRadiusKm // ignore: cast_nullable_to_non_nullable
                  as int?,
        yearsOfExperience: freezed == yearsOfExperience
            ? _value.yearsOfExperience
            : yearsOfExperience // ignore: cast_nullable_to_non_nullable
                  as int?,
        isGeneralResponder: freezed == isGeneralResponder
            ? _value.isGeneralResponder
            : isGeneralResponder // ignore: cast_nullable_to_non_nullable
                  as bool?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$PartnerProfileInputImpl implements _PartnerProfileInput {
  const _$PartnerProfileInputImpl({
    required this.businessName,
    required this.type,
    required this.city,
    this.description,
    this.contactPerson1Name,
    this.contactPerson1Mobile,
    this.contactPerson2Name,
    this.contactPerson2Mobile,
    this.businessMobile,
    this.businessEmail,
    this.addressLine,
    this.area,
    this.pincode,
    this.latitude,
    this.longitude,
    this.governmentIdType,
    this.governmentIdNumber,
    this.workingHours,
    this.serviceRadiusKm,
    this.yearsOfExperience,
    this.isGeneralResponder,
  });

  factory _$PartnerProfileInputImpl.fromJson(Map<String, dynamic> json) =>
      _$$PartnerProfileInputImplFromJson(json);

  @override
  final String businessName;
  @override
  final String type;
  @override
  final String city;
  @override
  final String? description;
  @override
  final String? contactPerson1Name;
  @override
  final String? contactPerson1Mobile;
  @override
  final String? contactPerson2Name;
  @override
  final String? contactPerson2Mobile;
  @override
  final String? businessMobile;
  @override
  final String? businessEmail;
  @override
  final String? addressLine;
  @override
  final String? area;
  @override
  final String? pincode;
  @override
  final double? latitude;
  @override
  final double? longitude;
  @override
  final String? governmentIdType;
  // "AADHAAR" | "PASSPORT"
  @override
  final String? governmentIdNumber;
  // --- §6 (OPERATIONS) ---
  @override
  final String? workingHours;
  @override
  final int? serviceRadiusKm;
  @override
  final int? yearsOfExperience;
  // --- ADR-044 ---
  @override
  final bool? isGeneralResponder;

  @override
  String toString() {
    return 'PartnerProfileInput(businessName: $businessName, type: $type, city: $city, description: $description, contactPerson1Name: $contactPerson1Name, contactPerson1Mobile: $contactPerson1Mobile, contactPerson2Name: $contactPerson2Name, contactPerson2Mobile: $contactPerson2Mobile, businessMobile: $businessMobile, businessEmail: $businessEmail, addressLine: $addressLine, area: $area, pincode: $pincode, latitude: $latitude, longitude: $longitude, governmentIdType: $governmentIdType, governmentIdNumber: $governmentIdNumber, workingHours: $workingHours, serviceRadiusKm: $serviceRadiusKm, yearsOfExperience: $yearsOfExperience, isGeneralResponder: $isGeneralResponder)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PartnerProfileInputImpl &&
            (identical(other.businessName, businessName) ||
                other.businessName == businessName) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.city, city) || other.city == city) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.contactPerson1Name, contactPerson1Name) ||
                other.contactPerson1Name == contactPerson1Name) &&
            (identical(other.contactPerson1Mobile, contactPerson1Mobile) ||
                other.contactPerson1Mobile == contactPerson1Mobile) &&
            (identical(other.contactPerson2Name, contactPerson2Name) ||
                other.contactPerson2Name == contactPerson2Name) &&
            (identical(other.contactPerson2Mobile, contactPerson2Mobile) ||
                other.contactPerson2Mobile == contactPerson2Mobile) &&
            (identical(other.businessMobile, businessMobile) ||
                other.businessMobile == businessMobile) &&
            (identical(other.businessEmail, businessEmail) ||
                other.businessEmail == businessEmail) &&
            (identical(other.addressLine, addressLine) ||
                other.addressLine == addressLine) &&
            (identical(other.area, area) || other.area == area) &&
            (identical(other.pincode, pincode) || other.pincode == pincode) &&
            (identical(other.latitude, latitude) ||
                other.latitude == latitude) &&
            (identical(other.longitude, longitude) ||
                other.longitude == longitude) &&
            (identical(other.governmentIdType, governmentIdType) ||
                other.governmentIdType == governmentIdType) &&
            (identical(other.governmentIdNumber, governmentIdNumber) ||
                other.governmentIdNumber == governmentIdNumber) &&
            (identical(other.workingHours, workingHours) ||
                other.workingHours == workingHours) &&
            (identical(other.serviceRadiusKm, serviceRadiusKm) ||
                other.serviceRadiusKm == serviceRadiusKm) &&
            (identical(other.yearsOfExperience, yearsOfExperience) ||
                other.yearsOfExperience == yearsOfExperience) &&
            (identical(other.isGeneralResponder, isGeneralResponder) ||
                other.isGeneralResponder == isGeneralResponder));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hashAll([
    runtimeType,
    businessName,
    type,
    city,
    description,
    contactPerson1Name,
    contactPerson1Mobile,
    contactPerson2Name,
    contactPerson2Mobile,
    businessMobile,
    businessEmail,
    addressLine,
    area,
    pincode,
    latitude,
    longitude,
    governmentIdType,
    governmentIdNumber,
    workingHours,
    serviceRadiusKm,
    yearsOfExperience,
    isGeneralResponder,
  ]);

  /// Create a copy of PartnerProfileInput
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PartnerProfileInputImplCopyWith<_$PartnerProfileInputImpl> get copyWith =>
      __$$PartnerProfileInputImplCopyWithImpl<_$PartnerProfileInputImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$PartnerProfileInputImplToJson(this);
  }
}

abstract class _PartnerProfileInput implements PartnerProfileInput {
  const factory _PartnerProfileInput({
    required final String businessName,
    required final String type,
    required final String city,
    final String? description,
    final String? contactPerson1Name,
    final String? contactPerson1Mobile,
    final String? contactPerson2Name,
    final String? contactPerson2Mobile,
    final String? businessMobile,
    final String? businessEmail,
    final String? addressLine,
    final String? area,
    final String? pincode,
    final double? latitude,
    final double? longitude,
    final String? governmentIdType,
    final String? governmentIdNumber,
    final String? workingHours,
    final int? serviceRadiusKm,
    final int? yearsOfExperience,
    final bool? isGeneralResponder,
  }) = _$PartnerProfileInputImpl;

  factory _PartnerProfileInput.fromJson(Map<String, dynamic> json) =
      _$PartnerProfileInputImpl.fromJson;

  @override
  String get businessName;
  @override
  String get type;
  @override
  String get city;
  @override
  String? get description;
  @override
  String? get contactPerson1Name;
  @override
  String? get contactPerson1Mobile;
  @override
  String? get contactPerson2Name;
  @override
  String? get contactPerson2Mobile;
  @override
  String? get businessMobile;
  @override
  String? get businessEmail;
  @override
  String? get addressLine;
  @override
  String? get area;
  @override
  String? get pincode;
  @override
  double? get latitude;
  @override
  double? get longitude;
  @override
  String? get governmentIdType; // "AADHAAR" | "PASSPORT"
  @override
  String? get governmentIdNumber; // --- §6 (OPERATIONS) ---
  @override
  String? get workingHours;
  @override
  int? get serviceRadiusKm;
  @override
  int? get yearsOfExperience; // --- ADR-044 ---
  @override
  bool? get isGeneralResponder;

  /// Create a copy of PartnerProfileInput
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PartnerProfileInputImplCopyWith<_$PartnerProfileInputImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

PartnerProfileSummary _$PartnerProfileSummaryFromJson(
  Map<String, dynamic> json,
) {
  return _PartnerProfileSummary.fromJson(json);
}

/// @nodoc
mixin _$PartnerProfileSummary {
  String get businessName => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  bool get isVerified => throw _privateConstructorUsedError;
  bool get isAvailable => throw _privateConstructorUsedError;
  bool get isGeneralResponder => throw _privateConstructorUsedError;
  String? get city => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  String? get contactPerson1Name => throw _privateConstructorUsedError;
  String? get contactPerson1Mobile => throw _privateConstructorUsedError;
  String? get contactPerson2Name => throw _privateConstructorUsedError;
  String? get contactPerson2Mobile => throw _privateConstructorUsedError;
  String? get businessMobile => throw _privateConstructorUsedError;
  String? get businessEmail => throw _privateConstructorUsedError;
  String? get addressLine => throw _privateConstructorUsedError;
  String? get area => throw _privateConstructorUsedError;
  String? get pincode => throw _privateConstructorUsedError;
  double? get latitude => throw _privateConstructorUsedError;
  double? get longitude => throw _privateConstructorUsedError;
  String? get governmentIdType => throw _privateConstructorUsedError;
  String? get governmentIdNumber =>
      throw _privateConstructorUsedError; // --- §6 (OPERATIONS) ---
  String? get workingHours => throw _privateConstructorUsedError;
  int? get serviceRadiusKm => throw _privateConstructorUsedError;
  int? get yearsOfExperience =>
      throw _privateConstructorUsedError; // --- ADR-046b: application/verification state ---
  String? get verificationStatus => throw _privateConstructorUsedError;
  String? get rejectionReason => throw _privateConstructorUsedError;
  String? get reviewNote => throw _privateConstructorUsedError;
  String? get submittedAt => throw _privateConstructorUsedError;
  String? get reviewedAt => throw _privateConstructorUsedError;
  String? get profilePhotoUrl => throw _privateConstructorUsedError;
  List<String> get shopPhotoUrls => throw _privateConstructorUsedError;
  String? get identityDocumentUrl => throw _privateConstructorUsedError;
  String? get businessDocumentUrl =>
      throw _privateConstructorUsedError; // --- §25 - aggregates for the discovery card and reviews section ---
  double get ratingAvg => throw _privateConstructorUsedError;
  int get ratingCount => throw _privateConstructorUsedError;

  /// Serializes this PartnerProfileSummary to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of PartnerProfileSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $PartnerProfileSummaryCopyWith<PartnerProfileSummary> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PartnerProfileSummaryCopyWith<$Res> {
  factory $PartnerProfileSummaryCopyWith(
    PartnerProfileSummary value,
    $Res Function(PartnerProfileSummary) then,
  ) = _$PartnerProfileSummaryCopyWithImpl<$Res, PartnerProfileSummary>;
  @useResult
  $Res call({
    String businessName,
    String type,
    bool isVerified,
    bool isAvailable,
    bool isGeneralResponder,
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
    String? workingHours,
    int? serviceRadiusKm,
    int? yearsOfExperience,
    String? verificationStatus,
    String? rejectionReason,
    String? reviewNote,
    String? submittedAt,
    String? reviewedAt,
    String? profilePhotoUrl,
    List<String> shopPhotoUrls,
    String? identityDocumentUrl,
    String? businessDocumentUrl,
    double ratingAvg,
    int ratingCount,
  });
}

/// @nodoc
class _$PartnerProfileSummaryCopyWithImpl<
  $Res,
  $Val extends PartnerProfileSummary
>
    implements $PartnerProfileSummaryCopyWith<$Res> {
  _$PartnerProfileSummaryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of PartnerProfileSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? businessName = null,
    Object? type = null,
    Object? isVerified = null,
    Object? isAvailable = null,
    Object? isGeneralResponder = null,
    Object? city = freezed,
    Object? description = freezed,
    Object? contactPerson1Name = freezed,
    Object? contactPerson1Mobile = freezed,
    Object? contactPerson2Name = freezed,
    Object? contactPerson2Mobile = freezed,
    Object? businessMobile = freezed,
    Object? businessEmail = freezed,
    Object? addressLine = freezed,
    Object? area = freezed,
    Object? pincode = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? governmentIdType = freezed,
    Object? governmentIdNumber = freezed,
    Object? workingHours = freezed,
    Object? serviceRadiusKm = freezed,
    Object? yearsOfExperience = freezed,
    Object? verificationStatus = freezed,
    Object? rejectionReason = freezed,
    Object? reviewNote = freezed,
    Object? submittedAt = freezed,
    Object? reviewedAt = freezed,
    Object? profilePhotoUrl = freezed,
    Object? shopPhotoUrls = null,
    Object? identityDocumentUrl = freezed,
    Object? businessDocumentUrl = freezed,
    Object? ratingAvg = null,
    Object? ratingCount = null,
  }) {
    return _then(
      _value.copyWith(
            businessName: null == businessName
                ? _value.businessName
                : businessName // ignore: cast_nullable_to_non_nullable
                      as String,
            type: null == type
                ? _value.type
                : type // ignore: cast_nullable_to_non_nullable
                      as String,
            isVerified: null == isVerified
                ? _value.isVerified
                : isVerified // ignore: cast_nullable_to_non_nullable
                      as bool,
            isAvailable: null == isAvailable
                ? _value.isAvailable
                : isAvailable // ignore: cast_nullable_to_non_nullable
                      as bool,
            isGeneralResponder: null == isGeneralResponder
                ? _value.isGeneralResponder
                : isGeneralResponder // ignore: cast_nullable_to_non_nullable
                      as bool,
            city: freezed == city
                ? _value.city
                : city // ignore: cast_nullable_to_non_nullable
                      as String?,
            description: freezed == description
                ? _value.description
                : description // ignore: cast_nullable_to_non_nullable
                      as String?,
            contactPerson1Name: freezed == contactPerson1Name
                ? _value.contactPerson1Name
                : contactPerson1Name // ignore: cast_nullable_to_non_nullable
                      as String?,
            contactPerson1Mobile: freezed == contactPerson1Mobile
                ? _value.contactPerson1Mobile
                : contactPerson1Mobile // ignore: cast_nullable_to_non_nullable
                      as String?,
            contactPerson2Name: freezed == contactPerson2Name
                ? _value.contactPerson2Name
                : contactPerson2Name // ignore: cast_nullable_to_non_nullable
                      as String?,
            contactPerson2Mobile: freezed == contactPerson2Mobile
                ? _value.contactPerson2Mobile
                : contactPerson2Mobile // ignore: cast_nullable_to_non_nullable
                      as String?,
            businessMobile: freezed == businessMobile
                ? _value.businessMobile
                : businessMobile // ignore: cast_nullable_to_non_nullable
                      as String?,
            businessEmail: freezed == businessEmail
                ? _value.businessEmail
                : businessEmail // ignore: cast_nullable_to_non_nullable
                      as String?,
            addressLine: freezed == addressLine
                ? _value.addressLine
                : addressLine // ignore: cast_nullable_to_non_nullable
                      as String?,
            area: freezed == area
                ? _value.area
                : area // ignore: cast_nullable_to_non_nullable
                      as String?,
            pincode: freezed == pincode
                ? _value.pincode
                : pincode // ignore: cast_nullable_to_non_nullable
                      as String?,
            latitude: freezed == latitude
                ? _value.latitude
                : latitude // ignore: cast_nullable_to_non_nullable
                      as double?,
            longitude: freezed == longitude
                ? _value.longitude
                : longitude // ignore: cast_nullable_to_non_nullable
                      as double?,
            governmentIdType: freezed == governmentIdType
                ? _value.governmentIdType
                : governmentIdType // ignore: cast_nullable_to_non_nullable
                      as String?,
            governmentIdNumber: freezed == governmentIdNumber
                ? _value.governmentIdNumber
                : governmentIdNumber // ignore: cast_nullable_to_non_nullable
                      as String?,
            workingHours: freezed == workingHours
                ? _value.workingHours
                : workingHours // ignore: cast_nullable_to_non_nullable
                      as String?,
            serviceRadiusKm: freezed == serviceRadiusKm
                ? _value.serviceRadiusKm
                : serviceRadiusKm // ignore: cast_nullable_to_non_nullable
                      as int?,
            yearsOfExperience: freezed == yearsOfExperience
                ? _value.yearsOfExperience
                : yearsOfExperience // ignore: cast_nullable_to_non_nullable
                      as int?,
            verificationStatus: freezed == verificationStatus
                ? _value.verificationStatus
                : verificationStatus // ignore: cast_nullable_to_non_nullable
                      as String?,
            rejectionReason: freezed == rejectionReason
                ? _value.rejectionReason
                : rejectionReason // ignore: cast_nullable_to_non_nullable
                      as String?,
            reviewNote: freezed == reviewNote
                ? _value.reviewNote
                : reviewNote // ignore: cast_nullable_to_non_nullable
                      as String?,
            submittedAt: freezed == submittedAt
                ? _value.submittedAt
                : submittedAt // ignore: cast_nullable_to_non_nullable
                      as String?,
            reviewedAt: freezed == reviewedAt
                ? _value.reviewedAt
                : reviewedAt // ignore: cast_nullable_to_non_nullable
                      as String?,
            profilePhotoUrl: freezed == profilePhotoUrl
                ? _value.profilePhotoUrl
                : profilePhotoUrl // ignore: cast_nullable_to_non_nullable
                      as String?,
            shopPhotoUrls: null == shopPhotoUrls
                ? _value.shopPhotoUrls
                : shopPhotoUrls // ignore: cast_nullable_to_non_nullable
                      as List<String>,
            identityDocumentUrl: freezed == identityDocumentUrl
                ? _value.identityDocumentUrl
                : identityDocumentUrl // ignore: cast_nullable_to_non_nullable
                      as String?,
            businessDocumentUrl: freezed == businessDocumentUrl
                ? _value.businessDocumentUrl
                : businessDocumentUrl // ignore: cast_nullable_to_non_nullable
                      as String?,
            ratingAvg: null == ratingAvg
                ? _value.ratingAvg
                : ratingAvg // ignore: cast_nullable_to_non_nullable
                      as double,
            ratingCount: null == ratingCount
                ? _value.ratingCount
                : ratingCount // ignore: cast_nullable_to_non_nullable
                      as int,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$PartnerProfileSummaryImplCopyWith<$Res>
    implements $PartnerProfileSummaryCopyWith<$Res> {
  factory _$$PartnerProfileSummaryImplCopyWith(
    _$PartnerProfileSummaryImpl value,
    $Res Function(_$PartnerProfileSummaryImpl) then,
  ) = __$$PartnerProfileSummaryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String businessName,
    String type,
    bool isVerified,
    bool isAvailable,
    bool isGeneralResponder,
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
    String? workingHours,
    int? serviceRadiusKm,
    int? yearsOfExperience,
    String? verificationStatus,
    String? rejectionReason,
    String? reviewNote,
    String? submittedAt,
    String? reviewedAt,
    String? profilePhotoUrl,
    List<String> shopPhotoUrls,
    String? identityDocumentUrl,
    String? businessDocumentUrl,
    double ratingAvg,
    int ratingCount,
  });
}

/// @nodoc
class __$$PartnerProfileSummaryImplCopyWithImpl<$Res>
    extends
        _$PartnerProfileSummaryCopyWithImpl<$Res, _$PartnerProfileSummaryImpl>
    implements _$$PartnerProfileSummaryImplCopyWith<$Res> {
  __$$PartnerProfileSummaryImplCopyWithImpl(
    _$PartnerProfileSummaryImpl _value,
    $Res Function(_$PartnerProfileSummaryImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of PartnerProfileSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? businessName = null,
    Object? type = null,
    Object? isVerified = null,
    Object? isAvailable = null,
    Object? isGeneralResponder = null,
    Object? city = freezed,
    Object? description = freezed,
    Object? contactPerson1Name = freezed,
    Object? contactPerson1Mobile = freezed,
    Object? contactPerson2Name = freezed,
    Object? contactPerson2Mobile = freezed,
    Object? businessMobile = freezed,
    Object? businessEmail = freezed,
    Object? addressLine = freezed,
    Object? area = freezed,
    Object? pincode = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? governmentIdType = freezed,
    Object? governmentIdNumber = freezed,
    Object? workingHours = freezed,
    Object? serviceRadiusKm = freezed,
    Object? yearsOfExperience = freezed,
    Object? verificationStatus = freezed,
    Object? rejectionReason = freezed,
    Object? reviewNote = freezed,
    Object? submittedAt = freezed,
    Object? reviewedAt = freezed,
    Object? profilePhotoUrl = freezed,
    Object? shopPhotoUrls = null,
    Object? identityDocumentUrl = freezed,
    Object? businessDocumentUrl = freezed,
    Object? ratingAvg = null,
    Object? ratingCount = null,
  }) {
    return _then(
      _$PartnerProfileSummaryImpl(
        businessName: null == businessName
            ? _value.businessName
            : businessName // ignore: cast_nullable_to_non_nullable
                  as String,
        type: null == type
            ? _value.type
            : type // ignore: cast_nullable_to_non_nullable
                  as String,
        isVerified: null == isVerified
            ? _value.isVerified
            : isVerified // ignore: cast_nullable_to_non_nullable
                  as bool,
        isAvailable: null == isAvailable
            ? _value.isAvailable
            : isAvailable // ignore: cast_nullable_to_non_nullable
                  as bool,
        isGeneralResponder: null == isGeneralResponder
            ? _value.isGeneralResponder
            : isGeneralResponder // ignore: cast_nullable_to_non_nullable
                  as bool,
        city: freezed == city
            ? _value.city
            : city // ignore: cast_nullable_to_non_nullable
                  as String?,
        description: freezed == description
            ? _value.description
            : description // ignore: cast_nullable_to_non_nullable
                  as String?,
        contactPerson1Name: freezed == contactPerson1Name
            ? _value.contactPerson1Name
            : contactPerson1Name // ignore: cast_nullable_to_non_nullable
                  as String?,
        contactPerson1Mobile: freezed == contactPerson1Mobile
            ? _value.contactPerson1Mobile
            : contactPerson1Mobile // ignore: cast_nullable_to_non_nullable
                  as String?,
        contactPerson2Name: freezed == contactPerson2Name
            ? _value.contactPerson2Name
            : contactPerson2Name // ignore: cast_nullable_to_non_nullable
                  as String?,
        contactPerson2Mobile: freezed == contactPerson2Mobile
            ? _value.contactPerson2Mobile
            : contactPerson2Mobile // ignore: cast_nullable_to_non_nullable
                  as String?,
        businessMobile: freezed == businessMobile
            ? _value.businessMobile
            : businessMobile // ignore: cast_nullable_to_non_nullable
                  as String?,
        businessEmail: freezed == businessEmail
            ? _value.businessEmail
            : businessEmail // ignore: cast_nullable_to_non_nullable
                  as String?,
        addressLine: freezed == addressLine
            ? _value.addressLine
            : addressLine // ignore: cast_nullable_to_non_nullable
                  as String?,
        area: freezed == area
            ? _value.area
            : area // ignore: cast_nullable_to_non_nullable
                  as String?,
        pincode: freezed == pincode
            ? _value.pincode
            : pincode // ignore: cast_nullable_to_non_nullable
                  as String?,
        latitude: freezed == latitude
            ? _value.latitude
            : latitude // ignore: cast_nullable_to_non_nullable
                  as double?,
        longitude: freezed == longitude
            ? _value.longitude
            : longitude // ignore: cast_nullable_to_non_nullable
                  as double?,
        governmentIdType: freezed == governmentIdType
            ? _value.governmentIdType
            : governmentIdType // ignore: cast_nullable_to_non_nullable
                  as String?,
        governmentIdNumber: freezed == governmentIdNumber
            ? _value.governmentIdNumber
            : governmentIdNumber // ignore: cast_nullable_to_non_nullable
                  as String?,
        workingHours: freezed == workingHours
            ? _value.workingHours
            : workingHours // ignore: cast_nullable_to_non_nullable
                  as String?,
        serviceRadiusKm: freezed == serviceRadiusKm
            ? _value.serviceRadiusKm
            : serviceRadiusKm // ignore: cast_nullable_to_non_nullable
                  as int?,
        yearsOfExperience: freezed == yearsOfExperience
            ? _value.yearsOfExperience
            : yearsOfExperience // ignore: cast_nullable_to_non_nullable
                  as int?,
        verificationStatus: freezed == verificationStatus
            ? _value.verificationStatus
            : verificationStatus // ignore: cast_nullable_to_non_nullable
                  as String?,
        rejectionReason: freezed == rejectionReason
            ? _value.rejectionReason
            : rejectionReason // ignore: cast_nullable_to_non_nullable
                  as String?,
        reviewNote: freezed == reviewNote
            ? _value.reviewNote
            : reviewNote // ignore: cast_nullable_to_non_nullable
                  as String?,
        submittedAt: freezed == submittedAt
            ? _value.submittedAt
            : submittedAt // ignore: cast_nullable_to_non_nullable
                  as String?,
        reviewedAt: freezed == reviewedAt
            ? _value.reviewedAt
            : reviewedAt // ignore: cast_nullable_to_non_nullable
                  as String?,
        profilePhotoUrl: freezed == profilePhotoUrl
            ? _value.profilePhotoUrl
            : profilePhotoUrl // ignore: cast_nullable_to_non_nullable
                  as String?,
        shopPhotoUrls: null == shopPhotoUrls
            ? _value._shopPhotoUrls
            : shopPhotoUrls // ignore: cast_nullable_to_non_nullable
                  as List<String>,
        identityDocumentUrl: freezed == identityDocumentUrl
            ? _value.identityDocumentUrl
            : identityDocumentUrl // ignore: cast_nullable_to_non_nullable
                  as String?,
        businessDocumentUrl: freezed == businessDocumentUrl
            ? _value.businessDocumentUrl
            : businessDocumentUrl // ignore: cast_nullable_to_non_nullable
                  as String?,
        ratingAvg: null == ratingAvg
            ? _value.ratingAvg
            : ratingAvg // ignore: cast_nullable_to_non_nullable
                  as double,
        ratingCount: null == ratingCount
            ? _value.ratingCount
            : ratingCount // ignore: cast_nullable_to_non_nullable
                  as int,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$PartnerProfileSummaryImpl implements _PartnerProfileSummary {
  const _$PartnerProfileSummaryImpl({
    required this.businessName,
    required this.type,
    required this.isVerified,
    required this.isAvailable,
    required this.isGeneralResponder,
    this.city,
    this.description,
    this.contactPerson1Name,
    this.contactPerson1Mobile,
    this.contactPerson2Name,
    this.contactPerson2Mobile,
    this.businessMobile,
    this.businessEmail,
    this.addressLine,
    this.area,
    this.pincode,
    this.latitude,
    this.longitude,
    this.governmentIdType,
    this.governmentIdNumber,
    this.workingHours,
    this.serviceRadiusKm,
    this.yearsOfExperience,
    this.verificationStatus,
    this.rejectionReason,
    this.reviewNote,
    this.submittedAt,
    this.reviewedAt,
    this.profilePhotoUrl,
    final List<String> shopPhotoUrls = const [],
    this.identityDocumentUrl,
    this.businessDocumentUrl,
    this.ratingAvg = 0,
    this.ratingCount = 0,
  }) : _shopPhotoUrls = shopPhotoUrls;

  factory _$PartnerProfileSummaryImpl.fromJson(Map<String, dynamic> json) =>
      _$$PartnerProfileSummaryImplFromJson(json);

  @override
  final String businessName;
  @override
  final String type;
  @override
  final bool isVerified;
  @override
  final bool isAvailable;
  @override
  final bool isGeneralResponder;
  @override
  final String? city;
  @override
  final String? description;
  @override
  final String? contactPerson1Name;
  @override
  final String? contactPerson1Mobile;
  @override
  final String? contactPerson2Name;
  @override
  final String? contactPerson2Mobile;
  @override
  final String? businessMobile;
  @override
  final String? businessEmail;
  @override
  final String? addressLine;
  @override
  final String? area;
  @override
  final String? pincode;
  @override
  final double? latitude;
  @override
  final double? longitude;
  @override
  final String? governmentIdType;
  @override
  final String? governmentIdNumber;
  // --- §6 (OPERATIONS) ---
  @override
  final String? workingHours;
  @override
  final int? serviceRadiusKm;
  @override
  final int? yearsOfExperience;
  // --- ADR-046b: application/verification state ---
  @override
  final String? verificationStatus;
  @override
  final String? rejectionReason;
  @override
  final String? reviewNote;
  @override
  final String? submittedAt;
  @override
  final String? reviewedAt;
  @override
  final String? profilePhotoUrl;
  final List<String> _shopPhotoUrls;
  @override
  @JsonKey()
  List<String> get shopPhotoUrls {
    if (_shopPhotoUrls is EqualUnmodifiableListView) return _shopPhotoUrls;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_shopPhotoUrls);
  }

  @override
  final String? identityDocumentUrl;
  @override
  final String? businessDocumentUrl;
  // --- §25 - aggregates for the discovery card and reviews section ---
  @override
  @JsonKey()
  final double ratingAvg;
  @override
  @JsonKey()
  final int ratingCount;

  @override
  String toString() {
    return 'PartnerProfileSummary(businessName: $businessName, type: $type, isVerified: $isVerified, isAvailable: $isAvailable, isGeneralResponder: $isGeneralResponder, city: $city, description: $description, contactPerson1Name: $contactPerson1Name, contactPerson1Mobile: $contactPerson1Mobile, contactPerson2Name: $contactPerson2Name, contactPerson2Mobile: $contactPerson2Mobile, businessMobile: $businessMobile, businessEmail: $businessEmail, addressLine: $addressLine, area: $area, pincode: $pincode, latitude: $latitude, longitude: $longitude, governmentIdType: $governmentIdType, governmentIdNumber: $governmentIdNumber, workingHours: $workingHours, serviceRadiusKm: $serviceRadiusKm, yearsOfExperience: $yearsOfExperience, verificationStatus: $verificationStatus, rejectionReason: $rejectionReason, reviewNote: $reviewNote, submittedAt: $submittedAt, reviewedAt: $reviewedAt, profilePhotoUrl: $profilePhotoUrl, shopPhotoUrls: $shopPhotoUrls, identityDocumentUrl: $identityDocumentUrl, businessDocumentUrl: $businessDocumentUrl, ratingAvg: $ratingAvg, ratingCount: $ratingCount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PartnerProfileSummaryImpl &&
            (identical(other.businessName, businessName) ||
                other.businessName == businessName) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.isVerified, isVerified) ||
                other.isVerified == isVerified) &&
            (identical(other.isAvailable, isAvailable) ||
                other.isAvailable == isAvailable) &&
            (identical(other.isGeneralResponder, isGeneralResponder) ||
                other.isGeneralResponder == isGeneralResponder) &&
            (identical(other.city, city) || other.city == city) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.contactPerson1Name, contactPerson1Name) ||
                other.contactPerson1Name == contactPerson1Name) &&
            (identical(other.contactPerson1Mobile, contactPerson1Mobile) ||
                other.contactPerson1Mobile == contactPerson1Mobile) &&
            (identical(other.contactPerson2Name, contactPerson2Name) ||
                other.contactPerson2Name == contactPerson2Name) &&
            (identical(other.contactPerson2Mobile, contactPerson2Mobile) ||
                other.contactPerson2Mobile == contactPerson2Mobile) &&
            (identical(other.businessMobile, businessMobile) ||
                other.businessMobile == businessMobile) &&
            (identical(other.businessEmail, businessEmail) ||
                other.businessEmail == businessEmail) &&
            (identical(other.addressLine, addressLine) ||
                other.addressLine == addressLine) &&
            (identical(other.area, area) || other.area == area) &&
            (identical(other.pincode, pincode) || other.pincode == pincode) &&
            (identical(other.latitude, latitude) ||
                other.latitude == latitude) &&
            (identical(other.longitude, longitude) ||
                other.longitude == longitude) &&
            (identical(other.governmentIdType, governmentIdType) ||
                other.governmentIdType == governmentIdType) &&
            (identical(other.governmentIdNumber, governmentIdNumber) ||
                other.governmentIdNumber == governmentIdNumber) &&
            (identical(other.workingHours, workingHours) ||
                other.workingHours == workingHours) &&
            (identical(other.serviceRadiusKm, serviceRadiusKm) ||
                other.serviceRadiusKm == serviceRadiusKm) &&
            (identical(other.yearsOfExperience, yearsOfExperience) ||
                other.yearsOfExperience == yearsOfExperience) &&
            (identical(other.verificationStatus, verificationStatus) ||
                other.verificationStatus == verificationStatus) &&
            (identical(other.rejectionReason, rejectionReason) ||
                other.rejectionReason == rejectionReason) &&
            (identical(other.reviewNote, reviewNote) ||
                other.reviewNote == reviewNote) &&
            (identical(other.submittedAt, submittedAt) ||
                other.submittedAt == submittedAt) &&
            (identical(other.reviewedAt, reviewedAt) ||
                other.reviewedAt == reviewedAt) &&
            (identical(other.profilePhotoUrl, profilePhotoUrl) ||
                other.profilePhotoUrl == profilePhotoUrl) &&
            const DeepCollectionEquality().equals(
              other._shopPhotoUrls,
              _shopPhotoUrls,
            ) &&
            (identical(other.identityDocumentUrl, identityDocumentUrl) ||
                other.identityDocumentUrl == identityDocumentUrl) &&
            (identical(other.businessDocumentUrl, businessDocumentUrl) ||
                other.businessDocumentUrl == businessDocumentUrl) &&
            (identical(other.ratingAvg, ratingAvg) ||
                other.ratingAvg == ratingAvg) &&
            (identical(other.ratingCount, ratingCount) ||
                other.ratingCount == ratingCount));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hashAll([
    runtimeType,
    businessName,
    type,
    isVerified,
    isAvailable,
    isGeneralResponder,
    city,
    description,
    contactPerson1Name,
    contactPerson1Mobile,
    contactPerson2Name,
    contactPerson2Mobile,
    businessMobile,
    businessEmail,
    addressLine,
    area,
    pincode,
    latitude,
    longitude,
    governmentIdType,
    governmentIdNumber,
    workingHours,
    serviceRadiusKm,
    yearsOfExperience,
    verificationStatus,
    rejectionReason,
    reviewNote,
    submittedAt,
    reviewedAt,
    profilePhotoUrl,
    const DeepCollectionEquality().hash(_shopPhotoUrls),
    identityDocumentUrl,
    businessDocumentUrl,
    ratingAvg,
    ratingCount,
  ]);

  /// Create a copy of PartnerProfileSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PartnerProfileSummaryImplCopyWith<_$PartnerProfileSummaryImpl>
  get copyWith =>
      __$$PartnerProfileSummaryImplCopyWithImpl<_$PartnerProfileSummaryImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$PartnerProfileSummaryImplToJson(this);
  }
}

abstract class _PartnerProfileSummary implements PartnerProfileSummary {
  const factory _PartnerProfileSummary({
    required final String businessName,
    required final String type,
    required final bool isVerified,
    required final bool isAvailable,
    required final bool isGeneralResponder,
    final String? city,
    final String? description,
    final String? contactPerson1Name,
    final String? contactPerson1Mobile,
    final String? contactPerson2Name,
    final String? contactPerson2Mobile,
    final String? businessMobile,
    final String? businessEmail,
    final String? addressLine,
    final String? area,
    final String? pincode,
    final double? latitude,
    final double? longitude,
    final String? governmentIdType,
    final String? governmentIdNumber,
    final String? workingHours,
    final int? serviceRadiusKm,
    final int? yearsOfExperience,
    final String? verificationStatus,
    final String? rejectionReason,
    final String? reviewNote,
    final String? submittedAt,
    final String? reviewedAt,
    final String? profilePhotoUrl,
    final List<String> shopPhotoUrls,
    final String? identityDocumentUrl,
    final String? businessDocumentUrl,
    final double ratingAvg,
    final int ratingCount,
  }) = _$PartnerProfileSummaryImpl;

  factory _PartnerProfileSummary.fromJson(Map<String, dynamic> json) =
      _$PartnerProfileSummaryImpl.fromJson;

  @override
  String get businessName;
  @override
  String get type;
  @override
  bool get isVerified;
  @override
  bool get isAvailable;
  @override
  bool get isGeneralResponder;
  @override
  String? get city;
  @override
  String? get description;
  @override
  String? get contactPerson1Name;
  @override
  String? get contactPerson1Mobile;
  @override
  String? get contactPerson2Name;
  @override
  String? get contactPerson2Mobile;
  @override
  String? get businessMobile;
  @override
  String? get businessEmail;
  @override
  String? get addressLine;
  @override
  String? get area;
  @override
  String? get pincode;
  @override
  double? get latitude;
  @override
  double? get longitude;
  @override
  String? get governmentIdType;
  @override
  String? get governmentIdNumber; // --- §6 (OPERATIONS) ---
  @override
  String? get workingHours;
  @override
  int? get serviceRadiusKm;
  @override
  int? get yearsOfExperience; // --- ADR-046b: application/verification state ---
  @override
  String? get verificationStatus;
  @override
  String? get rejectionReason;
  @override
  String? get reviewNote;
  @override
  String? get submittedAt;
  @override
  String? get reviewedAt;
  @override
  String? get profilePhotoUrl;
  @override
  List<String> get shopPhotoUrls;
  @override
  String? get identityDocumentUrl;
  @override
  String? get businessDocumentUrl; // --- §25 - aggregates for the discovery card and reviews section ---
  @override
  double get ratingAvg;
  @override
  int get ratingCount;

  /// Create a copy of PartnerProfileSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PartnerProfileSummaryImplCopyWith<_$PartnerProfileSummaryImpl>
  get copyWith => throw _privateConstructorUsedError;
}

PartnerApplication _$PartnerApplicationFromJson(Map<String, dynamic> json) {
  return _PartnerApplication.fromJson(json);
}

/// @nodoc
mixin _$PartnerApplication {
  String get status => throw _privateConstructorUsedError;
  PartnerProfileSummary? get profile => throw _privateConstructorUsedError;

  /// Serializes this PartnerApplication to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of PartnerApplication
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $PartnerApplicationCopyWith<PartnerApplication> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PartnerApplicationCopyWith<$Res> {
  factory $PartnerApplicationCopyWith(
    PartnerApplication value,
    $Res Function(PartnerApplication) then,
  ) = _$PartnerApplicationCopyWithImpl<$Res, PartnerApplication>;
  @useResult
  $Res call({String status, PartnerProfileSummary? profile});

  $PartnerProfileSummaryCopyWith<$Res>? get profile;
}

/// @nodoc
class _$PartnerApplicationCopyWithImpl<$Res, $Val extends PartnerApplication>
    implements $PartnerApplicationCopyWith<$Res> {
  _$PartnerApplicationCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of PartnerApplication
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? status = null, Object? profile = freezed}) {
    return _then(
      _value.copyWith(
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String,
            profile: freezed == profile
                ? _value.profile
                : profile // ignore: cast_nullable_to_non_nullable
                      as PartnerProfileSummary?,
          )
          as $Val,
    );
  }

  /// Create a copy of PartnerApplication
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $PartnerProfileSummaryCopyWith<$Res>? get profile {
    if (_value.profile == null) {
      return null;
    }

    return $PartnerProfileSummaryCopyWith<$Res>(_value.profile!, (value) {
      return _then(_value.copyWith(profile: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$PartnerApplicationImplCopyWith<$Res>
    implements $PartnerApplicationCopyWith<$Res> {
  factory _$$PartnerApplicationImplCopyWith(
    _$PartnerApplicationImpl value,
    $Res Function(_$PartnerApplicationImpl) then,
  ) = __$$PartnerApplicationImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String status, PartnerProfileSummary? profile});

  @override
  $PartnerProfileSummaryCopyWith<$Res>? get profile;
}

/// @nodoc
class __$$PartnerApplicationImplCopyWithImpl<$Res>
    extends _$PartnerApplicationCopyWithImpl<$Res, _$PartnerApplicationImpl>
    implements _$$PartnerApplicationImplCopyWith<$Res> {
  __$$PartnerApplicationImplCopyWithImpl(
    _$PartnerApplicationImpl _value,
    $Res Function(_$PartnerApplicationImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of PartnerApplication
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? status = null, Object? profile = freezed}) {
    return _then(
      _$PartnerApplicationImpl(
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
        profile: freezed == profile
            ? _value.profile
            : profile // ignore: cast_nullable_to_non_nullable
                  as PartnerProfileSummary?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$PartnerApplicationImpl implements _PartnerApplication {
  const _$PartnerApplicationImpl({required this.status, this.profile});

  factory _$PartnerApplicationImpl.fromJson(Map<String, dynamic> json) =>
      _$$PartnerApplicationImplFromJson(json);

  @override
  final String status;
  @override
  final PartnerProfileSummary? profile;

  @override
  String toString() {
    return 'PartnerApplication(status: $status, profile: $profile)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PartnerApplicationImpl &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.profile, profile) || other.profile == profile));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, status, profile);

  /// Create a copy of PartnerApplication
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PartnerApplicationImplCopyWith<_$PartnerApplicationImpl> get copyWith =>
      __$$PartnerApplicationImplCopyWithImpl<_$PartnerApplicationImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$PartnerApplicationImplToJson(this);
  }
}

abstract class _PartnerApplication implements PartnerApplication {
  const factory _PartnerApplication({
    required final String status,
    final PartnerProfileSummary? profile,
  }) = _$PartnerApplicationImpl;

  factory _PartnerApplication.fromJson(Map<String, dynamic> json) =
      _$PartnerApplicationImpl.fromJson;

  @override
  String get status;
  @override
  PartnerProfileSummary? get profile;

  /// Create a copy of PartnerApplication
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PartnerApplicationImplCopyWith<_$PartnerApplicationImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
