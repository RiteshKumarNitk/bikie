// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'sos_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

SOSAlert _$SOSAlertFromJson(Map<String, dynamic> json) {
  return _SOSAlert.fromJson(json);
}

/// @nodoc
mixin _$SOSAlert {
  String get id => throw _privateConstructorUsedError;
  String get userId => throw _privateConstructorUsedError;
  String get userName => throw _privateConstructorUsedError;
  String? get userPhone => throw _privateConstructorUsedError;
  String get userEmail => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  num get latitude => throw _privateConstructorUsedError;
  num get longitude => throw _privateConstructorUsedError;
  String get city => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String? get resolvedAt => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;

  /// Serializes this SOSAlert to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SOSAlert
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SOSAlertCopyWith<SOSAlert> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SOSAlertCopyWith<$Res> {
  factory $SOSAlertCopyWith(SOSAlert value, $Res Function(SOSAlert) then) =
      _$SOSAlertCopyWithImpl<$Res, SOSAlert>;
  @useResult
  $Res call({
    String id,
    String userId,
    String userName,
    String? userPhone,
    String userEmail,
    String type,
    String? description,
    num latitude,
    num longitude,
    String city,
    String status,
    String? resolvedAt,
    String createdAt,
  });
}

/// @nodoc
class _$SOSAlertCopyWithImpl<$Res, $Val extends SOSAlert>
    implements $SOSAlertCopyWith<$Res> {
  _$SOSAlertCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SOSAlert
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? userName = null,
    Object? userPhone = freezed,
    Object? userEmail = null,
    Object? type = null,
    Object? description = freezed,
    Object? latitude = null,
    Object? longitude = null,
    Object? city = null,
    Object? status = null,
    Object? resolvedAt = freezed,
    Object? createdAt = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            userId: null == userId
                ? _value.userId
                : userId // ignore: cast_nullable_to_non_nullable
                      as String,
            userName: null == userName
                ? _value.userName
                : userName // ignore: cast_nullable_to_non_nullable
                      as String,
            userPhone: freezed == userPhone
                ? _value.userPhone
                : userPhone // ignore: cast_nullable_to_non_nullable
                      as String?,
            userEmail: null == userEmail
                ? _value.userEmail
                : userEmail // ignore: cast_nullable_to_non_nullable
                      as String,
            type: null == type
                ? _value.type
                : type // ignore: cast_nullable_to_non_nullable
                      as String,
            description: freezed == description
                ? _value.description
                : description // ignore: cast_nullable_to_non_nullable
                      as String?,
            latitude: null == latitude
                ? _value.latitude
                : latitude // ignore: cast_nullable_to_non_nullable
                      as num,
            longitude: null == longitude
                ? _value.longitude
                : longitude // ignore: cast_nullable_to_non_nullable
                      as num,
            city: null == city
                ? _value.city
                : city // ignore: cast_nullable_to_non_nullable
                      as String,
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String,
            resolvedAt: freezed == resolvedAt
                ? _value.resolvedAt
                : resolvedAt // ignore: cast_nullable_to_non_nullable
                      as String?,
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
abstract class _$$SOSAlertImplCopyWith<$Res>
    implements $SOSAlertCopyWith<$Res> {
  factory _$$SOSAlertImplCopyWith(
    _$SOSAlertImpl value,
    $Res Function(_$SOSAlertImpl) then,
  ) = __$$SOSAlertImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String userId,
    String userName,
    String? userPhone,
    String userEmail,
    String type,
    String? description,
    num latitude,
    num longitude,
    String city,
    String status,
    String? resolvedAt,
    String createdAt,
  });
}

