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
  String? get addressLine => throw _privateConstructorUsedError;
  String? get area => throw _privateConstructorUsedError;
  String? get pincode => throw _privateConstructorUsedError;
  double? get latitude => throw _privateConstructorUsedError;
  double? get longitude => throw _privateConstructorUsedError;
  String? get governmentIdType =>
      throw _privateConstructorUsedError; // "AADHAAR" | "PASSPORT"
  String? get governmentIdNumber =>
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
    String? addressLine,
    String? area,
    String? pincode,
    double? latitude,
    double? longitude,
    String? governmentIdType,
    String? governmentIdNumber,
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
    Object? addressLine = freezed,
    Object? area = freezed,
    Object? pincode = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? governmentIdType = freezed,
    Object? governmentIdNumber = freezed,
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
    String? addressLine,
    String? area,
    String? pincode,
    double? latitude,
    double? longitude,
    String? governmentIdType,
    String? governmentIdNumber,
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
    Object? addressLine = freezed,
    Object? area = freezed,
    Object? pincode = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? governmentIdType = freezed,
    Object? governmentIdNumber = freezed,
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
    this.addressLine,
    this.area,
    this.pincode,
    this.latitude,
    this.longitude,
    this.governmentIdType,
    this.governmentIdNumber,
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
  // --- ADR-044 ---
  @override
  final bool? isGeneralResponder;

  @override
  String toString() {
    return 'PartnerProfileInput(businessName: $businessName, type: $type, city: $city, description: $description, contactPerson1Name: $contactPerson1Name, contactPerson1Mobile: $contactPerson1Mobile, contactPerson2Name: $contactPerson2Name, contactPerson2Mobile: $contactPerson2Mobile, addressLine: $addressLine, area: $area, pincode: $pincode, latitude: $latitude, longitude: $longitude, governmentIdType: $governmentIdType, governmentIdNumber: $governmentIdNumber, isGeneralResponder: $isGeneralResponder)';
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
            (identical(other.isGeneralResponder, isGeneralResponder) ||
                other.isGeneralResponder == isGeneralResponder));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    businessName,
    type,
    city,
    description,
    contactPerson1Name,
    contactPerson1Mobile,
    contactPerson2Name,
    contactPerson2Mobile,
    addressLine,
    area,
    pincode,
    latitude,
    longitude,
    governmentIdType,
    governmentIdNumber,
    isGeneralResponder,
  );

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
    final String? addressLine,
    final String? area,
    final String? pincode,
    final double? latitude,
    final double? longitude,
    final String? governmentIdType,
    final String? governmentIdNumber,
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
  String? get governmentIdNumber; // --- ADR-044 ---
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
  String? get addressLine => throw _privateConstructorUsedError;
  String? get area => throw _privateConstructorUsedError;
  String? get pincode => throw _privateConstructorUsedError;
  double? get latitude => throw _privateConstructorUsedError;
  double? get longitude => throw _privateConstructorUsedError;
  String? get governmentIdType => throw _privateConstructorUsedError;
  String? get governmentIdNumber => throw _privateConstructorUsedError;

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
    String? addressLine,
    String? area,
    String? pincode,
    double? latitude,
    double? longitude,
    String? governmentIdType,
    String? governmentIdNumber,
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
    Object? addressLine = freezed,
    Object? area = freezed,
    Object? pincode = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? governmentIdType = freezed,
    Object? governmentIdNumber = freezed,
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
    String? addressLine,
    String? area,
    String? pincode,
    double? latitude,
    double? longitude,
    String? governmentIdType,
    String? governmentIdNumber,
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
    Object? addressLine = freezed,
    Object? area = freezed,
    Object? pincode = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? governmentIdType = freezed,
    Object? governmentIdNumber = freezed,
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
    this.addressLine,
    this.area,
    this.pincode,
    this.latitude,
    this.longitude,
    this.governmentIdType,
    this.governmentIdNumber,
  });

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

  @override
  String toString() {
    return 'PartnerProfileSummary(businessName: $businessName, type: $type, isVerified: $isVerified, isAvailable: $isAvailable, isGeneralResponder: $isGeneralResponder, city: $city, description: $description, contactPerson1Name: $contactPerson1Name, contactPerson1Mobile: $contactPerson1Mobile, contactPerson2Name: $contactPerson2Name, contactPerson2Mobile: $contactPerson2Mobile, addressLine: $addressLine, area: $area, pincode: $pincode, latitude: $latitude, longitude: $longitude, governmentIdType: $governmentIdType, governmentIdNumber: $governmentIdNumber)';
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
                other.governmentIdNumber == governmentIdNumber));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
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
    addressLine,
    area,
    pincode,
    latitude,
    longitude,
    governmentIdType,
    governmentIdNumber,
  );

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
    final String? addressLine,
    final String? area,
    final String? pincode,
    final double? latitude,
    final double? longitude,
    final String? governmentIdType,
    final String? governmentIdNumber,
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
  String? get governmentIdNumber;

  /// Create a copy of PartnerProfileSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PartnerProfileSummaryImplCopyWith<_$PartnerProfileSummaryImpl>
  get copyWith => throw _privateConstructorUsedError;
}
