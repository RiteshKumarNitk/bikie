// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'rider_profile_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

EmergencyContactInput _$EmergencyContactInputFromJson(
  Map<String, dynamic> json,
) {
  return _EmergencyContactInput.fromJson(json);
}

/// @nodoc
mixin _$EmergencyContactInput {
  String get name => throw _privateConstructorUsedError;
  String get phone => throw _privateConstructorUsedError;
  String? get email => throw _privateConstructorUsedError;
  String? get relation => throw _privateConstructorUsedError;

  /// Serializes this EmergencyContactInput to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of EmergencyContactInput
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $EmergencyContactInputCopyWith<EmergencyContactInput> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EmergencyContactInputCopyWith<$Res> {
  factory $EmergencyContactInputCopyWith(
    EmergencyContactInput value,
    $Res Function(EmergencyContactInput) then,
  ) = _$EmergencyContactInputCopyWithImpl<$Res, EmergencyContactInput>;
  @useResult
  $Res call({String name, String phone, String? email, String? relation});
}

/// @nodoc
class _$EmergencyContactInputCopyWithImpl<
  $Res,
  $Val extends EmergencyContactInput
>
    implements $EmergencyContactInputCopyWith<$Res> {
  _$EmergencyContactInputCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of EmergencyContactInput
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? phone = null,
    Object? email = freezed,
    Object? relation = freezed,
  }) {
    return _then(
      _value.copyWith(
            name: null == name
                ? _value.name
                : name // ignore: cast_nullable_to_non_nullable
                      as String,
            phone: null == phone
                ? _value.phone
                : phone // ignore: cast_nullable_to_non_nullable
                      as String,
            email: freezed == email
                ? _value.email
                : email // ignore: cast_nullable_to_non_nullable
                      as String?,
            relation: freezed == relation
                ? _value.relation
                : relation // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$EmergencyContactInputImplCopyWith<$Res>
    implements $EmergencyContactInputCopyWith<$Res> {
  factory _$$EmergencyContactInputImplCopyWith(
    _$EmergencyContactInputImpl value,
    $Res Function(_$EmergencyContactInputImpl) then,
  ) = __$$EmergencyContactInputImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String name, String phone, String? email, String? relation});
}

/// @nodoc
class __$$EmergencyContactInputImplCopyWithImpl<$Res>
    extends
        _$EmergencyContactInputCopyWithImpl<$Res, _$EmergencyContactInputImpl>
    implements _$$EmergencyContactInputImplCopyWith<$Res> {
  __$$EmergencyContactInputImplCopyWithImpl(
    _$EmergencyContactInputImpl _value,
    $Res Function(_$EmergencyContactInputImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EmergencyContactInput
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? phone = null,
    Object? email = freezed,
    Object? relation = freezed,
  }) {
    return _then(
      _$EmergencyContactInputImpl(
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        phone: null == phone
            ? _value.phone
            : phone // ignore: cast_nullable_to_non_nullable
                  as String,
        email: freezed == email
            ? _value.email
            : email // ignore: cast_nullable_to_non_nullable
                  as String?,
        relation: freezed == relation
            ? _value.relation
            : relation // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$EmergencyContactInputImpl implements _EmergencyContactInput {
  const _$EmergencyContactInputImpl({
    required this.name,
    required this.phone,
    this.email,
    this.relation,
  });

  factory _$EmergencyContactInputImpl.fromJson(Map<String, dynamic> json) =>
      _$$EmergencyContactInputImplFromJson(json);

  @override
  final String name;
  @override
  final String phone;
  @override
  final String? email;
  @override
  final String? relation;

  @override
  String toString() {
    return 'EmergencyContactInput(name: $name, phone: $phone, email: $email, relation: $relation)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$EmergencyContactInputImpl &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.phone, phone) || other.phone == phone) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.relation, relation) ||
                other.relation == relation));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, name, phone, email, relation);

  /// Create a copy of EmergencyContactInput
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$EmergencyContactInputImplCopyWith<_$EmergencyContactInputImpl>
  get copyWith =>
      __$$EmergencyContactInputImplCopyWithImpl<_$EmergencyContactInputImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$EmergencyContactInputImplToJson(this);
  }
}

abstract class _EmergencyContactInput implements EmergencyContactInput {
  const factory _EmergencyContactInput({
    required String name,
    required String phone,
    String? email,
    String? relation,
  }) = _$EmergencyContactInputImpl;

  factory _EmergencyContactInput.fromJson(Map<String, dynamic> json) =
      _$EmergencyContactInputImpl.fromJson;

  @override
  String get name;
  @override
  String get phone;
  @override
  String? get email;
  @override
  String? get relation;

  /// Create a copy of EmergencyContactInput
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$EmergencyContactInputImplCopyWith<_$EmergencyContactInputImpl>
  get copyWith => throw _privateConstructorUsedError;
}

RiderProfileInput _$RiderProfileInputFromJson(Map<String, dynamic> json) {
  return _RiderProfileInput.fromJson(json);
}

/// @nodoc
mixin _$RiderProfileInput {
  String? get drivingLicenceNumber => throw _privateConstructorUsedError;
  String? get drivingLicenceExpiry =>
      throw _privateConstructorUsedError; // ISO-8601
  String? get addressLine => throw _privateConstructorUsedError;
  String? get area => throw _privateConstructorUsedError;
  String? get district => throw _privateConstructorUsedError;
  String? get pincode => throw _privateConstructorUsedError;
  String? get country => throw _privateConstructorUsedError;
  String? get fatherName => throw _privateConstructorUsedError;
  String? get motherName => throw _privateConstructorUsedError;
  String? get dateOfBirth => throw _privateConstructorUsedError; // ISO-8601
  String? get gender => throw _privateConstructorUsedError;
  String? get bloodGroup => throw _privateConstructorUsedError;
  String? get medicalHistory => throw _privateConstructorUsedError;
  String? get allergies => throw _privateConstructorUsedError;
  String? get vehicleType => throw _privateConstructorUsedError;
  String? get vehicleBrand => throw _privateConstructorUsedError;
  String? get vehicleModel => throw _privateConstructorUsedError;
  String? get vehicleRegistrationNumber => throw _privateConstructorUsedError;
  String? get governmentIdType =>
      throw _privateConstructorUsedError; // "AADHAAR" | "PASSPORT"
  String? get governmentIdNumber => throw _privateConstructorUsedError;
  String? get riderFrequency =>
      throw _privateConstructorUsedError; // "OCCASIONAL" | "WEEKLY" | "DAILY"
  String? get ridingClubType =>
      throw _privateConstructorUsedError; // "SOLO" | "CLUB_MEMBER"
  String? get clubName => throw _privateConstructorUsedError;
  List<EmergencyContactInput> get emergencyContacts =>
      throw _privateConstructorUsedError;

  /// Serializes this RiderProfileInput to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of RiderProfileInput
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $RiderProfileInputCopyWith<RiderProfileInput> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $RiderProfileInputCopyWith<$Res> {
  factory $RiderProfileInputCopyWith(
    RiderProfileInput value,
    $Res Function(RiderProfileInput) then,
  ) = _$RiderProfileInputCopyWithImpl<$Res, RiderProfileInput>;
  @useResult
  $Res call({
    String? drivingLicenceNumber,
    String? drivingLicenceExpiry,
    String? addressLine,
    String? area,
    String? district,
    String? pincode,
    String? country,
    String? fatherName,
    String? motherName,
    String? dateOfBirth,
    String? gender,
    String? bloodGroup,
    String? medicalHistory,
    String? allergies,
    String? vehicleType,
    String? vehicleBrand,
    String? vehicleModel,
    String? vehicleRegistrationNumber,
    String? governmentIdType,
    String? governmentIdNumber,
    String? riderFrequency,
    String? ridingClubType,
    String? clubName,
    List<EmergencyContactInput> emergencyContacts,
  });
}

/// @nodoc
class _$RiderProfileInputCopyWithImpl<$Res, $Val extends RiderProfileInput>
    implements $RiderProfileInputCopyWith<$Res> {
  _$RiderProfileInputCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of RiderProfileInput
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? drivingLicenceNumber = freezed,
    Object? drivingLicenceExpiry = freezed,
    Object? addressLine = freezed,
    Object? area = freezed,
    Object? district = freezed,
    Object? pincode = freezed,
    Object? country = freezed,
    Object? fatherName = freezed,
    Object? motherName = freezed,
    Object? dateOfBirth = freezed,
    Object? gender = freezed,
    Object? bloodGroup = freezed,
    Object? medicalHistory = freezed,
    Object? allergies = freezed,
    Object? vehicleType = freezed,
    Object? vehicleBrand = freezed,
    Object? vehicleModel = freezed,
    Object? vehicleRegistrationNumber = freezed,
    Object? governmentIdType = freezed,
    Object? governmentIdNumber = freezed,
    Object? riderFrequency = freezed,
    Object? ridingClubType = freezed,
    Object? clubName = freezed,
    Object? emergencyContacts = null,
  }) {
    return _then(
      _value.copyWith(
            drivingLicenceNumber: freezed == drivingLicenceNumber
                ? _value.drivingLicenceNumber
                : drivingLicenceNumber // ignore: cast_nullable_to_non_nullable
                      as String?,
            drivingLicenceExpiry: freezed == drivingLicenceExpiry
                ? _value.drivingLicenceExpiry
                : drivingLicenceExpiry // ignore: cast_nullable_to_non_nullable
                      as String?,
            addressLine: freezed == addressLine
                ? _value.addressLine
                : addressLine // ignore: cast_nullable_to_non_nullable
                      as String?,
            area: freezed == area
                ? _value.area
                : area // ignore: cast_nullable_to_non_nullable
                      as String?,
            district: freezed == district
                ? _value.district
                : district // ignore: cast_nullable_to_non_nullable
                      as String?,
            pincode: freezed == pincode
                ? _value.pincode
                : pincode // ignore: cast_nullable_to_non_nullable
                      as String?,
            country: freezed == country
                ? _value.country
                : country // ignore: cast_nullable_to_non_nullable
                      as String?,
            fatherName: freezed == fatherName
                ? _value.fatherName
                : fatherName // ignore: cast_nullable_to_non_nullable
                      as String?,
            motherName: freezed == motherName
                ? _value.motherName
                : motherName // ignore: cast_nullable_to_non_nullable
                      as String?,
            dateOfBirth: freezed == dateOfBirth
                ? _value.dateOfBirth
                : dateOfBirth // ignore: cast_nullable_to_non_nullable
                      as String?,
            gender: freezed == gender
                ? _value.gender
                : gender // ignore: cast_nullable_to_non_nullable
                      as String?,
            bloodGroup: freezed == bloodGroup
                ? _value.bloodGroup
                : bloodGroup // ignore: cast_nullable_to_non_nullable
                      as String?,
            medicalHistory: freezed == medicalHistory
                ? _value.medicalHistory
                : medicalHistory // ignore: cast_nullable_to_non_nullable
                      as String?,
            allergies: freezed == allergies
                ? _value.allergies
                : allergies // ignore: cast_nullable_to_non_nullable
                      as String?,
            vehicleType: freezed == vehicleType
                ? _value.vehicleType
                : vehicleType // ignore: cast_nullable_to_non_nullable
                      as String?,
            vehicleBrand: freezed == vehicleBrand
                ? _value.vehicleBrand
                : vehicleBrand // ignore: cast_nullable_to_non_nullable
                      as String?,
            vehicleModel: freezed == vehicleModel
                ? _value.vehicleModel
                : vehicleModel // ignore: cast_nullable_to_non_nullable
                      as String?,
            vehicleRegistrationNumber: freezed == vehicleRegistrationNumber
                ? _value.vehicleRegistrationNumber
                : vehicleRegistrationNumber // ignore: cast_nullable_to_non_nullable
                      as String?,
            governmentIdType: freezed == governmentIdType
                ? _value.governmentIdType
                : governmentIdType // ignore: cast_nullable_to_non_nullable
                      as String?,
            governmentIdNumber: freezed == governmentIdNumber
                ? _value.governmentIdNumber
                : governmentIdNumber // ignore: cast_nullable_to_non_nullable
                      as String?,
            riderFrequency: freezed == riderFrequency
                ? _value.riderFrequency
                : riderFrequency // ignore: cast_nullable_to_non_nullable
                      as String?,
            ridingClubType: freezed == ridingClubType
                ? _value.ridingClubType
                : ridingClubType // ignore: cast_nullable_to_non_nullable
                      as String?,
            clubName: freezed == clubName
                ? _value.clubName
                : clubName // ignore: cast_nullable_to_non_nullable
                      as String?,
            emergencyContacts: null == emergencyContacts
                ? _value.emergencyContacts
                : emergencyContacts // ignore: cast_nullable_to_non_nullable
                      as List<EmergencyContactInput>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$RiderProfileInputImplCopyWith<$Res>
    implements $RiderProfileInputCopyWith<$Res> {
  factory _$$RiderProfileInputImplCopyWith(
    _$RiderProfileInputImpl value,
    $Res Function(_$RiderProfileInputImpl) then,
  ) = __$$RiderProfileInputImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String? drivingLicenceNumber,
    String? drivingLicenceExpiry,
    String? addressLine,
    String? area,
    String? district,
    String? pincode,
    String? country,
    String? fatherName,
    String? motherName,
    String? dateOfBirth,
    String? gender,
    String? bloodGroup,
    String? medicalHistory,
    String? allergies,
    String? vehicleType,
    String? vehicleBrand,
    String? vehicleModel,
    String? vehicleRegistrationNumber,
    String? governmentIdType,
    String? governmentIdNumber,
    String? riderFrequency,
    String? ridingClubType,
    String? clubName,
    List<EmergencyContactInput> emergencyContacts,
  });
}

/// @nodoc
class __$$RiderProfileInputImplCopyWithImpl<$Res>
    extends _$RiderProfileInputCopyWithImpl<$Res, _$RiderProfileInputImpl>
    implements _$$RiderProfileInputImplCopyWith<$Res> {
  __$$RiderProfileInputImplCopyWithImpl(
    _$RiderProfileInputImpl _value,
    $Res Function(_$RiderProfileInputImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of RiderProfileInput
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? drivingLicenceNumber = freezed,
    Object? drivingLicenceExpiry = freezed,
    Object? addressLine = freezed,
    Object? area = freezed,
    Object? district = freezed,
    Object? pincode = freezed,
    Object? country = freezed,
    Object? fatherName = freezed,
    Object? motherName = freezed,
    Object? dateOfBirth = freezed,
    Object? gender = freezed,
    Object? bloodGroup = freezed,
    Object? medicalHistory = freezed,
    Object? allergies = freezed,
    Object? vehicleType = freezed,
    Object? vehicleBrand = freezed,
    Object? vehicleModel = freezed,
    Object? vehicleRegistrationNumber = freezed,
    Object? governmentIdType = freezed,
    Object? governmentIdNumber = freezed,
    Object? riderFrequency = freezed,
    Object? ridingClubType = freezed,
    Object? clubName = freezed,
    Object? emergencyContacts = null,
  }) {
    return _then(
      _$RiderProfileInputImpl(
        drivingLicenceNumber: freezed == drivingLicenceNumber
            ? _value.drivingLicenceNumber
            : drivingLicenceNumber // ignore: cast_nullable_to_non_nullable
                  as String?,
        drivingLicenceExpiry: freezed == drivingLicenceExpiry
            ? _value.drivingLicenceExpiry
            : drivingLicenceExpiry // ignore: cast_nullable_to_non_nullable
                  as String?,
        addressLine: freezed == addressLine
            ? _value.addressLine
            : addressLine // ignore: cast_nullable_to_non_nullable
                  as String?,
        area: freezed == area
            ? _value.area
            : area // ignore: cast_nullable_to_non_nullable
                  as String?,
        district: freezed == district
            ? _value.district
            : district // ignore: cast_nullable_to_non_nullable
                  as String?,
        pincode: freezed == pincode
            ? _value.pincode
            : pincode // ignore: cast_nullable_to_non_nullable
                  as String?,
        country: freezed == country
            ? _value.country
            : country // ignore: cast_nullable_to_non_nullable
                  as String?,
        fatherName: freezed == fatherName
            ? _value.fatherName
            : fatherName // ignore: cast_nullable_to_non_nullable
                  as String?,
        motherName: freezed == motherName
            ? _value.motherName
            : motherName // ignore: cast_nullable_to_non_nullable
                  as String?,
        dateOfBirth: freezed == dateOfBirth
            ? _value.dateOfBirth
            : dateOfBirth // ignore: cast_nullable_to_non_nullable
                  as String?,
        gender: freezed == gender
            ? _value.gender
            : gender // ignore: cast_nullable_to_non_nullable
                  as String?,
        bloodGroup: freezed == bloodGroup
            ? _value.bloodGroup
            : bloodGroup // ignore: cast_nullable_to_non_nullable
                  as String?,
        medicalHistory: freezed == medicalHistory
            ? _value.medicalHistory
            : medicalHistory // ignore: cast_nullable_to_non_nullable
                  as String?,
        allergies: freezed == allergies
            ? _value.allergies
            : allergies // ignore: cast_nullable_to_non_nullable
                  as String?,
        vehicleType: freezed == vehicleType
            ? _value.vehicleType
            : vehicleType // ignore: cast_nullable_to_non_nullable
                  as String?,
        vehicleBrand: freezed == vehicleBrand
            ? _value.vehicleBrand
            : vehicleBrand // ignore: cast_nullable_to_non_nullable
                  as String?,
        vehicleModel: freezed == vehicleModel
            ? _value.vehicleModel
            : vehicleModel // ignore: cast_nullable_to_non_nullable
                  as String?,
        vehicleRegistrationNumber: freezed == vehicleRegistrationNumber
            ? _value.vehicleRegistrationNumber
            : vehicleRegistrationNumber // ignore: cast_nullable_to_non_nullable
                  as String?,
        governmentIdType: freezed == governmentIdType
            ? _value.governmentIdType
            : governmentIdType // ignore: cast_nullable_to_non_nullable
                  as String?,
        governmentIdNumber: freezed == governmentIdNumber
            ? _value.governmentIdNumber
            : governmentIdNumber // ignore: cast_nullable_to_non_nullable
                  as String?,
        riderFrequency: freezed == riderFrequency
            ? _value.riderFrequency
            : riderFrequency // ignore: cast_nullable_to_non_nullable
                  as String?,
        ridingClubType: freezed == ridingClubType
            ? _value.ridingClubType
            : ridingClubType // ignore: cast_nullable_to_non_nullable
                  as String?,
        clubName: freezed == clubName
            ? _value.clubName
            : clubName // ignore: cast_nullable_to_non_nullable
                  as String?,
        emergencyContacts: null == emergencyContacts
            ? _value._emergencyContacts
            : emergencyContacts // ignore: cast_nullable_to_non_nullable
                  as List<EmergencyContactInput>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$RiderProfileInputImpl implements _RiderProfileInput {
  const _$RiderProfileInputImpl({
    this.drivingLicenceNumber,
    this.drivingLicenceExpiry,
    this.addressLine,
    this.area,
    this.district,
    this.pincode,
    this.country,
    this.fatherName,
    this.motherName,
    this.dateOfBirth,
    this.gender,
    this.bloodGroup,
    this.medicalHistory,
    this.allergies,
    this.vehicleType,
    this.vehicleBrand,
    this.vehicleModel,
    this.vehicleRegistrationNumber,
    this.governmentIdType,
    this.governmentIdNumber,
    this.riderFrequency,
    this.ridingClubType,
    this.clubName,
    List<EmergencyContactInput> emergencyContacts = const [],
  }) : _emergencyContacts = emergencyContacts;

  factory _$RiderProfileInputImpl.fromJson(Map<String, dynamic> json) =>
      _$$RiderProfileInputImplFromJson(json);

  @override
  final String? drivingLicenceNumber;
  @override
  final String? drivingLicenceExpiry;
  // ISO-8601
  @override
  final String? addressLine;
  @override
  final String? area;
  @override
  final String? district;
  @override
  final String? pincode;
  @override
  final String? country;
  @override
  final String? fatherName;
  @override
  final String? motherName;
  @override
  final String? dateOfBirth;
  // ISO-8601
  @override
  final String? gender;
  @override
  final String? bloodGroup;
  @override
  final String? medicalHistory;
  @override
  final String? allergies;
  @override
  final String? vehicleType;
  @override
  final String? vehicleBrand;
  @override
  final String? vehicleModel;
  @override
  final String? vehicleRegistrationNumber;
  @override
  final String? governmentIdType;
  // "AADHAAR" | "PASSPORT"
  @override
  final String? governmentIdNumber;
  @override
  final String? riderFrequency;
  // "OCCASIONAL" | "WEEKLY" | "DAILY"
  @override
  final String? ridingClubType;
  // "SOLO" | "CLUB_MEMBER"
  @override
  final String? clubName;
  final List<EmergencyContactInput> _emergencyContacts;
  @override
  @JsonKey()
  List<EmergencyContactInput> get emergencyContacts {
    if (_emergencyContacts is EqualUnmodifiableListView)
      return _emergencyContacts;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_emergencyContacts);
  }

  @override
  String toString() {
    return 'RiderProfileInput(drivingLicenceNumber: $drivingLicenceNumber, drivingLicenceExpiry: $drivingLicenceExpiry, addressLine: $addressLine, area: $area, district: $district, pincode: $pincode, country: $country, fatherName: $fatherName, motherName: $motherName, dateOfBirth: $dateOfBirth, gender: $gender, bloodGroup: $bloodGroup, medicalHistory: $medicalHistory, allergies: $allergies, vehicleType: $vehicleType, vehicleBrand: $vehicleBrand, vehicleModel: $vehicleModel, vehicleRegistrationNumber: $vehicleRegistrationNumber, governmentIdType: $governmentIdType, governmentIdNumber: $governmentIdNumber, riderFrequency: $riderFrequency, ridingClubType: $ridingClubType, clubName: $clubName, emergencyContacts: $emergencyContacts)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RiderProfileInputImpl &&
            (identical(other.drivingLicenceNumber, drivingLicenceNumber) ||
                other.drivingLicenceNumber == drivingLicenceNumber) &&
            (identical(other.drivingLicenceExpiry, drivingLicenceExpiry) ||
                other.drivingLicenceExpiry == drivingLicenceExpiry) &&
            (identical(other.addressLine, addressLine) ||
                other.addressLine == addressLine) &&
            (identical(other.area, area) || other.area == area) &&
            (identical(other.district, district) ||
                other.district == district) &&
            (identical(other.pincode, pincode) || other.pincode == pincode) &&
            (identical(other.country, country) || other.country == country) &&
            (identical(other.fatherName, fatherName) ||
                other.fatherName == fatherName) &&
            (identical(other.motherName, motherName) ||
                other.motherName == motherName) &&
            (identical(other.dateOfBirth, dateOfBirth) ||
                other.dateOfBirth == dateOfBirth) &&
            (identical(other.gender, gender) || other.gender == gender) &&
            (identical(other.bloodGroup, bloodGroup) ||
                other.bloodGroup == bloodGroup) &&
            (identical(other.medicalHistory, medicalHistory) ||
                other.medicalHistory == medicalHistory) &&
            (identical(other.allergies, allergies) ||
                other.allergies == allergies) &&
            (identical(other.vehicleType, vehicleType) ||
                other.vehicleType == vehicleType) &&
            (identical(other.vehicleBrand, vehicleBrand) ||
                other.vehicleBrand == vehicleBrand) &&
            (identical(other.vehicleModel, vehicleModel) ||
                other.vehicleModel == vehicleModel) &&
            (identical(
                  other.vehicleRegistrationNumber,
                  vehicleRegistrationNumber,
                ) ||
                other.vehicleRegistrationNumber ==
                    vehicleRegistrationNumber) &&
            (identical(other.governmentIdType, governmentIdType) ||
                other.governmentIdType == governmentIdType) &&
            (identical(other.governmentIdNumber, governmentIdNumber) ||
                other.governmentIdNumber == governmentIdNumber) &&
            (identical(other.riderFrequency, riderFrequency) ||
                other.riderFrequency == riderFrequency) &&
            (identical(other.ridingClubType, ridingClubType) ||
                other.ridingClubType == ridingClubType) &&
            (identical(other.clubName, clubName) ||
                other.clubName == clubName) &&
            const DeepCollectionEquality().equals(
              other._emergencyContacts,
              _emergencyContacts,
            ));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hashAll([
    runtimeType,
    drivingLicenceNumber,
    drivingLicenceExpiry,
    addressLine,
    area,
    district,
    pincode,
    country,
    fatherName,
    motherName,
    dateOfBirth,
    gender,
    bloodGroup,
    medicalHistory,
    allergies,
    vehicleType,
    vehicleBrand,
    vehicleModel,
    vehicleRegistrationNumber,
    governmentIdType,
    governmentIdNumber,
    riderFrequency,
    ridingClubType,
    clubName,
    const DeepCollectionEquality().hash(_emergencyContacts),
  ]);

  /// Create a copy of RiderProfileInput
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$RiderProfileInputImplCopyWith<_$RiderProfileInputImpl> get copyWith =>
      __$$RiderProfileInputImplCopyWithImpl<_$RiderProfileInputImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$RiderProfileInputImplToJson(this);
  }
}

abstract class _RiderProfileInput implements RiderProfileInput {
  const factory _RiderProfileInput({
    String? drivingLicenceNumber,
    String? drivingLicenceExpiry,
    String? addressLine,
    String? area,
    String? district,
    String? pincode,
    String? country,
    String? fatherName,
    String? motherName,
    String? dateOfBirth,
    String? gender,
    String? bloodGroup,
    String? medicalHistory,
    String? allergies,
    String? vehicleType,
    String? vehicleBrand,
    String? vehicleModel,
    String? vehicleRegistrationNumber,
    String? governmentIdType,
    String? governmentIdNumber,
    String? riderFrequency,
    String? ridingClubType,
    String? clubName,
    List<EmergencyContactInput> emergencyContacts,
  }) = _$RiderProfileInputImpl;

  factory _RiderProfileInput.fromJson(Map<String, dynamic> json) =
      _$RiderProfileInputImpl.fromJson;

  @override
  String? get drivingLicenceNumber;
  @override
  String? get drivingLicenceExpiry; // ISO-8601
  @override
  String? get addressLine;
  @override
  String? get area;
  @override
  String? get district;
  @override
  String? get pincode;
  @override
  String? get country;
  @override
  String? get fatherName;
  @override
  String? get motherName;
  @override
  String? get dateOfBirth; // ISO-8601
  @override
  String? get gender;
  @override
  String? get bloodGroup;
  @override
  String? get medicalHistory;
  @override
  String? get allergies;
  @override
  String? get vehicleType;
  @override
  String? get vehicleBrand;
  @override
  String? get vehicleModel;
  @override
  String? get vehicleRegistrationNumber;
  @override
  String? get governmentIdType; // "AADHAAR" | "PASSPORT"
  @override
  String? get governmentIdNumber;
  @override
  String? get riderFrequency; // "OCCASIONAL" | "WEEKLY" | "DAILY"
  @override
  String? get ridingClubType; // "SOLO" | "CLUB_MEMBER"
  @override
  String? get clubName;
  @override
  List<EmergencyContactInput> get emergencyContacts;

  /// Create a copy of RiderProfileInput
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$RiderProfileInputImplCopyWith<_$RiderProfileInputImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
