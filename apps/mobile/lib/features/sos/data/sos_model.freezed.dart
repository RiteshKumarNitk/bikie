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
  String get userName =>
      throw _privateConstructorUsedError; // ADR-045 — phone/email/exact location are null unless the viewer is the reporter, the
  // assigned helper, or an admin (see redactAlertForViewer, packages/services). Every screen
  // that reads these must handle null, not just "missing profile field."
  String? get userPhone => throw _privateConstructorUsedError;
  String? get userEmail => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  num? get latitude => throw _privateConstructorUsedError;
  num? get longitude => throw _privateConstructorUsedError;
  String get city => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String get severity => throw _privateConstructorUsedError;
  String get escalationTier => throw _privateConstructorUsedError;
  int get currentRadiusMeters => throw _privateConstructorUsedError;
  String? get assignedHelperId => throw _privateConstructorUsedError;
  String? get resolvedAt => throw _privateConstructorUsedError;
  String get createdAt =>
      throw _privateConstructorUsedError; // Reverse-geocoded from latitude/longitude at creation time (ADR-038) — null if the
  // lookup failed/timed out, OR redacted for a non-privileged pre-assignment viewer (ADR-045);
  // fall back to `city`/raw coordinates when null.
  String? get placeName => throw _privateConstructorUsedError;
  String? get area => throw _privateConstructorUsedError;
  String? get formattedAddress =>
      throw _privateConstructorUsedError; // From the reporting rider's own RiderProfile (ADR-044) — most riders never fill this in.
  String? get riderVehicleType => throw _privateConstructorUsedError;
  String? get riderVehicleBrand => throw _privateConstructorUsedError;
  String? get riderVehicleModel =>
      throw _privateConstructorUsedError; // ADR-045 — server-computed distance from the viewer's own supplied lat/lng; only populated
  // on the active-alerts list (`GET /api/sos/alerts?lat=&lng=`), null elsewhere. Compensates
  // for latitude/longitude being redacted pre-assignment.
  num? get distanceMeters => throw _privateConstructorUsedError;

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
    String? userEmail,
    String type,
    String? description,
    num? latitude,
    num? longitude,
    String city,
    String status,
    String severity,
    String escalationTier,
    int currentRadiusMeters,
    String? assignedHelperId,
    String? resolvedAt,
    String createdAt,
    String? placeName,
    String? area,
    String? formattedAddress,
    String? riderVehicleType,
    String? riderVehicleBrand,
    String? riderVehicleModel,
    num? distanceMeters,
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
    Object? userEmail = freezed,
    Object? type = null,
    Object? description = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? city = null,
    Object? status = null,
    Object? severity = null,
    Object? escalationTier = null,
    Object? currentRadiusMeters = null,
    Object? assignedHelperId = freezed,
    Object? resolvedAt = freezed,
    Object? createdAt = null,
    Object? placeName = freezed,
    Object? area = freezed,
    Object? formattedAddress = freezed,
    Object? riderVehicleType = freezed,
    Object? riderVehicleBrand = freezed,
    Object? riderVehicleModel = freezed,
    Object? distanceMeters = freezed,
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
            userEmail: freezed == userEmail
                ? _value.userEmail
                : userEmail // ignore: cast_nullable_to_non_nullable
                      as String?,
            type: null == type
                ? _value.type
                : type // ignore: cast_nullable_to_non_nullable
                      as String,
            description: freezed == description
                ? _value.description
                : description // ignore: cast_nullable_to_non_nullable
                      as String?,
            latitude: freezed == latitude
                ? _value.latitude
                : latitude // ignore: cast_nullable_to_non_nullable
                      as num?,
            longitude: freezed == longitude
                ? _value.longitude
                : longitude // ignore: cast_nullable_to_non_nullable
                      as num?,
            city: null == city
                ? _value.city
                : city // ignore: cast_nullable_to_non_nullable
                      as String,
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String,
            severity: null == severity
                ? _value.severity
                : severity // ignore: cast_nullable_to_non_nullable
                      as String,
            escalationTier: null == escalationTier
                ? _value.escalationTier
                : escalationTier // ignore: cast_nullable_to_non_nullable
                      as String,
            currentRadiusMeters: null == currentRadiusMeters
                ? _value.currentRadiusMeters
                : currentRadiusMeters // ignore: cast_nullable_to_non_nullable
                      as int,
            assignedHelperId: freezed == assignedHelperId
                ? _value.assignedHelperId
                : assignedHelperId // ignore: cast_nullable_to_non_nullable
                      as String?,
            resolvedAt: freezed == resolvedAt
                ? _value.resolvedAt
                : resolvedAt // ignore: cast_nullable_to_non_nullable
                      as String?,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as String,
            placeName: freezed == placeName
                ? _value.placeName
                : placeName // ignore: cast_nullable_to_non_nullable
                      as String?,
            area: freezed == area
                ? _value.area
                : area // ignore: cast_nullable_to_non_nullable
                      as String?,
            formattedAddress: freezed == formattedAddress
                ? _value.formattedAddress
                : formattedAddress // ignore: cast_nullable_to_non_nullable
                      as String?,
            riderVehicleType: freezed == riderVehicleType
                ? _value.riderVehicleType
                : riderVehicleType // ignore: cast_nullable_to_non_nullable
                      as String?,
            riderVehicleBrand: freezed == riderVehicleBrand
                ? _value.riderVehicleBrand
                : riderVehicleBrand // ignore: cast_nullable_to_non_nullable
                      as String?,
            riderVehicleModel: freezed == riderVehicleModel
                ? _value.riderVehicleModel
                : riderVehicleModel // ignore: cast_nullable_to_non_nullable
                      as String?,
            distanceMeters: freezed == distanceMeters
                ? _value.distanceMeters
                : distanceMeters // ignore: cast_nullable_to_non_nullable
                      as num?,
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
    String? userEmail,
    String type,
    String? description,
    num? latitude,
    num? longitude,
    String city,
    String status,
    String severity,
    String escalationTier,
    int currentRadiusMeters,
    String? assignedHelperId,
    String? resolvedAt,
    String createdAt,
    String? placeName,
    String? area,
    String? formattedAddress,
    String? riderVehicleType,
    String? riderVehicleBrand,
    String? riderVehicleModel,
    num? distanceMeters,
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
    Object? userEmail = freezed,
    Object? type = null,
    Object? description = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? city = null,
    Object? status = null,
    Object? severity = null,
    Object? escalationTier = null,
    Object? currentRadiusMeters = null,
    Object? assignedHelperId = freezed,
    Object? resolvedAt = freezed,
    Object? createdAt = null,
    Object? placeName = freezed,
    Object? area = freezed,
    Object? formattedAddress = freezed,
    Object? riderVehicleType = freezed,
    Object? riderVehicleBrand = freezed,
    Object? riderVehicleModel = freezed,
    Object? distanceMeters = freezed,
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
        userEmail: freezed == userEmail
            ? _value.userEmail
            : userEmail // ignore: cast_nullable_to_non_nullable
                  as String?,
        type: null == type
            ? _value.type
            : type // ignore: cast_nullable_to_non_nullable
                  as String,
        description: freezed == description
            ? _value.description
            : description // ignore: cast_nullable_to_non_nullable
                  as String?,
        latitude: freezed == latitude
            ? _value.latitude
            : latitude // ignore: cast_nullable_to_non_nullable
                  as num?,
        longitude: freezed == longitude
            ? _value.longitude
            : longitude // ignore: cast_nullable_to_non_nullable
                  as num?,
        city: null == city
            ? _value.city
            : city // ignore: cast_nullable_to_non_nullable
                  as String,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
        severity: null == severity
            ? _value.severity
            : severity // ignore: cast_nullable_to_non_nullable
                  as String,
        escalationTier: null == escalationTier
            ? _value.escalationTier
            : escalationTier // ignore: cast_nullable_to_non_nullable
                  as String,
        currentRadiusMeters: null == currentRadiusMeters
            ? _value.currentRadiusMeters
            : currentRadiusMeters // ignore: cast_nullable_to_non_nullable
                  as int,
        assignedHelperId: freezed == assignedHelperId
            ? _value.assignedHelperId
            : assignedHelperId // ignore: cast_nullable_to_non_nullable
                  as String?,
        resolvedAt: freezed == resolvedAt
            ? _value.resolvedAt
            : resolvedAt // ignore: cast_nullable_to_non_nullable
                  as String?,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as String,
        placeName: freezed == placeName
            ? _value.placeName
            : placeName // ignore: cast_nullable_to_non_nullable
                  as String?,
        area: freezed == area
            ? _value.area
            : area // ignore: cast_nullable_to_non_nullable
                  as String?,
        formattedAddress: freezed == formattedAddress
            ? _value.formattedAddress
            : formattedAddress // ignore: cast_nullable_to_non_nullable
                  as String?,
        riderVehicleType: freezed == riderVehicleType
            ? _value.riderVehicleType
            : riderVehicleType // ignore: cast_nullable_to_non_nullable
                  as String?,
        riderVehicleBrand: freezed == riderVehicleBrand
            ? _value.riderVehicleBrand
            : riderVehicleBrand // ignore: cast_nullable_to_non_nullable
                  as String?,
        riderVehicleModel: freezed == riderVehicleModel
            ? _value.riderVehicleModel
            : riderVehicleModel // ignore: cast_nullable_to_non_nullable
                  as String?,
        distanceMeters: freezed == distanceMeters
            ? _value.distanceMeters
            : distanceMeters // ignore: cast_nullable_to_non_nullable
                  as num?,
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
    this.userEmail,
    required this.type,
    this.description,
    this.latitude,
    this.longitude,
    required this.city,
    required this.status,
    required this.severity,
    required this.escalationTier,
    required this.currentRadiusMeters,
    this.assignedHelperId,
    this.resolvedAt,
    required this.createdAt,
    this.placeName,
    this.area,
    this.formattedAddress,
    this.riderVehicleType,
    this.riderVehicleBrand,
    this.riderVehicleModel,
    this.distanceMeters,
  });

  factory _$SOSAlertImpl.fromJson(Map<String, dynamic> json) =>
      _$$SOSAlertImplFromJson(json);

  @override
  final String id;
  @override
  final String userId;
  @override
  final String userName;
  // ADR-045 — phone/email/exact location are null unless the viewer is the reporter, the
  // assigned helper, or an admin (see redactAlertForViewer, packages/services). Every screen
  // that reads these must handle null, not just "missing profile field."
  @override
  final String? userPhone;
  @override
  final String? userEmail;
  @override
  final String type;
  @override
  final String? description;
  @override
  final num? latitude;
  @override
  final num? longitude;
  @override
  final String city;
  @override
  final String status;
  @override
  final String severity;
  @override
  final String escalationTier;
  @override
  final int currentRadiusMeters;
  @override
  final String? assignedHelperId;
  @override
  final String? resolvedAt;
  @override
  final String createdAt;
  // Reverse-geocoded from latitude/longitude at creation time (ADR-038) — null if the
  // lookup failed/timed out, OR redacted for a non-privileged pre-assignment viewer (ADR-045);
  // fall back to `city`/raw coordinates when null.
  @override
  final String? placeName;
  @override
  final String? area;
  @override
  final String? formattedAddress;
  // From the reporting rider's own RiderProfile (ADR-044) — most riders never fill this in.
  @override
  final String? riderVehicleType;
  @override
  final String? riderVehicleBrand;
  @override
  final String? riderVehicleModel;
  // ADR-045 — server-computed distance from the viewer's own supplied lat/lng; only populated
  // on the active-alerts list (`GET /api/sos/alerts?lat=&lng=`), null elsewhere. Compensates
  // for latitude/longitude being redacted pre-assignment.
  @override
  final num? distanceMeters;

  @override
  String toString() {
    return 'SOSAlert(id: $id, userId: $userId, userName: $userName, userPhone: $userPhone, userEmail: $userEmail, type: $type, description: $description, latitude: $latitude, longitude: $longitude, city: $city, status: $status, severity: $severity, escalationTier: $escalationTier, currentRadiusMeters: $currentRadiusMeters, assignedHelperId: $assignedHelperId, resolvedAt: $resolvedAt, createdAt: $createdAt, placeName: $placeName, area: $area, formattedAddress: $formattedAddress, riderVehicleType: $riderVehicleType, riderVehicleBrand: $riderVehicleBrand, riderVehicleModel: $riderVehicleModel, distanceMeters: $distanceMeters)';
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
            (identical(other.severity, severity) ||
                other.severity == severity) &&
            (identical(other.escalationTier, escalationTier) ||
                other.escalationTier == escalationTier) &&
            (identical(other.currentRadiusMeters, currentRadiusMeters) ||
                other.currentRadiusMeters == currentRadiusMeters) &&
            (identical(other.assignedHelperId, assignedHelperId) ||
                other.assignedHelperId == assignedHelperId) &&
            (identical(other.resolvedAt, resolvedAt) ||
                other.resolvedAt == resolvedAt) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.placeName, placeName) ||
                other.placeName == placeName) &&
            (identical(other.area, area) || other.area == area) &&
            (identical(other.formattedAddress, formattedAddress) ||
                other.formattedAddress == formattedAddress) &&
            (identical(other.riderVehicleType, riderVehicleType) ||
                other.riderVehicleType == riderVehicleType) &&
            (identical(other.riderVehicleBrand, riderVehicleBrand) ||
                other.riderVehicleBrand == riderVehicleBrand) &&
            (identical(other.riderVehicleModel, riderVehicleModel) ||
                other.riderVehicleModel == riderVehicleModel) &&
            (identical(other.distanceMeters, distanceMeters) ||
                other.distanceMeters == distanceMeters));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hashAll([
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
    severity,
    escalationTier,
    currentRadiusMeters,
    assignedHelperId,
    resolvedAt,
    createdAt,
    placeName,
    area,
    formattedAddress,
    riderVehicleType,
    riderVehicleBrand,
    riderVehicleModel,
    distanceMeters,
  ]);

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
    required String id,
    required String userId,
    required String userName,
    String? userPhone,
    String? userEmail,
    required String type,
    String? description,
    num? latitude,
    num? longitude,
    required String city,
    required String status,
    required String severity,
    required String escalationTier,
    required int currentRadiusMeters,
    String? assignedHelperId,
    String? resolvedAt,
    required String createdAt,
    String? placeName,
    String? area,
    String? formattedAddress,
    String? riderVehicleType,
    String? riderVehicleBrand,
    String? riderVehicleModel,
    num? distanceMeters,
  }) = _$SOSAlertImpl;

  factory _SOSAlert.fromJson(Map<String, dynamic> json) =
      _$SOSAlertImpl.fromJson;

  @override
  String get id;
  @override
  String get userId;
  @override
  String get userName; // ADR-045 — phone/email/exact location are null unless the viewer is the reporter, the
  // assigned helper, or an admin (see redactAlertForViewer, packages/services). Every screen
  // that reads these must handle null, not just "missing profile field."
  @override
  String? get userPhone;
  @override
  String? get userEmail;
  @override
  String get type;
  @override
  String? get description;
  @override
  num? get latitude;
  @override
  num? get longitude;
  @override
  String get city;
  @override
  String get status;
  @override
  String get severity;
  @override
  String get escalationTier;
  @override
  int get currentRadiusMeters;
  @override
  String? get assignedHelperId;
  @override
  String? get resolvedAt;
  @override
  String get createdAt; // Reverse-geocoded from latitude/longitude at creation time (ADR-038) — null if the
  // lookup failed/timed out, OR redacted for a non-privileged pre-assignment viewer (ADR-045);
  // fall back to `city`/raw coordinates when null.
  @override
  String? get placeName;
  @override
  String? get area;
  @override
  String? get formattedAddress; // From the reporting rider's own RiderProfile (ADR-044) — most riders never fill this in.
  @override
  String? get riderVehicleType;
  @override
  String? get riderVehicleBrand;
  @override
  String? get riderVehicleModel; // ADR-045 — server-computed distance from the viewer's own supplied lat/lng; only populated
  // on the active-alerts list (`GET /api/sos/alerts?lat=&lng=`), null elsewhere. Compensates
  // for latitude/longitude being redacted pre-assignment.
  @override
  num? get distanceMeters;

  /// Create a copy of SOSAlert
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SOSAlertImplCopyWith<_$SOSAlertImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

