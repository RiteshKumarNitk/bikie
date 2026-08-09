// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'partner_dashboard_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

PartnerSosStats _$PartnerSosStatsFromJson(Map<String, dynamic> json) {
  return _PartnerSosStats.fromJson(json);
}

/// @nodoc
mixin _$PartnerSosStats {
  int get activeRequests => throw _privateConstructorUsedError;
  int get todayAssistanceCount => throw _privateConstructorUsedError;
  int get completedCount => throw _privateConstructorUsedError;
  num get ratingAvg => throw _privateConstructorUsedError;
  int get ratingCount => throw _privateConstructorUsedError;

  /// Serializes this PartnerSosStats to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of PartnerSosStats
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $PartnerSosStatsCopyWith<PartnerSosStats> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PartnerSosStatsCopyWith<$Res> {
  factory $PartnerSosStatsCopyWith(
    PartnerSosStats value,
    $Res Function(PartnerSosStats) then,
  ) = _$PartnerSosStatsCopyWithImpl<$Res, PartnerSosStats>;
  @useResult
  $Res call({
    int activeRequests,
    int todayAssistanceCount,
    int completedCount,
    num ratingAvg,
    int ratingCount,
  });
}

/// @nodoc
class _$PartnerSosStatsCopyWithImpl<$Res, $Val extends PartnerSosStats>
    implements $PartnerSosStatsCopyWith<$Res> {
  _$PartnerSosStatsCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of PartnerSosStats
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? activeRequests = null,
    Object? todayAssistanceCount = null,
    Object? completedCount = null,
    Object? ratingAvg = null,
    Object? ratingCount = null,
  }) {
    return _then(
      _value.copyWith(
            activeRequests: null == activeRequests
                ? _value.activeRequests
                : activeRequests // ignore: cast_nullable_to_non_nullable
                      as int,
            todayAssistanceCount: null == todayAssistanceCount
                ? _value.todayAssistanceCount
                : todayAssistanceCount // ignore: cast_nullable_to_non_nullable
                      as int,
            completedCount: null == completedCount
                ? _value.completedCount
                : completedCount // ignore: cast_nullable_to_non_nullable
                      as int,
            ratingAvg: null == ratingAvg
                ? _value.ratingAvg
                : ratingAvg // ignore: cast_nullable_to_non_nullable
                      as num,
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
abstract class _$$PartnerSosStatsImplCopyWith<$Res>
    implements $PartnerSosStatsCopyWith<$Res> {
  factory _$$PartnerSosStatsImplCopyWith(
    _$PartnerSosStatsImpl value,
    $Res Function(_$PartnerSosStatsImpl) then,
  ) = __$$PartnerSosStatsImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    int activeRequests,
    int todayAssistanceCount,
    int completedCount,
    num ratingAvg,
    int ratingCount,
  });
}

/// @nodoc
class __$$PartnerSosStatsImplCopyWithImpl<$Res>
    extends _$PartnerSosStatsCopyWithImpl<$Res, _$PartnerSosStatsImpl>
    implements _$$PartnerSosStatsImplCopyWith<$Res> {
  __$$PartnerSosStatsImplCopyWithImpl(
    _$PartnerSosStatsImpl _value,
    $Res Function(_$PartnerSosStatsImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of PartnerSosStats
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? activeRequests = null,
    Object? todayAssistanceCount = null,
    Object? completedCount = null,
    Object? ratingAvg = null,
    Object? ratingCount = null,
  }) {
    return _then(
      _$PartnerSosStatsImpl(
        activeRequests: null == activeRequests
            ? _value.activeRequests
            : activeRequests // ignore: cast_nullable_to_non_nullable
                  as int,
        todayAssistanceCount: null == todayAssistanceCount
            ? _value.todayAssistanceCount
            : todayAssistanceCount // ignore: cast_nullable_to_non_nullable
                  as int,
        completedCount: null == completedCount
            ? _value.completedCount
            : completedCount // ignore: cast_nullable_to_non_nullable
                  as int,
        ratingAvg: null == ratingAvg
            ? _value.ratingAvg
            : ratingAvg // ignore: cast_nullable_to_non_nullable
                  as num,
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
class _$PartnerSosStatsImpl implements _PartnerSosStats {
  const _$PartnerSosStatsImpl({
    required this.activeRequests,
    required this.todayAssistanceCount,
    required this.completedCount,
    required this.ratingAvg,
    required this.ratingCount,
  });

  factory _$PartnerSosStatsImpl.fromJson(Map<String, dynamic> json) =>
      _$$PartnerSosStatsImplFromJson(json);

  @override
  final int activeRequests;
  @override
  final int todayAssistanceCount;
  @override
  final int completedCount;
  @override
  final num ratingAvg;
  @override
  final int ratingCount;

  @override
  String toString() {
    return 'PartnerSosStats(activeRequests: $activeRequests, todayAssistanceCount: $todayAssistanceCount, completedCount: $completedCount, ratingAvg: $ratingAvg, ratingCount: $ratingCount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PartnerSosStatsImpl &&
            (identical(other.activeRequests, activeRequests) ||
                other.activeRequests == activeRequests) &&
            (identical(other.todayAssistanceCount, todayAssistanceCount) ||
                other.todayAssistanceCount == todayAssistanceCount) &&
            (identical(other.completedCount, completedCount) ||
                other.completedCount == completedCount) &&
            (identical(other.ratingAvg, ratingAvg) ||
                other.ratingAvg == ratingAvg) &&
            (identical(other.ratingCount, ratingCount) ||
                other.ratingCount == ratingCount));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    activeRequests,
    todayAssistanceCount,
    completedCount,
    ratingAvg,
    ratingCount,
  );

  /// Create a copy of PartnerSosStats
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PartnerSosStatsImplCopyWith<_$PartnerSosStatsImpl> get copyWith =>
      __$$PartnerSosStatsImplCopyWithImpl<_$PartnerSosStatsImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$PartnerSosStatsImplToJson(this);
  }
}

abstract class _PartnerSosStats implements PartnerSosStats {
  const factory _PartnerSosStats({
    required final int activeRequests,
    required final int todayAssistanceCount,
    required final int completedCount,
    required final num ratingAvg,
    required final int ratingCount,
  }) = _$PartnerSosStatsImpl;

  factory _PartnerSosStats.fromJson(Map<String, dynamic> json) =
      _$PartnerSosStatsImpl.fromJson;

  @override
  int get activeRequests;
  @override
  int get todayAssistanceCount;
  @override
  int get completedCount;
  @override
  num get ratingAvg;
  @override
  int get ratingCount;

  /// Create a copy of PartnerSosStats
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PartnerSosStatsImplCopyWith<_$PartnerSosStatsImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

PartnerNearbyRequest _$PartnerNearbyRequestFromJson(Map<String, dynamic> json) {
  return _PartnerNearbyRequest.fromJson(json);
}

/// @nodoc
mixin _$PartnerNearbyRequest {
  String get id => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String get severity => throw _privateConstructorUsedError;
  String get city => throw _privateConstructorUsedError;
  num get distanceMeters => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;

  /// Serializes this PartnerNearbyRequest to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of PartnerNearbyRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $PartnerNearbyRequestCopyWith<PartnerNearbyRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PartnerNearbyRequestCopyWith<$Res> {
  factory $PartnerNearbyRequestCopyWith(
    PartnerNearbyRequest value,
    $Res Function(PartnerNearbyRequest) then,
  ) = _$PartnerNearbyRequestCopyWithImpl<$Res, PartnerNearbyRequest>;
  @useResult
  $Res call({
    String id,
    String type,
    String severity,
    String city,
    num distanceMeters,
    String createdAt,
  });
}

/// @nodoc
class _$PartnerNearbyRequestCopyWithImpl<
  $Res,
  $Val extends PartnerNearbyRequest
>
    implements $PartnerNearbyRequestCopyWith<$Res> {
  _$PartnerNearbyRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of PartnerNearbyRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? severity = null,
    Object? city = null,
    Object? distanceMeters = null,
    Object? createdAt = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            type: null == type
                ? _value.type
                : type // ignore: cast_nullable_to_non_nullable
                      as String,
            severity: null == severity
                ? _value.severity
                : severity // ignore: cast_nullable_to_non_nullable
                      as String,
            city: null == city
                ? _value.city
                : city // ignore: cast_nullable_to_non_nullable
                      as String,
            distanceMeters: null == distanceMeters
                ? _value.distanceMeters
                : distanceMeters // ignore: cast_nullable_to_non_nullable
                      as num,
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
abstract class _$$PartnerNearbyRequestImplCopyWith<$Res>
    implements $PartnerNearbyRequestCopyWith<$Res> {
  factory _$$PartnerNearbyRequestImplCopyWith(
    _$PartnerNearbyRequestImpl value,
    $Res Function(_$PartnerNearbyRequestImpl) then,
  ) = __$$PartnerNearbyRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String type,
    String severity,
    String city,
    num distanceMeters,
    String createdAt,
  });
}

/// @nodoc
class __$$PartnerNearbyRequestImplCopyWithImpl<$Res>
    extends _$PartnerNearbyRequestCopyWithImpl<$Res, _$PartnerNearbyRequestImpl>
    implements _$$PartnerNearbyRequestImplCopyWith<$Res> {
  __$$PartnerNearbyRequestImplCopyWithImpl(
    _$PartnerNearbyRequestImpl _value,
    $Res Function(_$PartnerNearbyRequestImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of PartnerNearbyRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? severity = null,
    Object? city = null,
    Object? distanceMeters = null,
    Object? createdAt = null,
  }) {
    return _then(
      _$PartnerNearbyRequestImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        type: null == type
            ? _value.type
            : type // ignore: cast_nullable_to_non_nullable
                  as String,
        severity: null == severity
            ? _value.severity
            : severity // ignore: cast_nullable_to_non_nullable
                  as String,
        city: null == city
            ? _value.city
            : city // ignore: cast_nullable_to_non_nullable
                  as String,
        distanceMeters: null == distanceMeters
            ? _value.distanceMeters
            : distanceMeters // ignore: cast_nullable_to_non_nullable
                  as num,
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
class _$PartnerNearbyRequestImpl implements _PartnerNearbyRequest {
  const _$PartnerNearbyRequestImpl({
    required this.id,
    required this.type,
    required this.severity,
    required this.city,
    required this.distanceMeters,
    required this.createdAt,
  });

  factory _$PartnerNearbyRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$PartnerNearbyRequestImplFromJson(json);

  @override
  final String id;
  @override
  final String type;
  @override
  final String severity;
  @override
  final String city;
  @override
  final num distanceMeters;
  @override
  final String createdAt;

  @override
  String toString() {
    return 'PartnerNearbyRequest(id: $id, type: $type, severity: $severity, city: $city, distanceMeters: $distanceMeters, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PartnerNearbyRequestImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.severity, severity) ||
                other.severity == severity) &&
            (identical(other.city, city) || other.city == city) &&
            (identical(other.distanceMeters, distanceMeters) ||
                other.distanceMeters == distanceMeters) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    type,
    severity,
    city,
    distanceMeters,
    createdAt,
  );

  /// Create a copy of PartnerNearbyRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PartnerNearbyRequestImplCopyWith<_$PartnerNearbyRequestImpl>
  get copyWith =>
      __$$PartnerNearbyRequestImplCopyWithImpl<_$PartnerNearbyRequestImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$PartnerNearbyRequestImplToJson(this);
  }
}

abstract class _PartnerNearbyRequest implements PartnerNearbyRequest {
  const factory _PartnerNearbyRequest({
    required final String id,
    required final String type,
    required final String severity,
    required final String city,
    required final num distanceMeters,
    required final String createdAt,
  }) = _$PartnerNearbyRequestImpl;

  factory _PartnerNearbyRequest.fromJson(Map<String, dynamic> json) =
      _$PartnerNearbyRequestImpl.fromJson;

  @override
  String get id;
  @override
  String get type;
  @override
  String get severity;
  @override
  String get city;
  @override
  num get distanceMeters;
  @override
  String get createdAt;

  /// Create a copy of PartnerNearbyRequest
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PartnerNearbyRequestImplCopyWith<_$PartnerNearbyRequestImpl>
  get copyWith => throw _privateConstructorUsedError;
}

PartnerActiveSession _$PartnerActiveSessionFromJson(Map<String, dynamic> json) {
  return _PartnerActiveSession.fromJson(json);
}

/// @nodoc
mixin _$PartnerActiveSession {
  String get id => throw _privateConstructorUsedError;
  String get alertId => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String get riderName => throw _privateConstructorUsedError;
  String get alertType => throw _privateConstructorUsedError;
  num? get distanceMeters => throw _privateConstructorUsedError;
  int? get etaMinutes => throw _privateConstructorUsedError;

  /// Serializes this PartnerActiveSession to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of PartnerActiveSession
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $PartnerActiveSessionCopyWith<PartnerActiveSession> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PartnerActiveSessionCopyWith<$Res> {
  factory $PartnerActiveSessionCopyWith(
    PartnerActiveSession value,
    $Res Function(PartnerActiveSession) then,
  ) = _$PartnerActiveSessionCopyWithImpl<$Res, PartnerActiveSession>;
  @useResult
  $Res call({
    String id,
    String alertId,
    String status,
    String riderName,
    String alertType,
    num? distanceMeters,
    int? etaMinutes,
  });
}

/// @nodoc
class _$PartnerActiveSessionCopyWithImpl<
  $Res,
  $Val extends PartnerActiveSession
>
    implements $PartnerActiveSessionCopyWith<$Res> {
  _$PartnerActiveSessionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of PartnerActiveSession
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? alertId = null,
    Object? status = null,
    Object? riderName = null,
    Object? alertType = null,
    Object? distanceMeters = freezed,
    Object? etaMinutes = freezed,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            alertId: null == alertId
                ? _value.alertId
                : alertId // ignore: cast_nullable_to_non_nullable
                      as String,
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String,
            riderName: null == riderName
                ? _value.riderName
                : riderName // ignore: cast_nullable_to_non_nullable
                      as String,
            alertType: null == alertType
                ? _value.alertType
                : alertType // ignore: cast_nullable_to_non_nullable
                      as String,
            distanceMeters: freezed == distanceMeters
                ? _value.distanceMeters
                : distanceMeters // ignore: cast_nullable_to_non_nullable
                      as num?,
            etaMinutes: freezed == etaMinutes
                ? _value.etaMinutes
                : etaMinutes // ignore: cast_nullable_to_non_nullable
                      as int?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$PartnerActiveSessionImplCopyWith<$Res>
    implements $PartnerActiveSessionCopyWith<$Res> {
  factory _$$PartnerActiveSessionImplCopyWith(
    _$PartnerActiveSessionImpl value,
    $Res Function(_$PartnerActiveSessionImpl) then,
  ) = __$$PartnerActiveSessionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String alertId,
    String status,
    String riderName,
    String alertType,
    num? distanceMeters,
    int? etaMinutes,
  });
}

/// @nodoc
class __$$PartnerActiveSessionImplCopyWithImpl<$Res>
    extends _$PartnerActiveSessionCopyWithImpl<$Res, _$PartnerActiveSessionImpl>
    implements _$$PartnerActiveSessionImplCopyWith<$Res> {
  __$$PartnerActiveSessionImplCopyWithImpl(
    _$PartnerActiveSessionImpl _value,
    $Res Function(_$PartnerActiveSessionImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of PartnerActiveSession
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? alertId = null,
    Object? status = null,
    Object? riderName = null,
    Object? alertType = null,
    Object? distanceMeters = freezed,
    Object? etaMinutes = freezed,
  }) {
    return _then(
      _$PartnerActiveSessionImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        alertId: null == alertId
            ? _value.alertId
            : alertId // ignore: cast_nullable_to_non_nullable
                  as String,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
        riderName: null == riderName
            ? _value.riderName
            : riderName // ignore: cast_nullable_to_non_nullable
                  as String,
        alertType: null == alertType
            ? _value.alertType
            : alertType // ignore: cast_nullable_to_non_nullable
                  as String,
        distanceMeters: freezed == distanceMeters
            ? _value.distanceMeters
            : distanceMeters // ignore: cast_nullable_to_non_nullable
                  as num?,
        etaMinutes: freezed == etaMinutes
            ? _value.etaMinutes
            : etaMinutes // ignore: cast_nullable_to_non_nullable
                  as int?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$PartnerActiveSessionImpl implements _PartnerActiveSession {
  const _$PartnerActiveSessionImpl({
    required this.id,
    required this.alertId,
    required this.status,
    required this.riderName,
    required this.alertType,
    this.distanceMeters,
    this.etaMinutes,
  });

  factory _$PartnerActiveSessionImpl.fromJson(Map<String, dynamic> json) =>
      _$$PartnerActiveSessionImplFromJson(json);

  @override
  final String id;
  @override
  final String alertId;
  @override
  final String status;
  @override
  final String riderName;
  @override
  final String alertType;
  @override
  final num? distanceMeters;
  @override
  final int? etaMinutes;

  @override
  String toString() {
    return 'PartnerActiveSession(id: $id, alertId: $alertId, status: $status, riderName: $riderName, alertType: $alertType, distanceMeters: $distanceMeters, etaMinutes: $etaMinutes)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PartnerActiveSessionImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.alertId, alertId) || other.alertId == alertId) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.riderName, riderName) ||
                other.riderName == riderName) &&
            (identical(other.alertType, alertType) ||
                other.alertType == alertType) &&
            (identical(other.distanceMeters, distanceMeters) ||
                other.distanceMeters == distanceMeters) &&
            (identical(other.etaMinutes, etaMinutes) ||
                other.etaMinutes == etaMinutes));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    alertId,
    status,
    riderName,
    alertType,
    distanceMeters,
    etaMinutes,
  );

  /// Create a copy of PartnerActiveSession
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PartnerActiveSessionImplCopyWith<_$PartnerActiveSessionImpl>
  get copyWith =>
      __$$PartnerActiveSessionImplCopyWithImpl<_$PartnerActiveSessionImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$PartnerActiveSessionImplToJson(this);
  }
}

abstract class _PartnerActiveSession implements PartnerActiveSession {
  const factory _PartnerActiveSession({
    required final String id,
    required final String alertId,
    required final String status,
    required final String riderName,
    required final String alertType,
    final num? distanceMeters,
    final int? etaMinutes,
  }) = _$PartnerActiveSessionImpl;

  factory _PartnerActiveSession.fromJson(Map<String, dynamic> json) =
      _$PartnerActiveSessionImpl.fromJson;

  @override
  String get id;
  @override
  String get alertId;
  @override
  String get status;
  @override
  String get riderName;
  @override
  String get alertType;
  @override
  num? get distanceMeters;
  @override
  int? get etaMinutes;

  /// Create a copy of PartnerActiveSession
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PartnerActiveSessionImplCopyWith<_$PartnerActiveSessionImpl>
  get copyWith => throw _privateConstructorUsedError;
}
