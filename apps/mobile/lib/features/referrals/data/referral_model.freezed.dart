// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'referral_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

ReferredUser _$ReferredUserFromJson(Map<String, dynamic> json) {
  return _ReferredUser.fromJson(json);
}

/// @nodoc
mixin _$ReferredUser {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get email => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;

  /// Serializes this ReferredUser to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ReferredUser
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ReferredUserCopyWith<ReferredUser> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ReferredUserCopyWith<$Res> {
  factory $ReferredUserCopyWith(
    ReferredUser value,
    $Res Function(ReferredUser) then,
  ) = _$ReferredUserCopyWithImpl<$Res, ReferredUser>;
  @useResult
  $Res call({String id, String name, String email, String createdAt});
}

/// @nodoc
class _$ReferredUserCopyWithImpl<$Res, $Val extends ReferredUser>
    implements $ReferredUserCopyWith<$Res> {
  _$ReferredUserCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ReferredUser
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? email = null,
    Object? createdAt = null,
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
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$ReferredUserImplCopyWith<$Res>
    implements $ReferredUserCopyWith<$Res> {
  factory _$$ReferredUserImplCopyWith(
    _$ReferredUserImpl value,
    $Res Function(_$ReferredUserImpl) then,
  ) = __$$ReferredUserImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, String name, String email, String createdAt});
}

/// @nodoc
class __$$ReferredUserImplCopyWithImpl<$Res>
    extends _$ReferredUserCopyWithImpl<$Res, _$ReferredUserImpl>
    implements _$$ReferredUserImplCopyWith<$Res> {
  __$$ReferredUserImplCopyWithImpl(
    _$ReferredUserImpl _value,
    $Res Function(_$ReferredUserImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of ReferredUser
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? email = null,
    Object? createdAt = null,
  }) {
    return _then(
      _$ReferredUserImpl(
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
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$ReferredUserImpl implements _ReferredUser {
  const _$ReferredUserImpl({
    required this.id,
    required this.name,
    required this.email,
    required this.createdAt,
  });

  factory _$ReferredUserImpl.fromJson(Map<String, dynamic> json) =>
      _$$ReferredUserImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String email;
  @override
  final String createdAt;

  @override
  String toString() {
    return 'ReferredUser(id: $id, name: $name, email: $email, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ReferredUserImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, email, createdAt);

  /// Create a copy of ReferredUser
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ReferredUserImplCopyWith<_$ReferredUserImpl> get copyWith =>
      __$$ReferredUserImplCopyWithImpl<_$ReferredUserImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ReferredUserImplToJson(this);
  }
}

abstract class _ReferredUser implements ReferredUser {
  const factory _ReferredUser({
    required final String id,
    required final String name,
    required final String email,
    required final String createdAt,
  }) = _$ReferredUserImpl;

  factory _ReferredUser.fromJson(Map<String, dynamic> json) =
      _$ReferredUserImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get email;
  @override
  String get createdAt;

  /// Create a copy of ReferredUser
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ReferredUserImplCopyWith<_$ReferredUserImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ReferralInfo _$ReferralInfoFromJson(Map<String, dynamic> json) {
  return _ReferralInfo.fromJson(json);
}

/// @nodoc
mixin _$ReferralInfo {
  String get code => throw _privateConstructorUsedError;
  List<ReferredUser> get referrals => throw _privateConstructorUsedError;

  /// Serializes this ReferralInfo to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ReferralInfo
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ReferralInfoCopyWith<ReferralInfo> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ReferralInfoCopyWith<$Res> {
  factory $ReferralInfoCopyWith(
    ReferralInfo value,
    $Res Function(ReferralInfo) then,
  ) = _$ReferralInfoCopyWithImpl<$Res, ReferralInfo>;
  @useResult
  $Res call({String code, List<ReferredUser> referrals});
}

/// @nodoc
class _$ReferralInfoCopyWithImpl<$Res, $Val extends ReferralInfo>
    implements $ReferralInfoCopyWith<$Res> {
  _$ReferralInfoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ReferralInfo
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? code = null, Object? referrals = null}) {
    return _then(
      _value.copyWith(
            code: null == code
                ? _value.code
                : code // ignore: cast_nullable_to_non_nullable
                      as String,
            referrals: null == referrals
                ? _value.referrals
                : referrals // ignore: cast_nullable_to_non_nullable
                      as List<ReferredUser>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$ReferralInfoImplCopyWith<$Res>
    implements $ReferralInfoCopyWith<$Res> {
  factory _$$ReferralInfoImplCopyWith(
    _$ReferralInfoImpl value,
    $Res Function(_$ReferralInfoImpl) then,
  ) = __$$ReferralInfoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String code, List<ReferredUser> referrals});
}

/// @nodoc
class __$$ReferralInfoImplCopyWithImpl<$Res>
    extends _$ReferralInfoCopyWithImpl<$Res, _$ReferralInfoImpl>
    implements _$$ReferralInfoImplCopyWith<$Res> {
  __$$ReferralInfoImplCopyWithImpl(
    _$ReferralInfoImpl _value,
    $Res Function(_$ReferralInfoImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of ReferralInfo
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? code = null, Object? referrals = null}) {
    return _then(
      _$ReferralInfoImpl(
        code: null == code
            ? _value.code
            : code // ignore: cast_nullable_to_non_nullable
                  as String,
        referrals: null == referrals
            ? _value._referrals
            : referrals // ignore: cast_nullable_to_non_nullable
                  as List<ReferredUser>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$ReferralInfoImpl implements _ReferralInfo {
  const _$ReferralInfoImpl({
    required this.code,
    required final List<ReferredUser> referrals,
  }) : _referrals = referrals;

  factory _$ReferralInfoImpl.fromJson(Map<String, dynamic> json) =>
      _$$ReferralInfoImplFromJson(json);

  @override
  final String code;
  final List<ReferredUser> _referrals;
  @override
  List<ReferredUser> get referrals {
    if (_referrals is EqualUnmodifiableListView) return _referrals;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_referrals);
  }

  @override
  String toString() {
    return 'ReferralInfo(code: $code, referrals: $referrals)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ReferralInfoImpl &&
            (identical(other.code, code) || other.code == code) &&
            const DeepCollectionEquality().equals(
              other._referrals,
              _referrals,
            ));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    code,
    const DeepCollectionEquality().hash(_referrals),
  );

  /// Create a copy of ReferralInfo
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ReferralInfoImplCopyWith<_$ReferralInfoImpl> get copyWith =>
      __$$ReferralInfoImplCopyWithImpl<_$ReferralInfoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ReferralInfoImplToJson(this);
  }
}

abstract class _ReferralInfo implements ReferralInfo {
  const factory _ReferralInfo({
    required final String code,
    required final List<ReferredUser> referrals,
  }) = _$ReferralInfoImpl;

  factory _ReferralInfo.fromJson(Map<String, dynamic> json) =
      _$ReferralInfoImpl.fromJson;

  @override
  String get code;
  @override
  List<ReferredUser> get referrals;

  /// Create a copy of ReferralInfo
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ReferralInfoImplCopyWith<_$ReferralInfoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