SOSHistoryEntry _$SOSHistoryEntryFromJson(Map<String, dynamic> json) {
  return _SOSHistoryEntry.fromJson(json);
}

/// @nodoc
mixin _$SOSHistoryEntry {
  String get id => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  String get city => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String get severity => throw _privateConstructorUsedError;
  String get escalationTier => throw _privateConstructorUsedError;
  String? get assignedHelperId => throw _privateConstructorUsedError;
  String? get resolvedAt => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;
  List<SOSHistoryResponse> get responses => throw _privateConstructorUsedError;

  /// Serializes this SOSHistoryEntry to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SOSHistoryEntry
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SOSHistoryEntryCopyWith<SOSHistoryEntry> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SOSHistoryEntryCopyWith<$Res> {
  factory $SOSHistoryEntryCopyWith(
    SOSHistoryEntry value,
    $Res Function(SOSHistoryEntry) then,
  ) = _$SOSHistoryEntryCopyWithImpl<$Res, SOSHistoryEntry>;
  @useResult
  $Res call({
    String id,
    String type,
    String? description,
    String city,
    String status,
    String severity,
    String escalationTier,
    String? assignedHelperId,
    String? resolvedAt,
    String createdAt,
    List<SOSHistoryResponse> responses,
  });
}

/// @nodoc
class _$SOSHistoryEntryCopyWithImpl<$Res, $Val extends SOSHistoryEntry>
    implements $SOSHistoryEntryCopyWith<$Res> {
  _$SOSHistoryEntryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SOSHistoryEntry
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? description = freezed,
    Object? city = null,
    Object? status = null,
    Object? severity = null,
    Object? escalationTier = null,
    Object? assignedHelperId = freezed,
    Object? resolvedAt = freezed,
    Object? createdAt = null,
    Object? responses = null,
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
            description: freezed == description
                ? _value.description
                : description // ignore: cast_nullable_to_non_nullable
                      as String?,
            city: null == city
                ? _value.city
                : city // ignore: cast_nullable_to_non_nullable
                      as String,
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String,
            severity: null == severity
                ? _value.severity
                : severity // ignore: cast_nullable_to_non_nullable
                      as String,
            escalationTier: null == escalationTier
                ? _value.escalationTier
                : escalationTier // ignore: cast_nullable_to_non_nullable
                      as String,
            assignedHelperId: freezed == assignedHelperId
                ? _value.assignedHelperId
                : assignedHelperId // ignore: cast_nullable_to_non_nullable
                      as String?,
            resolvedAt: freezed == resolvedAt
                ? _value.resolvedAt
                : resolvedAt // ignore: cast_nullable_to_non_nullable
                      as String?,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as String,
            responses: null == responses
                ? _value.responses
                : responses // ignore: cast_nullable_to_non_nullable
                      as List<SOSHistoryResponse>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$SOSHistoryEntryImplCopyWith<$Res>
    implements $SOSHistoryEntryCopyWith<$Res> {
  factory _$$SOSHistoryEntryImplCopyWith(
    _$SOSHistoryEntryImpl value,
    $Res Function(_$SOSHistoryEntryImpl) then,
  ) = __$$SOSHistoryEntryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String type,
    String? description,
    String city,
    String status,
    String severity,
    String escalationTier,
    String? assignedHelperId,
    String? resolvedAt,
    String createdAt,
    List<SOSHistoryResponse> responses,
  });
}

