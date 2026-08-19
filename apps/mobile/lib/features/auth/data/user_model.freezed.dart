// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'user_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

UserModel _$UserModelFromJson(Map<String, dynamic> json) {
  return _UserModel.fromJson(json);
}

/// @nodoc
mixin _$UserModel {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get email => throw _privateConstructorUsedError;
  String get role => throw _privateConstructorUsedError;
  String? get phone => throw _privateConstructorUsedError;
  String? get image =>
      throw _privateConstructorUsedError; // ADR-046b — denormalized Partner.verificationStatus. ADR-053: verification/trust status
  // only now, never a capability/routing signal — see accountType below for that. `null`
  // means no Service Provider profile has ever been created ("NOT_APPLIED").
  String? get partnerStatus =>
      throw _privateConstructorUsedError; // ADR-053 — server-authoritative, mutually-exclusive Rider/Service-Provider selector. Set
  // only at registration or by an admin-approved Account Type Change Request, never
  // self-service. Defaults to RIDER to match the server's schema default.
  String get accountType => throw _privateConstructorUsedError;

  /// Serializes this UserModel to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of UserModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $UserModelCopyWith<UserModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $UserModelCopyWith<$Res> {
  factory $UserModelCopyWith(UserModel value, $Res Function(UserModel) then) =
      _$UserModelCopyWithImpl<$Res, UserModel>;
  @useResult
  $Res call({
    String id,
    String name,
    String email,
    String role,
    String? phone,
    String? image,
    String? partnerStatus,
    String accountType,
  });
}

/// @nodoc
class _$UserModelCopyWithImpl<$Res, $Val extends UserModel>
    implements $UserModelCopyWith<$Res> {
  _$UserModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of UserModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? email = null,
    Object? role = null,
    Object? phone = freezed,
    Object? image = freezed,
    Object? partnerStatus = freezed,
    Object? accountType = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            name: null == name
                ? _value.name
                : name // ignore: cast_nullable_to_non_nullable
                      as String,
            email: null == email
                ? _value.email
                : email // ignore: cast_nullable_to_non_nullable
                      as String,
            role: null == role
                ? _value.role
                : role // ignore: cast_nullable_to_non_nullable
                      as String,
            phone: freezed == phone
                ? _value.phone
                : phone // ignore: cast_nullable_to_non_nullable
                      as String?,
            image: freezed == image
                ? _value.image
                : image // ignore: cast_nullable_to_non_nullable
                      as String?,
            partnerStatus: freezed == partnerStatus
                ? _value.partnerStatus
                : partnerStatus // ignore: cast_nullable_to_non_nullable
                      as String?,
            accountType: null == accountType
                ? _value.accountType
                : accountType // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$UserModelImplCopyWith<$Res>
    implements $UserModelCopyWith<$Res> {
  factory _$$UserModelImplCopyWith(
    _$UserModelImpl value,
    $Res Function(_$UserModelImpl) then,
  ) = __$$UserModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String name,
    String email,
    String role,
    String? phone,
    String? image,
    String? partnerStatus,
    String accountType,
  });
}

/// @nodoc
class __$$UserModelImplCopyWithImpl<$Res>
    extends _$UserModelCopyWithImpl<$Res, _$UserModelImpl>
    implements _$$UserModelImplCopyWith<$Res> {
  __$$UserModelImplCopyWithImpl(
    _$UserModelImpl _value,
    $Res Function(_$UserModelImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of UserModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? email = null,
    Object? role = null,
    Object? phone = freezed,
    Object? image = freezed,
    Object? partnerStatus = freezed,
    Object? accountType = null,
  }) {
    return _then(
      _$UserModelImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        email: null == email
            ? _value.email
            : email // ignore: cast_nullable_to_non_nullable
                  as String,
        role: null == role
            ? _value.role
            : role // ignore: cast_nullable_to_non_nullable
                  as String,
        phone: freezed == phone
            ? _value.phone
            : phone // ignore: cast_nullable_to_non_nullable
                  as String?,
        image: freezed == image
            ? _value.image
            : image // ignore: cast_nullable_to_non_nullable
                  as String?,
        partnerStatus: freezed == partnerStatus
            ? _value.partnerStatus
            : partnerStatus // ignore: cast_nullable_to_non_nullable
                  as String?,
        accountType: null == accountType
            ? _value.accountType
            : accountType // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$UserModelImpl implements _UserModel {
  const _$UserModelImpl({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.image,
    this.partnerStatus,
    this.accountType = 'RIDER',
  });

  factory _$UserModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$UserModelImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String email;
  @override
  final String role;
  @override
  final String? phone;
  @override
  final String? image;
  // ADR-046b — denormalized Partner.verificationStatus. ADR-053: verification/trust status
  // only now, never a capability/routing signal — see accountType below for that. `null`
  // means no Service Provider profile has ever been created ("NOT_APPLIED").
  @override
  final String? partnerStatus;
  // ADR-053 — server-authoritative, mutually-exclusive Rider/Service-Provider selector. Set
  // only at registration or by an admin-approved Account Type Change Request, never
  // self-service. Defaults to RIDER to match the server's schema default.
  @override
  @JsonKey()
  final String accountType;

  @override
  String toString() {
    return 'UserModel(id: $id, name: $name, email: $email, role: $role, phone: $phone, image: $image, partnerStatus: $partnerStatus, accountType: $accountType)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UserModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.role, role) || other.role == role) &&
            (identical(other.phone, phone) || other.phone == phone) &&
            (identical(other.image, image) || other.image == image) &&
            (identical(other.partnerStatus, partnerStatus) ||
                other.partnerStatus == partnerStatus) &&
            (identical(other.accountType, accountType) ||
                other.accountType == accountType));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    name,
    email,
    role,
    phone,
    image,
    partnerStatus,
    accountType,
  );

  /// Create a copy of UserModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$UserModelImplCopyWith<_$UserModelImpl> get copyWith =>
      __$$UserModelImplCopyWithImpl<_$UserModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$UserModelImplToJson(this);
  }
}

abstract class _UserModel implements UserModel {
  const factory _UserModel({
    required String id,
    required String name,
    required String email,
    required String role,
    String? phone,
    String? image,
    String? partnerStatus,
    String accountType,
  }) = _$UserModelImpl;

  factory _UserModel.fromJson(Map<String, dynamic> json) =
      _$UserModelImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get email;
  @override
  String get role;
  @override
  String? get phone;
  @override
  String? get image; // ADR-046b — denormalized Partner.verificationStatus. ADR-053: verification/trust status
  // only now, never a capability/routing signal — see accountType below for that. `null`
  // means no Service Provider profile has ever been created ("NOT_APPLIED").
  @override
  String? get partnerStatus; // ADR-053 — server-authoritative, mutually-exclusive Rider/Service-Provider selector. Set
  // only at registration or by an admin-approved Account Type Change Request, never
  // self-service. Defaults to RIDER to match the server's schema default.
  @override
  String get accountType;

  /// Create a copy of UserModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$UserModelImplCopyWith<_$UserModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