/// @nodoc
class __$$SOSAlertImplCopyWithImpl<$Res>
    extends _$SOSAlertCopyWithImpl<$Res, _$SOSAlertImpl>
    implements _$$SOSAlertImplCopyWith<$Res> {
  __$$SOSAlertImplCopyWithImpl(
    _$SOSAlertImpl _value,
    $Res Function(_$SOSAlertImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SOSAlert
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? userName = null,
    Object? userPhone = freezed,
    Object? userEmail = null,
    Object? type = null,
    Object? description = freezed,
    Object? latitude = null,
    Object? longitude = null,
    Object? city = null,
    Object? status = null,
    Object? resolvedAt = freezed,
    Object? createdAt = null,
  }) {
    return _then(
      _$SOSAlertImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        userId: null == userId
            ? _value.userId
            : userId // ignore: cast_nullable_to_non_nullable
                  as String,
        userName: null == userName
            ? _value.userName
            : userName // ignore: cast_nullable_to_non_nullable
                  as String,
        userPhone: freezed == userPhone
            ? _value.userPhone
            : userPhone // ignore: cast_nullable_to_non_nullable
                  as String?,
        userEmail: null == userEmail
            ? _value.userEmail
            : userEmail // ignore: cast_nullable_to_non_nullable
                  as String,
        type: null == type
            ? _value.type
            : type // ignore: cast_nullable_to_non_nullable
                  as String,
        description: freezed == description
            ? _value.description
            : description // ignore: cast_nullable_to_non_nullable
                  as String?,
        latitude: null == latitude
            ? _value.latitude
            : latitude // ignore: cast_nullable_to_non_nullable
                  as num,
        longitude: null == longitude
            ? _value.longitude
            : longitude // ignore: cast_nullable_to_non_nullable
                  as num,
        city: null == city
            ? _value.city
            : city // ignore: cast_nullable_to_non_nullable
                  as String,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
        resolvedAt: freezed == resolvedAt
            ? _value.resolvedAt
            : resolvedAt // ignore: cast_nullable_to_non_nullable
                  as String?,
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
class _$SOSAlertImpl implements _SOSAlert {
  const _$SOSAlertImpl({
    required this.id,
    required this.userId,
    required this.userName,
    this.userPhone,
    required this.userEmail,
    required this.type,
    this.description,
    required this.latitude,
    required this.longitude,
    required this.city,
    required this.status,
    this.resolvedAt,
    required this.createdAt,
  });

  factory _$SOSAlertImpl.fromJson(Map<String, dynamic> json) =>
      _$$SOSAlertImplFromJson(json);

  @override
  final String id;
  @override
  final String userId;
  @override
  final String userName;
  @override
  final String? userPhone;
  @override
  final String userEmail;
  @override
  final String type;
  @override
  final String? description;
  @override
  final num latitude;
  @override
  final num longitude;
  @override
  final String city;
  @override
  final String status;
  @override
  final String? resolvedAt;
  @override
  final String createdAt;

  @override
  String toString() {
    return 'SOSAlert(id: $id, userId: $userId, userName: $userName, userPhone: $userPhone, userEmail: $userEmail, type: $type, description: $description, latitude: $latitude, longitude: $longitude, city: $city, status: $status, resolvedAt: $resolvedAt, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SOSAlertImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.userName, userName) ||
                other.userName == userName) &&
            (identical(other.userPhone, userPhone) ||
                other.userPhone == userPhone) &&
            (identical(other.userEmail, userEmail) ||
                other.userEmail == userEmail) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.latitude, latitude) ||
                other.latitude == latitude) &&
            (identical(other.longitude, longitude) ||
                other.longitude == longitude) &&
            (identical(other.city, city) || other.city == city) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.resolvedAt, resolvedAt) ||
                other.resolvedAt == resolvedAt) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    userId,
    userName,
    userPhone,
    userEmail,
    type,
    description,
    latitude,
    longitude,
    city,
    status,
    resolvedAt,
    createdAt,
  );

  /// Create a copy of SOSAlert
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SOSAlertImplCopyWith<_$SOSAlertImpl> get copyWith =>
      __$$SOSAlertImplCopyWithImpl<_$SOSAlertImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$SOSAlertImplToJson(this);
  }
}

abstract class _SOSAlert implements SOSAlert {
  const factory _SOSAlert({
    required final String id,
    required final String userId,
    required final String userName,
    final String? userPhone,
    required final String userEmail,
    required final String type,
    final String? description,
    required final num latitude,
    required final num longitude,
    required final String city,
    required final String status,
    final String? resolvedAt,
    required final String createdAt,
  }) = _$SOSAlertImpl;

  factory _SOSAlert.fromJson(Map<String, dynamic> json) =
      _$SOSAlertImpl.fromJson;

  @override
  String get id;
  @override
  String get userId;
  @override
  String get userName;
  @override
  String? get userPhone;
  @override
  String get userEmail;
  @override
  String get type;
  @override
  String? get description;
  @override
  num get latitude;
  @override
  num get longitude;
  @override
  String get city;
  @override
  String get status;
  @override
  String? get resolvedAt;
  @override
  String get createdAt;

  /// Create a copy of SOSAlert
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SOSAlertImplCopyWith<_$SOSAlertImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