/// @nodoc
class __$$SOSHistoryEntryImplCopyWithImpl<$Res>
    extends _$SOSHistoryEntryCopyWithImpl<$Res, _$SOSHistoryEntryImpl>
    implements _$$SOSHistoryEntryImplCopyWith<$Res> {
  __$$SOSHistoryEntryImplCopyWithImpl(
    _$SOSHistoryEntryImpl _value,
    $Res Function(_$SOSHistoryEntryImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SOSHistoryEntry
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? description = freezed,
    Object? city = null,
    Object? status = null,
    Object? severity = null,
    Object? escalationTier = null,
    Object? assignedHelperId = freezed,
    Object? resolvedAt = freezed,
    Object? createdAt = null,
    Object? responses = null,
  }) {
    return _then(
      _$SOSHistoryEntryImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        type: null == type
            ? _value.type
            : type // ignore: cast_nullable_to_non_nullable
                  as String,
        description: freezed == description
            ? _value.description
            : description // ignore: cast_nullable_to_non_nullable
                  as String?,
        city: null == city
            ? _value.city
            : city // ignore: cast_nullable_to_non_nullable
                  as String,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
        severity: null == severity
            ? _value.severity
            : severity // ignore: cast_nullable_to_non_nullable
                  as String,
        escalationTier: null == escalationTier
            ? _value.escalationTier
            : escalationTier // ignore: cast_nullable_to_non_nullable
                  as String,
        assignedHelperId: freezed == assignedHelperId
            ? _value.assignedHelperId
            : assignedHelperId // ignore: cast_nullable_to_non_nullable
                  as String?,
        resolvedAt: freezed == resolvedAt
            ? _value.resolvedAt
            : resolvedAt // ignore: cast_nullable_to_non_nullable
                  as String?,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as String,
        responses: null == responses
            ? _value._responses
            : responses // ignore: cast_nullable_to_non_nullable
                  as List<SOSHistoryResponse>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$SOSHistoryEntryImpl implements _SOSHistoryEntry {
  const _$SOSHistoryEntryImpl({
    required this.id,
    required this.type,
    this.description,
    required this.city,
    required this.status,
    required this.severity,
    required this.escalationTier,
    this.assignedHelperId,
    this.resolvedAt,
    required this.createdAt,
    List<SOSHistoryResponse> responses = const [],
  }) : _responses = responses;

  factory _$SOSHistoryEntryImpl.fromJson(Map<String, dynamic> json) =>
      _$$SOSHistoryEntryImplFromJson(json);

  @override
  final String id;
  @override
  final String type;
  @override
  final String? description;
  @override
  final String city;
  @override
  final String status;
  @override
  final String severity;
  @override
  final String escalationTier;
  @override
  final String? assignedHelperId;
  @override
  final String? resolvedAt;
  @override
  final String createdAt;
  final List<SOSHistoryResponse> _responses;
  @override
  @JsonKey()
  List<SOSHistoryResponse> get responses {
    if (_responses is EqualUnmodifiableListView) return _responses;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_responses);
  }

  @override
  String toString() {
    return 'SOSHistoryEntry(id: $id, type: $type, description: $description, city: $city, status: $status, severity: $severity, escalationTier: $escalationTier, assignedHelperId: $assignedHelperId, resolvedAt: $resolvedAt, createdAt: $createdAt, responses: $responses)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SOSHistoryEntryImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.city, city) || other.city == city) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.severity, severity) ||
                other.severity == severity) &&
            (identical(other.escalationTier, escalationTier) ||
                other.escalationTier == escalationTier) &&
            (identical(other.assignedHelperId, assignedHelperId) ||
                other.assignedHelperId == assignedHelperId) &&
            (identical(other.resolvedAt, resolvedAt) ||
                other.resolvedAt == resolvedAt) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            const DeepCollectionEquality().equals(
              other._responses,
              _responses,
            ));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    type,
    description,
    city,
    status,
    severity,
    escalationTier,
    assignedHelperId,
    resolvedAt,
    createdAt,
    const DeepCollectionEquality().hash(_responses),
  );

  /// Create a copy of SOSHistoryEntry
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SOSHistoryEntryImplCopyWith<_$SOSHistoryEntryImpl> get copyWith =>
      __$$SOSHistoryEntryImplCopyWithImpl<_$SOSHistoryEntryImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$SOSHistoryEntryImplToJson(this);
  }
}

abstract class _SOSHistoryEntry implements SOSHistoryEntry {
  const factory _SOSHistoryEntry({
    required String id,
    required String type,
    String? description,
    required String city,
    required String status,
    required String severity,
    required String escalationTier,
    String? assignedHelperId,
    String? resolvedAt,
    required String createdAt,
    List<SOSHistoryResponse> responses,
  }) = _$SOSHistoryEntryImpl;

  factory _SOSHistoryEntry.fromJson(Map<String, dynamic> json) =
      _$SOSHistoryEntryImpl.fromJson;

  @override
  String get id;
  @override
  String get type;
  @override
  String? get description;
  @override
  String get city;
  @override
  String get status;
  @override
  String get severity;
  @override
  String get escalationTier;
  @override
  String? get assignedHelperId;
  @override
  String? get resolvedAt;
  @override
  String get createdAt;
  @override
  List<SOSHistoryResponse> get responses;

  /// Create a copy of SOSHistoryEntry
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SOSHistoryEntryImplCopyWith<_$SOSHistoryEntryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

SOSHistoryResponse _$SOSHistoryResponseFromJson(Map<String, dynamic> json) {
  return _SOSHistoryResponse.fromJson(json);
}

/// @nodoc
mixin _$SOSHistoryResponse {
  String get id => throw _privateConstructorUsedError;
  String get responderName => throw _privateConstructorUsedError;
  String? get message => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;

  /// Serializes this SOSHistoryResponse to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SOSHistoryResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SOSHistoryResponseCopyWith<SOSHistoryResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SOSHistoryResponseCopyWith<$Res> {
  factory $SOSHistoryResponseCopyWith(
    SOSHistoryResponse value,
    $Res Function(SOSHistoryResponse) then,
  ) = _$SOSHistoryResponseCopyWithImpl<$Res, SOSHistoryResponse>;
  @useResult
  $Res call({
    String id,
    String responderName,
    String? message,
    String createdAt,
  });
}

/// @nodoc
class _$SOSHistoryResponseCopyWithImpl<$Res, $Val extends SOSHistoryResponse>
    implements $SOSHistoryResponseCopyWith<$Res> {
  _$SOSHistoryResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SOSHistoryResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? responderName = null,
    Object? message = freezed,
    Object? createdAt = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            responderName: null == responderName
                ? _value.responderName
                : responderName // ignore: cast_nullable_to_non_nullable
                      as String,
            message: freezed == message
                ? _value.message
                : message // ignore: cast_nullable_to_non_nullable
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
abstract class _$$SOSHistoryResponseImplCopyWith<$Res>
    implements $SOSHistoryResponseCopyWith<$Res> {
  factory _$$SOSHistoryResponseImplCopyWith(
    _$SOSHistoryResponseImpl value,
    $Res Function(_$SOSHistoryResponseImpl) then,
  ) = __$$SOSHistoryResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String responderName,
    String? message,
    String createdAt,
  });
}

/// @nodoc
class __$$SOSHistoryResponseImplCopyWithImpl<$Res>
    extends _$SOSHistoryResponseCopyWithImpl<$Res, _$SOSHistoryResponseImpl>
    implements _$$SOSHistoryResponseImplCopyWith<$Res> {
  __$$SOSHistoryResponseImplCopyWithImpl(
    _$SOSHistoryResponseImpl _value,
    $Res Function(_$SOSHistoryResponseImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SOSHistoryResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? responderName = null,
    Object? message = freezed,
    Object? createdAt = null,
  }) {
    return _then(
      _$SOSHistoryResponseImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        responderName: null == responderName
            ? _value.responderName
            : responderName // ignore: cast_nullable_to_non_nullable
                  as String,
        message: freezed == message
            ? _value.message
            : message // ignore: cast_nullable_to_non_nullable
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
class _$SOSHistoryResponseImpl implements _SOSHistoryResponse {
  const _$SOSHistoryResponseImpl({
    required this.id,
    required this.responderName,
    this.message,
    required this.createdAt,
  });

  factory _$SOSHistoryResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$SOSHistoryResponseImplFromJson(json);

  @override
  final String id;
  @override
  final String responderName;
  @override
  final String? message;
  @override
  final String createdAt;

  @override
  String toString() {
    return 'SOSHistoryResponse(id: $id, responderName: $responderName, message: $message, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SOSHistoryResponseImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.responderName, responderName) ||
                other.responderName == responderName) &&
            (identical(other.message, message) || other.message == message) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, id, responderName, message, createdAt);

  /// Create a copy of SOSHistoryResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SOSHistoryResponseImplCopyWith<_$SOSHistoryResponseImpl> get copyWith =>
      __$$SOSHistoryResponseImplCopyWithImpl<_$SOSHistoryResponseImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$SOSHistoryResponseImplToJson(this);
  }
}

abstract class _SOSHistoryResponse implements SOSHistoryResponse {
  const factory _SOSHistoryResponse({
    required String id,
    required String responderName,
    String? message,
    required String createdAt,
  }) = _$SOSHistoryResponseImpl;

  factory _SOSHistoryResponse.fromJson(Map<String, dynamic> json) =
      _$SOSHistoryResponseImpl.fromJson;

  @override
  String get id;
  @override
  String get responderName;
  @override
  String? get message;
  @override
  String get createdAt;

  /// Create a copy of SOSHistoryResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SOSHistoryResponseImplCopyWith<_$SOSHistoryResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

SOSOffer _$SOSOfferFromJson(Map<String, dynamic> json) {
  return _SOSOffer.fromJson(json);
}

/// @nodoc
mixin _$SOSOffer {
  String get id => throw _privateConstructorUsedError;
  String get alertId => throw _privateConstructorUsedError;
  String get responderId => throw _privateConstructorUsedError;
  String get responderName => throw _privateConstructorUsedError;
  String? get responderPhone => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  num? get distanceMeters => throw _privateConstructorUsedError;
  int? get etaMinutes => throw _privateConstructorUsedError;
  String? get message => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;

  /// Serializes this SOSOffer to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SOSOffer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SOSOfferCopyWith<SOSOffer> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SOSOfferCopyWith<$Res> {
  factory $SOSOfferCopyWith(SOSOffer value, $Res Function(SOSOffer) then) =
      _$SOSOfferCopyWithImpl<$Res, SOSOffer>;
  @useResult
  $Res call({
    String id,
    String alertId,
    String responderId,
    String responderName,
    String? responderPhone,
    String status,
    num? distanceMeters,
    int? etaMinutes,
    String? message,
    String createdAt,
  });
}

/// @nodoc
class _$SOSOfferCopyWithImpl<$Res, $Val extends SOSOffer>
    implements $SOSOfferCopyWith<$Res> {
  _$SOSOfferCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SOSOffer
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? alertId = null,
    Object? responderId = null,
    Object? responderName = null,
    Object? responderPhone = freezed,
    Object? status = null,
    Object? distanceMeters = freezed,
    Object? etaMinutes = freezed,
    Object? message = freezed,
    Object? createdAt = null,
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
            responderId: null == responderId
                ? _value.responderId
                : responderId // ignore: cast_nullable_to_non_nullable
                      as String,
            responderName: null == responderName
                ? _value.responderName
                : responderName // ignore: cast_nullable_to_non_nullable
                      as String,
            responderPhone: freezed == responderPhone
                ? _value.responderPhone
                : responderPhone // ignore: cast_nullable_to_non_nullable
                      as String?,
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String,
            distanceMeters: freezed == distanceMeters
                ? _value.distanceMeters
                : distanceMeters // ignore: cast_nullable_to_non_nullable
                      as num?,
            etaMinutes: freezed == etaMinutes
                ? _value.etaMinutes
                : etaMinutes // ignore: cast_nullable_to_non_nullable
                      as int?,
            message: freezed == message
                ? _value.message
                : message // ignore: cast_nullable_to_non_nullable
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
abstract class _$$SOSOfferImplCopyWith<$Res>
    implements $SOSOfferCopyWith<$Res> {
  factory _$$SOSOfferImplCopyWith(
    _$SOSOfferImpl value,
    $Res Function(_$SOSOfferImpl) then,
  ) = __$$SOSOfferImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String alertId,
    String responderId,
    String responderName,
    String? responderPhone,
    String status,
    num? distanceMeters,
    int? etaMinutes,
    String? message,
    String createdAt,
  });
}

/// @nodoc
class __$$SOSOfferImplCopyWithImpl<$Res>
    extends _$SOSOfferCopyWithImpl<$Res, _$SOSOfferImpl>
    implements _$$SOSOfferImplCopyWith<$Res> {
  __$$SOSOfferImplCopyWithImpl(
    _$SOSOfferImpl _value,
    $Res Function(_$SOSOfferImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SOSOffer
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? alertId = null,
    Object? responderId = null,
    Object? responderName = null,
    Object? responderPhone = freezed,
    Object? status = null,
    Object? distanceMeters = freezed,
    Object? etaMinutes = freezed,
    Object? message = freezed,
    Object? createdAt = null,
  }) {
    return _then(
      _$SOSOfferImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        alertId: null == alertId
            ? _value.alertId
            : alertId // ignore: cast_nullable_to_non_nullable
                  as String,
        responderId: null == responderId
            ? _value.responderId
            : responderId // ignore: cast_nullable_to_non_nullable
                  as String,
        responderName: null == responderName
            ? _value.responderName
            : responderName // ignore: cast_nullable_to_non_nullable
                  as String,
        responderPhone: freezed == responderPhone
            ? _value.responderPhone
            : responderPhone // ignore: cast_nullable_to_non_nullable
                  as String?,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
        distanceMeters: freezed == distanceMeters
            ? _value.distanceMeters
            : distanceMeters // ignore: cast_nullable_to_non_nullable
                  as num?,
        etaMinutes: freezed == etaMinutes
            ? _value.etaMinutes
            : etaMinutes // ignore: cast_nullable_to_non_nullable
                  as int?,
        message: freezed == message
            ? _value.message
            : message // ignore: cast_nullable_to_non_nullable
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
class _$SOSOfferImpl implements _SOSOffer {
  const _$SOSOfferImpl({
    required this.id,
    required this.alertId,
    required this.responderId,
    required this.responderName,
    this.responderPhone,
    required this.status,
    this.distanceMeters,
    this.etaMinutes,
    this.message,
    required this.createdAt,
  });

  factory _$SOSOfferImpl.fromJson(Map<String, dynamic> json) =>
      _$$SOSOfferImplFromJson(json);

  @override
  final String id;
  @override
  final String alertId;
  @override
  final String responderId;
  @override
  final String responderName;
  @override
  final String? responderPhone;
  @override
  final String status;
  @override
  final num? distanceMeters;
  @override
  final int? etaMinutes;
  @override
  final String? message;
  @override
  final String createdAt;

  @override
  String toString() {
    return 'SOSOffer(id: $id, alertId: $alertId, responderId: $responderId, responderName: $responderName, responderPhone: $responderPhone, status: $status, distanceMeters: $distanceMeters, etaMinutes: $etaMinutes, message: $message, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SOSOfferImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.alertId, alertId) || other.alertId == alertId) &&
            (identical(other.responderId, responderId) ||
                other.responderId == responderId) &&
            (identical(other.responderName, responderName) ||
                other.responderName == responderName) &&
            (identical(other.responderPhone, responderPhone) ||
                other.responderPhone == responderPhone) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.distanceMeters, distanceMeters) ||
                other.distanceMeters == distanceMeters) &&
            (identical(other.etaMinutes, etaMinutes) ||
                other.etaMinutes == etaMinutes) &&
            (identical(other.message, message) || other.message == message) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    alertId,
    responderId,
    responderName,
    responderPhone,
    status,
    distanceMeters,
    etaMinutes,
    message,
    createdAt,
  );

  /// Create a copy of SOSOffer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SOSOfferImplCopyWith<_$SOSOfferImpl> get copyWith =>
      __$$SOSOfferImplCopyWithImpl<_$SOSOfferImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$SOSOfferImplToJson(this);
  }
}

abstract class _SOSOffer implements SOSOffer {
  const factory _SOSOffer({
    required String id,
    required String alertId,
    required String responderId,
    required String responderName,
    String? responderPhone,
    required String status,
    num? distanceMeters,
    int? etaMinutes,
    String? message,
    required String createdAt,
  }) = _$SOSOfferImpl;

  factory _SOSOffer.fromJson(Map<String, dynamic> json) =
      _$SOSOfferImpl.fromJson;

  @override
  String get id;
  @override
  String get alertId;
  @override
  String get responderId;
  @override
  String get responderName;
  @override
  String? get responderPhone;
  @override
  String get status;
  @override
  num? get distanceMeters;
  @override
  int? get etaMinutes;
  @override
  String? get message;
  @override
  String get createdAt;

  /// Create a copy of SOSOffer
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SOSOfferImplCopyWith<_$SOSOfferImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

SOSParticipant _$SOSParticipantFromJson(Map<String, dynamic> json) {
  return _SOSParticipant.fromJson(json);
}

/// @nodoc
mixin _$SOSParticipant {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String? get phone => throw _privateConstructorUsedError;
  String get email => throw _privateConstructorUsedError;

  /// Serializes this SOSParticipant to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SOSParticipant
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SOSParticipantCopyWith<SOSParticipant> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SOSParticipantCopyWith<$Res> {
  factory $SOSParticipantCopyWith(
    SOSParticipant value,
    $Res Function(SOSParticipant) then,
  ) = _$SOSParticipantCopyWithImpl<$Res, SOSParticipant>;
  @useResult
  $Res call({String id, String name, String? phone, String email});
}

/// @nodoc
class _$SOSParticipantCopyWithImpl<$Res, $Val extends SOSParticipant>
    implements $SOSParticipantCopyWith<$Res> {
  _$SOSParticipantCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SOSParticipant
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? phone = freezed,
    Object? email = null,
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
            phone: freezed == phone
                ? _value.phone
                : phone // ignore: cast_nullable_to_non_nullable
                      as String?,
            email: null == email
                ? _value.email
                : email // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$SOSParticipantImplCopyWith<$Res>
    implements $SOSParticipantCopyWith<$Res> {
  factory _$$SOSParticipantImplCopyWith(
    _$SOSParticipantImpl value,
    $Res Function(_$SOSParticipantImpl) then,
  ) = __$$SOSParticipantImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, String name, String? phone, String email});
}

/// @nodoc
class __$$SOSParticipantImplCopyWithImpl<$Res>
    extends _$SOSParticipantCopyWithImpl<$Res, _$SOSParticipantImpl>
    implements _$$SOSParticipantImplCopyWith<$Res> {
  __$$SOSParticipantImplCopyWithImpl(
    _$SOSParticipantImpl _value,
    $Res Function(_$SOSParticipantImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SOSParticipant
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? phone = freezed,
    Object? email = null,
  }) {
    return _then(
      _$SOSParticipantImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        phone: freezed == phone
            ? _value.phone
            : phone // ignore: cast_nullable_to_non_nullable
                  as String?,
        email: null == email
            ? _value.email
            : email // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$SOSParticipantImpl implements _SOSParticipant {
  const _$SOSParticipantImpl({
    required this.id,
    required this.name,
    this.phone,
    required this.email,
  });

  factory _$SOSParticipantImpl.fromJson(Map<String, dynamic> json) =>
      _$$SOSParticipantImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String? phone;
  @override
  final String email;

  @override
  String toString() {
    return 'SOSParticipant(id: $id, name: $name, phone: $phone, email: $email)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SOSParticipantImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.phone, phone) || other.phone == phone) &&
            (identical(other.email, email) || other.email == email));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, phone, email);

  /// Create a copy of SOSParticipant
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SOSParticipantImplCopyWith<_$SOSParticipantImpl> get copyWith =>
      __$$SOSParticipantImplCopyWithImpl<_$SOSParticipantImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$SOSParticipantImplToJson(this);
  }
}

abstract class _SOSParticipant implements SOSParticipant {
  const factory _SOSParticipant({
    required String id,
    required String name,
    String? phone,
    required String email,
  }) = _$SOSParticipantImpl;

  factory _SOSParticipant.fromJson(Map<String, dynamic> json) =
      _$SOSParticipantImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String? get phone;
  @override
  String get email;

  /// Create a copy of SOSParticipant
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SOSParticipantImplCopyWith<_$SOSParticipantImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

SOSSessionDetail _$SOSSessionDetailFromJson(Map<String, dynamic> json) {
  return _SOSSessionDetail.fromJson(json);
}

/// @nodoc
mixin _$SOSSessionDetail {
  String get id => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String? get conversationId => throw _privateConstructorUsedError;
  int? get rating => throw _privateConstructorUsedError;
  SOSParticipant get helper => throw _privateConstructorUsedError;
  SOSParticipant get rider => throw _privateConstructorUsedError;

  /// Serializes this SOSSessionDetail to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SOSSessionDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SOSSessionDetailCopyWith<SOSSessionDetail> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SOSSessionDetailCopyWith<$Res> {
  factory $SOSSessionDetailCopyWith(
    SOSSessionDetail value,
    $Res Function(SOSSessionDetail) then,
  ) = _$SOSSessionDetailCopyWithImpl<$Res, SOSSessionDetail>;
  @useResult
  $Res call({
    String id,
    String status,
    String? conversationId,
    int? rating,
    SOSParticipant helper,
    SOSParticipant rider,
  });

  $SOSParticipantCopyWith<$Res> get helper;
  $SOSParticipantCopyWith<$Res> get rider;
}

/// @nodoc
class _$SOSSessionDetailCopyWithImpl<$Res, $Val extends SOSSessionDetail>
    implements $SOSSessionDetailCopyWith<$Res> {
  _$SOSSessionDetailCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SOSSessionDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? status = null,
    Object? conversationId = freezed,
    Object? rating = freezed,
    Object? helper = null,
    Object? rider = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String,
            conversationId: freezed == conversationId
                ? _value.conversationId
                : conversationId // ignore: cast_nullable_to_non_nullable
                      as String?,
            rating: freezed == rating
                ? _value.rating
                : rating // ignore: cast_nullable_to_non_nullable
                      as int?,
            helper: null == helper
                ? _value.helper
                : helper // ignore: cast_nullable_to_non_nullable
                      as SOSParticipant,
            rider: null == rider
                ? _value.rider
                : rider // ignore: cast_nullable_to_non_nullable
                      as SOSParticipant,
          )
          as $Val,
    );
  }

  /// Create a copy of SOSSessionDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $SOSParticipantCopyWith<$Res> get helper {
    return $SOSParticipantCopyWith<$Res>(_value.helper, (value) {
      return _then(_value.copyWith(helper: value) as $Val);
    });
  }

  /// Create a copy of SOSSessionDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $SOSParticipantCopyWith<$Res> get rider {
    return $SOSParticipantCopyWith<$Res>(_value.rider, (value) {
      return _then(_value.copyWith(rider: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$SOSSessionDetailImplCopyWith<$Res>
    implements $SOSSessionDetailCopyWith<$Res> {
  factory _$$SOSSessionDetailImplCopyWith(
    _$SOSSessionDetailImpl value,
    $Res Function(_$SOSSessionDetailImpl) then,
  ) = __$$SOSSessionDetailImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String status,
    String? conversationId,
    int? rating,
    SOSParticipant helper,
    SOSParticipant rider,
  });

  @override
  $SOSParticipantCopyWith<$Res> get helper;
  @override
  $SOSParticipantCopyWith<$Res> get rider;
}

/// @nodoc
class __$$SOSSessionDetailImplCopyWithImpl<$Res>
    extends _$SOSSessionDetailCopyWithImpl<$Res, _$SOSSessionDetailImpl>
    implements _$$SOSSessionDetailImplCopyWith<$Res> {
  __$$SOSSessionDetailImplCopyWithImpl(
    _$SOSSessionDetailImpl _value,
    $Res Function(_$SOSSessionDetailImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SOSSessionDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? status = null,
    Object? conversationId = freezed,
    Object? rating = freezed,
    Object? helper = null,
    Object? rider = null,
  }) {
    return _then(
      _$SOSSessionDetailImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
        conversationId: freezed == conversationId
            ? _value.conversationId
            : conversationId // ignore: cast_nullable_to_non_nullable
                  as String?,
        rating: freezed == rating
            ? _value.rating
            : rating // ignore: cast_nullable_to_non_nullable
                  as int?,
        helper: null == helper
            ? _value.helper
            : helper // ignore: cast_nullable_to_non_nullable
                  as SOSParticipant,
        rider: null == rider
            ? _value.rider
            : rider // ignore: cast_nullable_to_non_nullable
                  as SOSParticipant,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$SOSSessionDetailImpl implements _SOSSessionDetail {
  const _$SOSSessionDetailImpl({
    required this.id,
    required this.status,
    this.conversationId,
    this.rating,
    required this.helper,
    required this.rider,
  });

  factory _$SOSSessionDetailImpl.fromJson(Map<String, dynamic> json) =>
      _$$SOSSessionDetailImplFromJson(json);

  @override
  final String id;
  @override
  final String status;
  @override
  final String? conversationId;
  @override
  final int? rating;
  @override
  final SOSParticipant helper;
  @override
  final SOSParticipant rider;

  @override
  String toString() {
    return 'SOSSessionDetail(id: $id, status: $status, conversationId: $conversationId, rating: $rating, helper: $helper, rider: $rider)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SOSSessionDetailImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.conversationId, conversationId) ||
                other.conversationId == conversationId) &&
            (identical(other.rating, rating) || other.rating == rating) &&
            (identical(other.helper, helper) || other.helper == helper) &&
            (identical(other.rider, rider) || other.rider == rider));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    status,
    conversationId,
    rating,
    helper,
    rider,
  );

  /// Create a copy of SOSSessionDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SOSSessionDetailImplCopyWith<_$SOSSessionDetailImpl> get copyWith =>
      __$$SOSSessionDetailImplCopyWithImpl<_$SOSSessionDetailImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$SOSSessionDetailImplToJson(this);
  }
}

abstract class _SOSSessionDetail implements SOSSessionDetail {
  const factory _SOSSessionDetail({
    required String id,
    required String status,
    String? conversationId,
    int? rating,
    required SOSParticipant helper,
    required SOSParticipant rider,
  }) = _$SOSSessionDetailImpl;

  factory _SOSSessionDetail.fromJson(Map<String, dynamic> json) =
      _$SOSSessionDetailImpl.fromJson;

  @override
  String get id;
  @override
  String get status;
  @override
  String? get conversationId;
  @override
  int? get rating;
  @override
  SOSParticipant get helper;
  @override
  SOSParticipant get rider;

  /// Create a copy of SOSSessionDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SOSSessionDetailImplCopyWith<_$SOSSessionDetailImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

SOSTimelineEvent _$SOSTimelineEventFromJson(Map<String, dynamic> json) {
  return _SOSTimelineEvent.fromJson(json);
}

/// @nodoc
mixin _$SOSTimelineEvent {
  String get id => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String? get actorName => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;

  /// Serializes this SOSTimelineEvent to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SOSTimelineEvent
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SOSTimelineEventCopyWith<SOSTimelineEvent> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SOSTimelineEventCopyWith<$Res> {
  factory $SOSTimelineEventCopyWith(
    SOSTimelineEvent value,
    $Res Function(SOSTimelineEvent) then,
  ) = _$SOSTimelineEventCopyWithImpl<$Res, SOSTimelineEvent>;
  @useResult
  $Res call({String id, String type, String? actorName, String createdAt});
}

/// @nodoc
class _$SOSTimelineEventCopyWithImpl<$Res, $Val extends SOSTimelineEvent>
    implements $SOSTimelineEventCopyWith<$Res> {
  _$SOSTimelineEventCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SOSTimelineEvent
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? actorName = freezed,
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
            actorName: freezed == actorName
                ? _value.actorName
                : actorName // ignore: cast_nullable_to_non_nullable
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
abstract class _$$SOSTimelineEventImplCopyWith<$Res>
    implements $SOSTimelineEventCopyWith<$Res> {
  factory _$$SOSTimelineEventImplCopyWith(
    _$SOSTimelineEventImpl value,
    $Res Function(_$SOSTimelineEventImpl) then,
  ) = __$$SOSTimelineEventImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, String type, String? actorName, String createdAt});
}

/// @nodoc
class __$$SOSTimelineEventImplCopyWithImpl<$Res>
    extends _$SOSTimelineEventCopyWithImpl<$Res, _$SOSTimelineEventImpl>
    implements _$$SOSTimelineEventImplCopyWith<$Res> {
  __$$SOSTimelineEventImplCopyWithImpl(
    _$SOSTimelineEventImpl _value,
    $Res Function(_$SOSTimelineEventImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SOSTimelineEvent
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? actorName = freezed,
    Object? createdAt = null,
  }) {
    return _then(
      _$SOSTimelineEventImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        type: null == type
            ? _value.type
            : type // ignore: cast_nullable_to_non_nullable
                  as String,
        actorName: freezed == actorName
            ? _value.actorName
            : actorName // ignore: cast_nullable_to_non_nullable
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
class _$SOSTimelineEventImpl implements _SOSTimelineEvent {
  const _$SOSTimelineEventImpl({
    required this.id,
    required this.type,
    this.actorName,
    required this.createdAt,
  });

  factory _$SOSTimelineEventImpl.fromJson(Map<String, dynamic> json) =>
      _$$SOSTimelineEventImplFromJson(json);

  @override
  final String id;
  @override
  final String type;
  @override
  final String? actorName;
  @override
  final String createdAt;

  @override
  String toString() {
    return 'SOSTimelineEvent(id: $id, type: $type, actorName: $actorName, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SOSTimelineEventImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.actorName, actorName) ||
                other.actorName == actorName) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, type, actorName, createdAt);

  /// Create a copy of SOSTimelineEvent
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SOSTimelineEventImplCopyWith<_$SOSTimelineEventImpl> get copyWith =>
      __$$SOSTimelineEventImplCopyWithImpl<_$SOSTimelineEventImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$SOSTimelineEventImplToJson(this);
  }
}

abstract class _SOSTimelineEvent implements SOSTimelineEvent {
  const factory _SOSTimelineEvent({
    required String id,
    required String type,
    String? actorName,
    required String createdAt,
  }) = _$SOSTimelineEventImpl;

  factory _SOSTimelineEvent.fromJson(Map<String, dynamic> json) =
      _$SOSTimelineEventImpl.fromJson;

  @override
  String get id;
  @override
  String get type;
  @override
  String? get actorName;
  @override
  String get createdAt;

  /// Create a copy of SOSTimelineEvent
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SOSTimelineEventImplCopyWith<_$SOSTimelineEventImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

SOSAlertDetail _$SOSAlertDetailFromJson(Map<String, dynamic> json) {
  return _SOSAlertDetail.fromJson(json);
}

/// @nodoc
mixin _$SOSAlertDetail {
  SOSAlert get alert => throw _privateConstructorUsedError;
  List<SOSTimelineEvent> get timeline => throw _privateConstructorUsedError;
  SOSSessionDetail? get session => throw _privateConstructorUsedError;

  /// Serializes this SOSAlertDetail to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SOSAlertDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SOSAlertDetailCopyWith<SOSAlertDetail> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SOSAlertDetailCopyWith<$Res> {
  factory $SOSAlertDetailCopyWith(
    SOSAlertDetail value,
    $Res Function(SOSAlertDetail) then,
  ) = _$SOSAlertDetailCopyWithImpl<$Res, SOSAlertDetail>;
  @useResult
  $Res call({
    SOSAlert alert,
    List<SOSTimelineEvent> timeline,
    SOSSessionDetail? session,
  });

  $SOSAlertCopyWith<$Res> get alert;
  $SOSSessionDetailCopyWith<$Res>? get session;
}

/// @nodoc
class _$SOSAlertDetailCopyWithImpl<$Res, $Val extends SOSAlertDetail>
    implements $SOSAlertDetailCopyWith<$Res> {
  _$SOSAlertDetailCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SOSAlertDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? alert = null,
    Object? timeline = null,
    Object? session = freezed,
  }) {
    return _then(
      _value.copyWith(
            alert: null == alert
                ? _value.alert
                : alert // ignore: cast_nullable_to_non_nullable
                      as SOSAlert,
            timeline: null == timeline
                ? _value.timeline
                : timeline // ignore: cast_nullable_to_non_nullable
                      as List<SOSTimelineEvent>,
            session: freezed == session
                ? _value.session
                : session // ignore: cast_nullable_to_non_nullable
                      as SOSSessionDetail?,
          )
          as $Val,
    );
  }

  /// Create a copy of SOSAlertDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $SOSAlertCopyWith<$Res> get alert {
    return $SOSAlertCopyWith<$Res>(_value.alert, (value) {
      return _then(_value.copyWith(alert: value) as $Val);
    });
  }

  /// Create a copy of SOSAlertDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $SOSSessionDetailCopyWith<$Res>? get session {
    if (_value.session == null) {
      return null;
    }

    return $SOSSessionDetailCopyWith<$Res>(_value.session!, (value) {
      return _then(_value.copyWith(session: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$SOSAlertDetailImplCopyWith<$Res>
    implements $SOSAlertDetailCopyWith<$Res> {
  factory _$$SOSAlertDetailImplCopyWith(
    _$SOSAlertDetailImpl value,
    $Res Function(_$SOSAlertDetailImpl) then,
  ) = __$$SOSAlertDetailImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    SOSAlert alert,
    List<SOSTimelineEvent> timeline,
    SOSSessionDetail? session,
  });

  @override
  $SOSAlertCopyWith<$Res> get alert;
  @override
  $SOSSessionDetailCopyWith<$Res>? get session;
}

/// @nodoc
class __$$SOSAlertDetailImplCopyWithImpl<$Res>
    extends _$SOSAlertDetailCopyWithImpl<$Res, _$SOSAlertDetailImpl>
    implements _$$SOSAlertDetailImplCopyWith<$Res> {
  __$$SOSAlertDetailImplCopyWithImpl(
    _$SOSAlertDetailImpl _value,
    $Res Function(_$SOSAlertDetailImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SOSAlertDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? alert = null,
    Object? timeline = null,
    Object? session = freezed,
  }) {
    return _then(
      _$SOSAlertDetailImpl(
        alert: null == alert
            ? _value.alert
            : alert // ignore: cast_nullable_to_non_nullable
                  as SOSAlert,
        timeline: null == timeline
            ? _value._timeline
            : timeline // ignore: cast_nullable_to_non_nullable
                  as List<SOSTimelineEvent>,
        session: freezed == session
            ? _value.session
            : session // ignore: cast_nullable_to_non_nullable
                  as SOSSessionDetail?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$SOSAlertDetailImpl implements _SOSAlertDetail {
  const _$SOSAlertDetailImpl({
    required this.alert,
    List<SOSTimelineEvent> timeline = const [],
    this.session,
  }) : _timeline = timeline;

  factory _$SOSAlertDetailImpl.fromJson(Map<String, dynamic> json) =>
      _$$SOSAlertDetailImplFromJson(json);

  @override
  final SOSAlert alert;
  final List<SOSTimelineEvent> _timeline;
  @override
  @JsonKey()
  List<SOSTimelineEvent> get timeline {
    if (_timeline is EqualUnmodifiableListView) return _timeline;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_timeline);
  }

  @override
  final SOSSessionDetail? session;

  @override
  String toString() {
    return 'SOSAlertDetail(alert: $alert, timeline: $timeline, session: $session)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SOSAlertDetailImpl &&
            (identical(other.alert, alert) || other.alert == alert) &&
            const DeepCollectionEquality().equals(other._timeline, _timeline) &&
            (identical(other.session, session) || other.session == session));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    alert,
    const DeepCollectionEquality().hash(_timeline),
    session,
  );

  /// Create a copy of SOSAlertDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SOSAlertDetailImplCopyWith<_$SOSAlertDetailImpl> get copyWith =>
      __$$SOSAlertDetailImplCopyWithImpl<_$SOSAlertDetailImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$SOSAlertDetailImplToJson(this);
  }
}

abstract class _SOSAlertDetail implements SOSAlertDetail {
  const factory _SOSAlertDetail({
    required SOSAlert alert,
    List<SOSTimelineEvent> timeline,
    SOSSessionDetail? session,
  }) = _$SOSAlertDetailImpl;

  factory _SOSAlertDetail.fromJson(Map<String, dynamic> json) =
      _$SOSAlertDetailImpl.fromJson;

  @override
  SOSAlert get alert;
  @override
  List<SOSTimelineEvent> get timeline;
  @override
  SOSSessionDetail? get session;

  /// Create a copy of SOSAlertDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SOSAlertDetailImplCopyWith<_$SOSAlertDetailImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

SOSDispatchChannels _$SOSDispatchChannelsFromJson(Map<String, dynamic> json) {
  return _SOSDispatchChannels.fromJson(json);
}

/// @nodoc
mixin _$SOSDispatchChannels {
  bool get sms => throw _privateConstructorUsedError;
  bool get whatsapp => throw _privateConstructorUsedError;
  bool get email => throw _privateConstructorUsedError;

  /// Serializes this SOSDispatchChannels to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SOSDispatchChannels
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SOSDispatchChannelsCopyWith<SOSDispatchChannels> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SOSDispatchChannelsCopyWith<$Res> {
  factory $SOSDispatchChannelsCopyWith(
    SOSDispatchChannels value,
    $Res Function(SOSDispatchChannels) then,
  ) = _$SOSDispatchChannelsCopyWithImpl<$Res, SOSDispatchChannels>;
  @useResult
  $Res call({bool sms, bool whatsapp, bool email});
}

/// @nodoc
class _$SOSDispatchChannelsCopyWithImpl<$Res, $Val extends SOSDispatchChannels>
    implements $SOSDispatchChannelsCopyWith<$Res> {
  _$SOSDispatchChannelsCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SOSDispatchChannels
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? sms = null,
    Object? whatsapp = null,
    Object? email = null,
  }) {
    return _then(
      _value.copyWith(
            sms: null == sms
                ? _value.sms
                : sms // ignore: cast_nullable_to_non_nullable
                      as bool,
            whatsapp: null == whatsapp
                ? _value.whatsapp
                : whatsapp // ignore: cast_nullable_to_non_nullable
                      as bool,
            email: null == email
                ? _value.email
                : email // ignore: cast_nullable_to_non_nullable
                      as bool,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$SOSDispatchChannelsImplCopyWith<$Res>
    implements $SOSDispatchChannelsCopyWith<$Res> {
  factory _$$SOSDispatchChannelsImplCopyWith(
    _$SOSDispatchChannelsImpl value,
    $Res Function(_$SOSDispatchChannelsImpl) then,
  ) = __$$SOSDispatchChannelsImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({bool sms, bool whatsapp, bool email});
}

/// @nodoc
class __$$SOSDispatchChannelsImplCopyWithImpl<$Res>
    extends _$SOSDispatchChannelsCopyWithImpl<$Res, _$SOSDispatchChannelsImpl>
    implements _$$SOSDispatchChannelsImplCopyWith<$Res> {
  __$$SOSDispatchChannelsImplCopyWithImpl(
    _$SOSDispatchChannelsImpl _value,
    $Res Function(_$SOSDispatchChannelsImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SOSDispatchChannels
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? sms = null,
    Object? whatsapp = null,
    Object? email = null,
  }) {
    return _then(
      _$SOSDispatchChannelsImpl(
        sms: null == sms
            ? _value.sms
            : sms // ignore: cast_nullable_to_non_nullable
                  as bool,
        whatsapp: null == whatsapp
            ? _value.whatsapp
            : whatsapp // ignore: cast_nullable_to_non_nullable
                  as bool,
        email: null == email
            ? _value.email
            : email // ignore: cast_nullable_to_non_nullable
                  as bool,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$SOSDispatchChannelsImpl implements _SOSDispatchChannels {
  const _$SOSDispatchChannelsImpl({
    this.sms = false,
    this.whatsapp = false,
    this.email = false,
  });

  factory _$SOSDispatchChannelsImpl.fromJson(Map<String, dynamic> json) =>
      _$$SOSDispatchChannelsImplFromJson(json);

  @override
  @JsonKey()
  final bool sms;
  @override
  @JsonKey()
  final bool whatsapp;
  @override
  @JsonKey()
  final bool email;

  @override
  String toString() {
    return 'SOSDispatchChannels(sms: $sms, whatsapp: $whatsapp, email: $email)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SOSDispatchChannelsImpl &&
            (identical(other.sms, sms) || other.sms == sms) &&
            (identical(other.whatsapp, whatsapp) ||
                other.whatsapp == whatsapp) &&
            (identical(other.email, email) || other.email == email));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, sms, whatsapp, email);

  /// Create a copy of SOSDispatchChannels
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SOSDispatchChannelsImplCopyWith<_$SOSDispatchChannelsImpl> get copyWith =>
      __$$SOSDispatchChannelsImplCopyWithImpl<_$SOSDispatchChannelsImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$SOSDispatchChannelsImplToJson(this);
  }
}

abstract class _SOSDispatchChannels implements SOSDispatchChannels {
  const factory _SOSDispatchChannels({bool sms, bool whatsapp, bool email}) =
      _$SOSDispatchChannelsImpl;

  factory _SOSDispatchChannels.fromJson(Map<String, dynamic> json) =
      _$SOSDispatchChannelsImpl.fromJson;

  @override
  bool get sms;
  @override
  bool get whatsapp;
  @override
  bool get email;

  /// Create a copy of SOSDispatchChannels
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SOSDispatchChannelsImplCopyWith<_$SOSDispatchChannelsImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

SOSDispatchSummary _$SOSDispatchSummaryFromJson(Map<String, dynamic> json) {
  return _SOSDispatchSummary.fromJson(json);
}

/// @nodoc
mixin _$SOSDispatchSummary {
  int get nearbyRiders => throw _privateConstructorUsedError;
  int get serviceProviders => throw _privateConstructorUsedError;
  int get emergencyContacts => throw _privateConstructorUsedError;
  int get emergencyServices => throw _privateConstructorUsedError;
  int get smsAttempted => throw _privateConstructorUsedError;
  int get smsSent => throw _privateConstructorUsedError;
  int get whatsappAttempted => throw _privateConstructorUsedError;
  int get whatsappSent => throw _privateConstructorUsedError;
  int get emailAttempted => throw _privateConstructorUsedError;
  int get emailSent => throw _privateConstructorUsedError;
  int get escalatedToAdmins => throw _privateConstructorUsedError;
  SOSDispatchChannels? get channels => throw _privateConstructorUsedError;

  /// Serializes this SOSDispatchSummary to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SOSDispatchSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SOSDispatchSummaryCopyWith<SOSDispatchSummary> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SOSDispatchSummaryCopyWith<$Res> {
  factory $SOSDispatchSummaryCopyWith(
    SOSDispatchSummary value,
    $Res Function(SOSDispatchSummary) then,
  ) = _$SOSDispatchSummaryCopyWithImpl<$Res, SOSDispatchSummary>;
  @useResult
  $Res call({
    int nearbyRiders,
    int serviceProviders,
    int emergencyContacts,
    int emergencyServices,
    int smsAttempted,
    int smsSent,
    int whatsappAttempted,
    int whatsappSent,
    int emailAttempted,
    int emailSent,
    int escalatedToAdmins,
    SOSDispatchChannels? channels,
  });

  $SOSDispatchChannelsCopyWith<$Res>? get channels;
}

/// @nodoc
class _$SOSDispatchSummaryCopyWithImpl<$Res, $Val extends SOSDispatchSummary>
    implements $SOSDispatchSummaryCopyWith<$Res> {
  _$SOSDispatchSummaryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SOSDispatchSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? nearbyRiders = null,
    Object? serviceProviders = null,
    Object? emergencyContacts = null,
    Object? emergencyServices = null,
    Object? smsAttempted = null,
    Object? smsSent = null,
    Object? whatsappAttempted = null,
    Object? whatsappSent = null,
    Object? emailAttempted = null,
    Object? emailSent = null,
    Object? escalatedToAdmins = null,
    Object? channels = freezed,
  }) {
    return _then(
      _value.copyWith(
            nearbyRiders: null == nearbyRiders
                ? _value.nearbyRiders
                : nearbyRiders // ignore: cast_nullable_to_non_nullable
                      as int,
            serviceProviders: null == serviceProviders
                ? _value.serviceProviders
                : serviceProviders // ignore: cast_nullable_to_non_nullable
                      as int,
            emergencyContacts: null == emergencyContacts
                ? _value.emergencyContacts
                : emergencyContacts // ignore: cast_nullable_to_non_nullable
                      as int,
            emergencyServices: null == emergencyServices
                ? _value.emergencyServices
                : emergencyServices // ignore: cast_nullable_to_non_nullable
                      as int,
            smsAttempted: null == smsAttempted
                ? _value.smsAttempted
                : smsAttempted // ignore: cast_nullable_to_non_nullable
                      as int,
            smsSent: null == smsSent
                ? _value.smsSent
                : smsSent // ignore: cast_nullable_to_non_nullable
                      as int,
            whatsappAttempted: null == whatsappAttempted
                ? _value.whatsappAttempted
                : whatsappAttempted // ignore: cast_nullable_to_non_nullable
                      as int,
            whatsappSent: null == whatsappSent
                ? _value.whatsappSent
                : whatsappSent // ignore: cast_nullable_to_non_nullable
                      as int,
            emailAttempted: null == emailAttempted
                ? _value.emailAttempted
                : emailAttempted // ignore: cast_nullable_to_non_nullable
                      as int,
            emailSent: null == emailSent
                ? _value.emailSent
                : emailSent // ignore: cast_nullable_to_non_nullable
                      as int,
            escalatedToAdmins: null == escalatedToAdmins
                ? _value.escalatedToAdmins
                : escalatedToAdmins // ignore: cast_nullable_to_non_nullable
                      as int,
            channels: freezed == channels
                ? _value.channels
                : channels // ignore: cast_nullable_to_non_nullable
                      as SOSDispatchChannels?,
          )
          as $Val,
    );
  }

  /// Create a copy of SOSDispatchSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $SOSDispatchChannelsCopyWith<$Res>? get channels {
    if (_value.channels == null) {
      return null;
    }

    return $SOSDispatchChannelsCopyWith<$Res>(_value.channels!, (value) {
      return _then(_value.copyWith(channels: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$SOSDispatchSummaryImplCopyWith<$Res>
    implements $SOSDispatchSummaryCopyWith<$Res> {
  factory _$$SOSDispatchSummaryImplCopyWith(
    _$SOSDispatchSummaryImpl value,
    $Res Function(_$SOSDispatchSummaryImpl) then,
  ) = __$$SOSDispatchSummaryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    int nearbyRiders,
    int serviceProviders,
    int emergencyContacts,
    int emergencyServices,
    int smsAttempted,
    int smsSent,
    int whatsappAttempted,
    int whatsappSent,
    int emailAttempted,
    int emailSent,
    int escalatedToAdmins,
    SOSDispatchChannels? channels,
  });

  @override
  $SOSDispatchChannelsCopyWith<$Res>? get channels;
}

/// @nodoc
class __$$SOSDispatchSummaryImplCopyWithImpl<$Res>
    extends _$SOSDispatchSummaryCopyWithImpl<$Res, _$SOSDispatchSummaryImpl>
    implements _$$SOSDispatchSummaryImplCopyWith<$Res> {
  __$$SOSDispatchSummaryImplCopyWithImpl(
    _$SOSDispatchSummaryImpl _value,
    $Res Function(_$SOSDispatchSummaryImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SOSDispatchSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? nearbyRiders = null,
    Object? serviceProviders = null,
    Object? emergencyContacts = null,
    Object? emergencyServices = null,
    Object? smsAttempted = null,
    Object? smsSent = null,
    Object? whatsappAttempted = null,
    Object? whatsappSent = null,
    Object? emailAttempted = null,
    Object? emailSent = null,
    Object? escalatedToAdmins = null,
    Object? channels = freezed,
  }) {
    return _then(
      _$SOSDispatchSummaryImpl(
        nearbyRiders: null == nearbyRiders
            ? _value.nearbyRiders
            : nearbyRiders // ignore: cast_nullable_to_non_nullable
                  as int,
        serviceProviders: null == serviceProviders
            ? _value.serviceProviders
            : serviceProviders // ignore: cast_nullable_to_non_nullable
                  as int,
        emergencyContacts: null == emergencyContacts
            ? _value.emergencyContacts
            : emergencyContacts // ignore: cast_nullable_to_non_nullable
                  as int,
        emergencyServices: null == emergencyServices
            ? _value.emergencyServices
            : emergencyServices // ignore: cast_nullable_to_non_nullable
                  as int,
        smsAttempted: null == smsAttempted
            ? _value.smsAttempted
            : smsAttempted // ignore: cast_nullable_to_non_nullable
                  as int,
        smsSent: null == smsSent
            ? _value.smsSent
            : smsSent // ignore: cast_nullable_to_non_nullable
                  as int,
        whatsappAttempted: null == whatsappAttempted
            ? _value.whatsappAttempted
            : whatsappAttempted // ignore: cast_nullable_to_non_nullable
                  as int,
        whatsappSent: null == whatsappSent
            ? _value.whatsappSent
            : whatsappSent // ignore: cast_nullable_to_non_nullable
                  as int,
        emailAttempted: null == emailAttempted
            ? _value.emailAttempted
            : emailAttempted // ignore: cast_nullable_to_non_nullable
                  as int,
        emailSent: null == emailSent
            ? _value.emailSent
            : emailSent // ignore: cast_nullable_to_non_nullable
                  as int,
        escalatedToAdmins: null == escalatedToAdmins
            ? _value.escalatedToAdmins
            : escalatedToAdmins // ignore: cast_nullable_to_non_nullable
                  as int,
        channels: freezed == channels
            ? _value.channels
            : channels // ignore: cast_nullable_to_non_nullable
                  as SOSDispatchChannels?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$SOSDispatchSummaryImpl implements _SOSDispatchSummary {
  const _$SOSDispatchSummaryImpl({
    this.nearbyRiders = 0,
    this.serviceProviders = 0,
    this.emergencyContacts = 0,
    this.emergencyServices = 0,
    this.smsAttempted = 0,
    this.smsSent = 0,
    this.whatsappAttempted = 0,
    this.whatsappSent = 0,
    this.emailAttempted = 0,
    this.emailSent = 0,
    this.escalatedToAdmins = 0,
    this.channels,
  });

  factory _$SOSDispatchSummaryImpl.fromJson(Map<String, dynamic> json) =>
      _$$SOSDispatchSummaryImplFromJson(json);

  @override
  @JsonKey()
  final int nearbyRiders;
  @override
  @JsonKey()
  final int serviceProviders;
  @override
  @JsonKey()
  final int emergencyContacts;
  @override
  @JsonKey()
  final int emergencyServices;
  @override
  @JsonKey()
  final int smsAttempted;
  @override
  @JsonKey()
  final int smsSent;
  @override
  @JsonKey()
  final int whatsappAttempted;
  @override
  @JsonKey()
  final int whatsappSent;
  @override
  @JsonKey()
  final int emailAttempted;
  @override
  @JsonKey()
  final int emailSent;
  @override
  @JsonKey()
  final int escalatedToAdmins;
  @override
  final SOSDispatchChannels? channels;

  @override
  String toString() {
    return 'SOSDispatchSummary(nearbyRiders: $nearbyRiders, serviceProviders: $serviceProviders, emergencyContacts: $emergencyContacts, emergencyServices: $emergencyServices, smsAttempted: $smsAttempted, smsSent: $smsSent, whatsappAttempted: $whatsappAttempted, whatsappSent: $whatsappSent, emailAttempted: $emailAttempted, emailSent: $emailSent, escalatedToAdmins: $escalatedToAdmins, channels: $channels)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SOSDispatchSummaryImpl &&
            (identical(other.nearbyRiders, nearbyRiders) ||
                other.nearbyRiders == nearbyRiders) &&
            (identical(other.serviceProviders, serviceProviders) ||
                other.serviceProviders == serviceProviders) &&
            (identical(other.emergencyContacts, emergencyContacts) ||
                other.emergencyContacts == emergencyContacts) &&
            (identical(other.emergencyServices, emergencyServices) ||
                other.emergencyServices == emergencyServices) &&
            (identical(other.smsAttempted, smsAttempted) ||
                other.smsAttempted == smsAttempted) &&
            (identical(other.smsSent, smsSent) || other.smsSent == smsSent) &&
            (identical(other.whatsappAttempted, whatsappAttempted) ||
                other.whatsappAttempted == whatsappAttempted) &&
            (identical(other.whatsappSent, whatsappSent) ||
                other.whatsappSent == whatsappSent) &&
            (identical(other.emailAttempted, emailAttempted) ||
                other.emailAttempted == emailAttempted) &&
            (identical(other.emailSent, emailSent) ||
                other.emailSent == emailSent) &&
            (identical(other.escalatedToAdmins, escalatedToAdmins) ||
                other.escalatedToAdmins == escalatedToAdmins) &&
            (identical(other.channels, channels) ||
                other.channels == channels));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    nearbyRiders,
    serviceProviders,
    emergencyContacts,
    emergencyServices,
    smsAttempted,
    smsSent,
    whatsappAttempted,
    whatsappSent,
    emailAttempted,
    emailSent,
    escalatedToAdmins,
    channels,
  );

  /// Create a copy of SOSDispatchSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SOSDispatchSummaryImplCopyWith<_$SOSDispatchSummaryImpl> get copyWith =>
      __$$SOSDispatchSummaryImplCopyWithImpl<_$SOSDispatchSummaryImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$SOSDispatchSummaryImplToJson(this);
  }
}

abstract class _SOSDispatchSummary implements SOSDispatchSummary {
  const factory _SOSDispatchSummary({
    int nearbyRiders,
    int serviceProviders,
    int emergencyContacts,
    int emergencyServices,
    int smsAttempted,
    int smsSent,
    int whatsappAttempted,
    int whatsappSent,
    int emailAttempted,
    int emailSent,
    int escalatedToAdmins,
    SOSDispatchChannels? channels,
  }) = _$SOSDispatchSummaryImpl;

  factory _SOSDispatchSummary.fromJson(Map<String, dynamic> json) =
      _$SOSDispatchSummaryImpl.fromJson;

  @override
  int get nearbyRiders;
  @override
  int get serviceProviders;
  @override
  int get emergencyContacts;
  @override
  int get emergencyServices;
  @override
  int get smsAttempted;
  @override
  int get smsSent;
  @override
  int get whatsappAttempted;
  @override
  int get whatsappSent;
  @override
  int get emailAttempted;
  @override
  int get emailSent;
  @override
  int get escalatedToAdmins;
  @override
  SOSDispatchChannels? get channels;

  /// Create a copy of SOSDispatchSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SOSDispatchSummaryImplCopyWith<_$SOSDispatchSummaryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

SOSCreateResult _$SOSCreateResultFromJson(Map<String, dynamic> json) {
  return _SOSCreateResult.fromJson(json);
}

/// @nodoc
mixin _$SOSCreateResult {
  SOSAlert get alert => throw _privateConstructorUsedError;
  SOSDispatchSummary? get dispatch => throw _privateConstructorUsedError;
  String? get profileWarning => throw _privateConstructorUsedError;

  /// Serializes this SOSCreateResult to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SOSCreateResult
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SOSCreateResultCopyWith<SOSCreateResult> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SOSCreateResultCopyWith<$Res> {
  factory $SOSCreateResultCopyWith(
    SOSCreateResult value,
    $Res Function(SOSCreateResult) then,
  ) = _$SOSCreateResultCopyWithImpl<$Res, SOSCreateResult>;
  @useResult
  $Res call({
    SOSAlert alert,
    SOSDispatchSummary? dispatch,
    String? profileWarning,
  });

  $SOSAlertCopyWith<$Res> get alert;
  $SOSDispatchSummaryCopyWith<$Res>? get dispatch;
}

/// @nodoc
class _$SOSCreateResultCopyWithImpl<$Res, $Val extends SOSCreateResult>
    implements $SOSCreateResultCopyWith<$Res> {
  _$SOSCreateResultCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SOSCreateResult
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? alert = null,
    Object? dispatch = freezed,
    Object? profileWarning = freezed,
  }) {
    return _then(
      _value.copyWith(
            alert: null == alert
                ? _value.alert
                : alert // ignore: cast_nullable_to_non_nullable
                      as SOSAlert,
            dispatch: freezed == dispatch
                ? _value.dispatch
                : dispatch // ignore: cast_nullable_to_non_nullable
                      as SOSDispatchSummary?,
            profileWarning: freezed == profileWarning
                ? _value.profileWarning
                : profileWarning // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }

  /// Create a copy of SOSCreateResult
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $SOSAlertCopyWith<$Res> get alert {
    return $SOSAlertCopyWith<$Res>(_value.alert, (value) {
      return _then(_value.copyWith(alert: value) as $Val);
    });
  }

  /// Create a copy of SOSCreateResult
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $SOSDispatchSummaryCopyWith<$Res>? get dispatch {
    if (_value.dispatch == null) {
      return null;
    }

    return $SOSDispatchSummaryCopyWith<$Res>(_value.dispatch!, (value) {
      return _then(_value.copyWith(dispatch: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$SOSCreateResultImplCopyWith<$Res>
    implements $SOSCreateResultCopyWith<$Res> {
  factory _$$SOSCreateResultImplCopyWith(
    _$SOSCreateResultImpl value,
    $Res Function(_$SOSCreateResultImpl) then,
  ) = __$$SOSCreateResultImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    SOSAlert alert,
    SOSDispatchSummary? dispatch,
    String? profileWarning,
  });

  @override
  $SOSAlertCopyWith<$Res> get alert;
  @override
  $SOSDispatchSummaryCopyWith<$Res>? get dispatch;
}

/// @nodoc
class __$$SOSCreateResultImplCopyWithImpl<$Res>
    extends _$SOSCreateResultCopyWithImpl<$Res, _$SOSCreateResultImpl>
    implements _$$SOSCreateResultImplCopyWith<$Res> {
  __$$SOSCreateResultImplCopyWithImpl(
    _$SOSCreateResultImpl _value,
    $Res Function(_$SOSCreateResultImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SOSCreateResult
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? alert = null,
    Object? dispatch = freezed,
    Object? profileWarning = freezed,
  }) {
    return _then(
      _$SOSCreateResultImpl(
        alert: null == alert
            ? _value.alert
            : alert // ignore: cast_nullable_to_non_nullable
                  as SOSAlert,
        dispatch: freezed == dispatch
            ? _value.dispatch
            : dispatch // ignore: cast_nullable_to_non_nullable
                  as SOSDispatchSummary?,
        profileWarning: freezed == profileWarning
            ? _value.profileWarning
            : profileWarning // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$SOSCreateResultImpl implements _SOSCreateResult {
  const _$SOSCreateResultImpl({
    required this.alert,
    this.dispatch,
    this.profileWarning,
  });

  factory _$SOSCreateResultImpl.fromJson(Map<String, dynamic> json) =>
      _$$SOSCreateResultImplFromJson(json);

  @override
  final SOSAlert alert;
  @override
  final SOSDispatchSummary? dispatch;
  @override
  final String? profileWarning;

  @override
  String toString() {
    return 'SOSCreateResult(alert: $alert, dispatch: $dispatch, profileWarning: $profileWarning)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SOSCreateResultImpl &&
            (identical(other.alert, alert) || other.alert == alert) &&
            (identical(other.dispatch, dispatch) ||
                other.dispatch == dispatch) &&
            (identical(other.profileWarning, profileWarning) ||
                other.profileWarning == profileWarning));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, alert, dispatch, profileWarning);

  /// Create a copy of SOSCreateResult
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SOSCreateResultImplCopyWith<_$SOSCreateResultImpl> get copyWith =>
      __$$SOSCreateResultImplCopyWithImpl<_$SOSCreateResultImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$SOSCreateResultImplToJson(this);
  }
}

abstract class _SOSCreateResult implements SOSCreateResult {
  const factory _SOSCreateResult({
    required SOSAlert alert,
    SOSDispatchSummary? dispatch,
    String? profileWarning,
  }) = _$SOSCreateResultImpl;

  factory _SOSCreateResult.fromJson(Map<String, dynamic> json) =
      _$SOSCreateResultImpl.fromJson;

  @override
  SOSAlert get alert;
  @override
  SOSDispatchSummary? get dispatch;
  @override
  String? get profileWarning;

  /// Create a copy of SOSCreateResult
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SOSCreateResultImplCopyWith<_$SOSCreateResultImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
