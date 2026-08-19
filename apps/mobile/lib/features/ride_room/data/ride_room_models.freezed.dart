// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'ride_room_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

EmergencyContact _$EmergencyContactFromJson(Map<String, dynamic> json) {
  return _EmergencyContact.fromJson(json);
}

/// @nodoc
mixin _$EmergencyContact {
  String get name => throw _privateConstructorUsedError;
  String get phone => throw _privateConstructorUsedError;
  String get relation => throw _privateConstructorUsedError;

  /// Serializes this EmergencyContact to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of EmergencyContact
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $EmergencyContactCopyWith<EmergencyContact> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EmergencyContactCopyWith<$Res> {
  factory $EmergencyContactCopyWith(
    EmergencyContact value,
    $Res Function(EmergencyContact) then,
  ) = _$EmergencyContactCopyWithImpl<$Res, EmergencyContact>;
  @useResult
  $Res call({String name, String phone, String relation});
}

/// @nodoc
class _$EmergencyContactCopyWithImpl<$Res, $Val extends EmergencyContact>
    implements $EmergencyContactCopyWith<$Res> {
  _$EmergencyContactCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of EmergencyContact
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? phone = null,
    Object? relation = null,
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
            relation: null == relation
                ? _value.relation
                : relation // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$EmergencyContactImplCopyWith<$Res>
    implements $EmergencyContactCopyWith<$Res> {
  factory _$$EmergencyContactImplCopyWith(
    _$EmergencyContactImpl value,
    $Res Function(_$EmergencyContactImpl) then,
  ) = __$$EmergencyContactImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String name, String phone, String relation});
}

/// @nodoc
class __$$EmergencyContactImplCopyWithImpl<$Res>
    extends _$EmergencyContactCopyWithImpl<$Res, _$EmergencyContactImpl>
    implements _$$EmergencyContactImplCopyWith<$Res> {
  __$$EmergencyContactImplCopyWithImpl(
    _$EmergencyContactImpl _value,
    $Res Function(_$EmergencyContactImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of EmergencyContact
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? phone = null,
    Object? relation = null,
  }) {
    return _then(
      _$EmergencyContactImpl(
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        phone: null == phone
            ? _value.phone
            : phone // ignore: cast_nullable_to_non_nullable
                  as String,
        relation: null == relation
            ? _value.relation
            : relation // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$EmergencyContactImpl implements _EmergencyContact {
  const _$EmergencyContactImpl({
    required this.name,
    required this.phone,
    required this.relation,
  });

  factory _$EmergencyContactImpl.fromJson(Map<String, dynamic> json) =>
      _$$EmergencyContactImplFromJson(json);

  @override
  final String name;
  @override
  final String phone;
  @override
  final String relation;

  @override
  String toString() {
    return 'EmergencyContact(name: $name, phone: $phone, relation: $relation)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$EmergencyContactImpl &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.phone, phone) || other.phone == phone) &&
            (identical(other.relation, relation) ||
                other.relation == relation));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, name, phone, relation);

  /// Create a copy of EmergencyContact
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$EmergencyContactImplCopyWith<_$EmergencyContactImpl> get copyWith =>
      __$$EmergencyContactImplCopyWithImpl<_$EmergencyContactImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$EmergencyContactImplToJson(this);
  }
}

abstract class _EmergencyContact implements EmergencyContact {
  const factory _EmergencyContact({
    required String name,
    required String phone,
    required String relation,
  }) = _$EmergencyContactImpl;

  factory _EmergencyContact.fromJson(Map<String, dynamic> json) =
      _$EmergencyContactImpl.fromJson;

  @override
  String get name;
  @override
  String get phone;
  @override
  String get relation;

  /// Create a copy of EmergencyContact
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$EmergencyContactImplCopyWith<_$EmergencyContactImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

RideRoom _$RideRoomFromJson(Map<String, dynamic> json) {
  return _RideRoom.fromJson(json);
}

/// @nodoc
mixin _$RideRoom {
  String get tripId => throw _privateConstructorUsedError;
  String get conversationId => throw _privateConstructorUsedError;
  String get role => throw _privateConstructorUsedError;
  bool get isLocked => throw _privateConstructorUsedError;
  String? get meetingPoint => throw _privateConstructorUsedError;
  double? get meetingLat => throw _privateConstructorUsedError;
  double? get meetingLng => throw _privateConstructorUsedError;
  List<EmergencyContact> get emergencyContacts =>
      throw _privateConstructorUsedError;

  /// Serializes this RideRoom to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of RideRoom
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $RideRoomCopyWith<RideRoom> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $RideRoomCopyWith<$Res> {
  factory $RideRoomCopyWith(RideRoom value, $Res Function(RideRoom) then) =
      _$RideRoomCopyWithImpl<$Res, RideRoom>;
  @useResult
  $Res call({
    String tripId,
    String conversationId,
    String role,
    bool isLocked,
    String? meetingPoint,
    double? meetingLat,
    double? meetingLng,
    List<EmergencyContact> emergencyContacts,
  });
}

/// @nodoc
class _$RideRoomCopyWithImpl<$Res, $Val extends RideRoom>
    implements $RideRoomCopyWith<$Res> {
  _$RideRoomCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of RideRoom
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? tripId = null,
    Object? conversationId = null,
    Object? role = null,
    Object? isLocked = null,
    Object? meetingPoint = freezed,
    Object? meetingLat = freezed,
    Object? meetingLng = freezed,
    Object? emergencyContacts = null,
  }) {
    return _then(
      _value.copyWith(
            tripId: null == tripId
                ? _value.tripId
                : tripId // ignore: cast_nullable_to_non_nullable
                      as String,
            conversationId: null == conversationId
                ? _value.conversationId
                : conversationId // ignore: cast_nullable_to_non_nullable
                      as String,
            role: null == role
                ? _value.role
                : role // ignore: cast_nullable_to_non_nullable
                      as String,
            isLocked: null == isLocked
                ? _value.isLocked
                : isLocked // ignore: cast_nullable_to_non_nullable
                      as bool,
            meetingPoint: freezed == meetingPoint
                ? _value.meetingPoint
                : meetingPoint // ignore: cast_nullable_to_non_nullable
                      as String?,
            meetingLat: freezed == meetingLat
                ? _value.meetingLat
                : meetingLat // ignore: cast_nullable_to_non_nullable
                      as double?,
            meetingLng: freezed == meetingLng
                ? _value.meetingLng
                : meetingLng // ignore: cast_nullable_to_non_nullable
                      as double?,
            emergencyContacts: null == emergencyContacts
                ? _value.emergencyContacts
                : emergencyContacts // ignore: cast_nullable_to_non_nullable
                      as List<EmergencyContact>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$RideRoomImplCopyWith<$Res>
    implements $RideRoomCopyWith<$Res> {
  factory _$$RideRoomImplCopyWith(
    _$RideRoomImpl value,
    $Res Function(_$RideRoomImpl) then,
  ) = __$$RideRoomImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String tripId,
    String conversationId,
    String role,
    bool isLocked,
    String? meetingPoint,
    double? meetingLat,
    double? meetingLng,
    List<EmergencyContact> emergencyContacts,
  });
}

/// @nodoc
class __$$RideRoomImplCopyWithImpl<$Res>
    extends _$RideRoomCopyWithImpl<$Res, _$RideRoomImpl>
    implements _$$RideRoomImplCopyWith<$Res> {
  __$$RideRoomImplCopyWithImpl(
    _$RideRoomImpl _value,
    $Res Function(_$RideRoomImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of RideRoom
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? tripId = null,
    Object? conversationId = null,
    Object? role = null,
    Object? isLocked = null,
    Object? meetingPoint = freezed,
    Object? meetingLat = freezed,
    Object? meetingLng = freezed,
    Object? emergencyContacts = null,
  }) {
    return _then(
      _$RideRoomImpl(
        tripId: null == tripId
            ? _value.tripId
            : tripId // ignore: cast_nullable_to_non_nullable
                  as String,
        conversationId: null == conversationId
            ? _value.conversationId
            : conversationId // ignore: cast_nullable_to_non_nullable
                  as String,
        role: null == role
            ? _value.role
            : role // ignore: cast_nullable_to_non_nullable
                  as String,
        isLocked: null == isLocked
            ? _value.isLocked
            : isLocked // ignore: cast_nullable_to_non_nullable
                  as bool,
        meetingPoint: freezed == meetingPoint
            ? _value.meetingPoint
            : meetingPoint // ignore: cast_nullable_to_non_nullable
                  as String?,
        meetingLat: freezed == meetingLat
            ? _value.meetingLat
            : meetingLat // ignore: cast_nullable_to_non_nullable
                  as double?,
        meetingLng: freezed == meetingLng
            ? _value.meetingLng
            : meetingLng // ignore: cast_nullable_to_non_nullable
                  as double?,
        emergencyContacts: null == emergencyContacts
            ? _value._emergencyContacts
            : emergencyContacts // ignore: cast_nullable_to_non_nullable
                  as List<EmergencyContact>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$RideRoomImpl extends _RideRoom {
  const _$RideRoomImpl({
    required this.tripId,
    required this.conversationId,
    required this.role,
    required this.isLocked,
    this.meetingPoint,
    this.meetingLat,
    this.meetingLng,
    List<EmergencyContact> emergencyContacts = const [],
  }) : _emergencyContacts = emergencyContacts,
       super._();

  factory _$RideRoomImpl.fromJson(Map<String, dynamic> json) =>
      _$$RideRoomImplFromJson(json);

  @override
  final String tripId;
  @override
  final String conversationId;
  @override
  final String role;
  @override
  final bool isLocked;
  @override
  final String? meetingPoint;
  @override
  final double? meetingLat;
  @override
  final double? meetingLng;
  final List<EmergencyContact> _emergencyContacts;
  @override
  @JsonKey()
  List<EmergencyContact> get emergencyContacts {
    if (_emergencyContacts is EqualUnmodifiableListView)
      return _emergencyContacts;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_emergencyContacts);
  }

  @override
  String toString() {
    return 'RideRoom(tripId: $tripId, conversationId: $conversationId, role: $role, isLocked: $isLocked, meetingPoint: $meetingPoint, meetingLat: $meetingLat, meetingLng: $meetingLng, emergencyContacts: $emergencyContacts)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RideRoomImpl &&
            (identical(other.tripId, tripId) || other.tripId == tripId) &&
            (identical(other.conversationId, conversationId) ||
                other.conversationId == conversationId) &&
            (identical(other.role, role) || other.role == role) &&
            (identical(other.isLocked, isLocked) ||
                other.isLocked == isLocked) &&
            (identical(other.meetingPoint, meetingPoint) ||
                other.meetingPoint == meetingPoint) &&
            (identical(other.meetingLat, meetingLat) ||
                other.meetingLat == meetingLat) &&
            (identical(other.meetingLng, meetingLng) ||
                other.meetingLng == meetingLng) &&
            const DeepCollectionEquality().equals(
              other._emergencyContacts,
              _emergencyContacts,
            ));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    tripId,
    conversationId,
    role,
    isLocked,
    meetingPoint,
    meetingLat,
    meetingLng,
    const DeepCollectionEquality().hash(_emergencyContacts),
  );

  /// Create a copy of RideRoom
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$RideRoomImplCopyWith<_$RideRoomImpl> get copyWith =>
      __$$RideRoomImplCopyWithImpl<_$RideRoomImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$RideRoomImplToJson(this);
  }
}

abstract class _RideRoom extends RideRoom {
  const factory _RideRoom({
    required String tripId,
    required String conversationId,
    required String role,
    required bool isLocked,
    String? meetingPoint,
    double? meetingLat,
    double? meetingLng,
    List<EmergencyContact> emergencyContacts,
  }) = _$RideRoomImpl;
  const _RideRoom._() : super._();

  factory _RideRoom.fromJson(Map<String, dynamic> json) =
      _$RideRoomImpl.fromJson;

  @override
  String get tripId;
  @override
  String get conversationId;
  @override
  String get role;
  @override
  bool get isLocked;
  @override
  String? get meetingPoint;
  @override
  double? get meetingLat;
  @override
  double? get meetingLng;
  @override
  List<EmergencyContact> get emergencyContacts;

  /// Create a copy of RideRoom
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$RideRoomImplCopyWith<_$RideRoomImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

Announcement _$AnnouncementFromJson(Map<String, dynamic> json) {
  return _Announcement.fromJson(json);
}

/// @nodoc
mixin _$Announcement {
  String get id => throw _privateConstructorUsedError;
  String get tripId => throw _privateConstructorUsedError;
  String get authorId => throw _privateConstructorUsedError;
  String get authorName => throw _privateConstructorUsedError;
  String get content => throw _privateConstructorUsedError;
  String? get pinnedAt => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;

  /// Serializes this Announcement to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Announcement
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AnnouncementCopyWith<Announcement> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AnnouncementCopyWith<$Res> {
  factory $AnnouncementCopyWith(
    Announcement value,
    $Res Function(Announcement) then,
  ) = _$AnnouncementCopyWithImpl<$Res, Announcement>;
  @useResult
  $Res call({
    String id,
    String tripId,
    String authorId,
    String authorName,
    String content,
    String? pinnedAt,
    String createdAt,
  });
}

/// @nodoc
class _$AnnouncementCopyWithImpl<$Res, $Val extends Announcement>
    implements $AnnouncementCopyWith<$Res> {
  _$AnnouncementCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Announcement
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? tripId = null,
    Object? authorId = null,
    Object? authorName = null,
    Object? content = null,
    Object? pinnedAt = freezed,
    Object? createdAt = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            tripId: null == tripId
                ? _value.tripId
                : tripId // ignore: cast_nullable_to_non_nullable
                      as String,
            authorId: null == authorId
                ? _value.authorId
                : authorId // ignore: cast_nullable_to_non_nullable
                      as String,
            authorName: null == authorName
                ? _value.authorName
                : authorName // ignore: cast_nullable_to_non_nullable
                      as String,
            content: null == content
                ? _value.content
                : content // ignore: cast_nullable_to_non_nullable
                      as String,
            pinnedAt: freezed == pinnedAt
                ? _value.pinnedAt
                : pinnedAt // ignore: cast_nullable_to_non_nullable
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
abstract class _$$AnnouncementImplCopyWith<$Res>
    implements $AnnouncementCopyWith<$Res> {
  factory _$$AnnouncementImplCopyWith(
    _$AnnouncementImpl value,
    $Res Function(_$AnnouncementImpl) then,
  ) = __$$AnnouncementImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String tripId,
    String authorId,
    String authorName,
    String content,
    String? pinnedAt,
    String createdAt,
  });
}

/// @nodoc
class __$$AnnouncementImplCopyWithImpl<$Res>
    extends _$AnnouncementCopyWithImpl<$Res, _$AnnouncementImpl>
    implements _$$AnnouncementImplCopyWith<$Res> {
  __$$AnnouncementImplCopyWithImpl(
    _$AnnouncementImpl _value,
    $Res Function(_$AnnouncementImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of Announcement
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? tripId = null,
    Object? authorId = null,
    Object? authorName = null,
    Object? content = null,
    Object? pinnedAt = freezed,
    Object? createdAt = null,
  }) {
    return _then(
      _$AnnouncementImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        tripId: null == tripId
            ? _value.tripId
            : tripId // ignore: cast_nullable_to_non_nullable
                  as String,
        authorId: null == authorId
            ? _value.authorId
            : authorId // ignore: cast_nullable_to_non_nullable
                  as String,
        authorName: null == authorName
            ? _value.authorName
            : authorName // ignore: cast_nullable_to_non_nullable
                  as String,
        content: null == content
            ? _value.content
            : content // ignore: cast_nullable_to_non_nullable
                  as String,
        pinnedAt: freezed == pinnedAt
            ? _value.pinnedAt
            : pinnedAt // ignore: cast_nullable_to_non_nullable
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
class _$AnnouncementImpl implements _Announcement {
  const _$AnnouncementImpl({
    required this.id,
    required this.tripId,
    required this.authorId,
    required this.authorName,
    required this.content,
    this.pinnedAt,
    required this.createdAt,
  });

  factory _$AnnouncementImpl.fromJson(Map<String, dynamic> json) =>
      _$$AnnouncementImplFromJson(json);

  @override
  final String id;
  @override
  final String tripId;
  @override
  final String authorId;
  @override
  final String authorName;
  @override
  final String content;
  @override
  final String? pinnedAt;
  @override
  final String createdAt;

  @override
  String toString() {
    return 'Announcement(id: $id, tripId: $tripId, authorId: $authorId, authorName: $authorName, content: $content, pinnedAt: $pinnedAt, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AnnouncementImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.tripId, tripId) || other.tripId == tripId) &&
            (identical(other.authorId, authorId) ||
                other.authorId == authorId) &&
            (identical(other.authorName, authorName) ||
                other.authorName == authorName) &&
            (identical(other.content, content) || other.content == content) &&
            (identical(other.pinnedAt, pinnedAt) ||
                other.pinnedAt == pinnedAt) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    tripId,
    authorId,
    authorName,
    content,
    pinnedAt,
    createdAt,
  );

  /// Create a copy of Announcement
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AnnouncementImplCopyWith<_$AnnouncementImpl> get copyWith =>
      __$$AnnouncementImplCopyWithImpl<_$AnnouncementImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AnnouncementImplToJson(this);
  }
}

abstract class _Announcement implements Announcement {
  const factory _Announcement({
    required String id,
    required String tripId,
    required String authorId,
    required String authorName,
    required String content,
    String? pinnedAt,
    required String createdAt,
  }) = _$AnnouncementImpl;

  factory _Announcement.fromJson(Map<String, dynamic> json) =
      _$AnnouncementImpl.fromJson;

  @override
  String get id;
  @override
  String get tripId;
  @override
  String get authorId;
  @override
  String get authorName;
  @override
  String get content;
  @override
  String? get pinnedAt;
  @override
  String get createdAt;

  /// Create a copy of Announcement
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AnnouncementImplCopyWith<_$AnnouncementImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

MediaItem _$MediaItemFromJson(Map<String, dynamic> json) {
  return _MediaItem.fromJson(json);
}

/// @nodoc
mixin _$MediaItem {
  String get id => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String get fileName => throw _privateConstructorUsedError;
  String get mimeType => throw _privateConstructorUsedError;
  int get sizeBytes => throw _privateConstructorUsedError;
  int? get width => throw _privateConstructorUsedError;
  int? get height => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;

  /// Serializes this MediaItem to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of MediaItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $MediaItemCopyWith<MediaItem> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $MediaItemCopyWith<$Res> {
  factory $MediaItemCopyWith(MediaItem value, $Res Function(MediaItem) then) =
      _$MediaItemCopyWithImpl<$Res, MediaItem>;
  @useResult
  $Res call({
    String id,
    String type,
    String fileName,
    String mimeType,
    int sizeBytes,
    int? width,
    int? height,
    String createdAt,
  });
}

/// @nodoc
class _$MediaItemCopyWithImpl<$Res, $Val extends MediaItem>
    implements $MediaItemCopyWith<$Res> {
  _$MediaItemCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of MediaItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? fileName = null,
    Object? mimeType = null,
    Object? sizeBytes = null,
    Object? width = freezed,
    Object? height = freezed,
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
            fileName: null == fileName
                ? _value.fileName
                : fileName // ignore: cast_nullable_to_non_nullable
                      as String,
            mimeType: null == mimeType
                ? _value.mimeType
                : mimeType // ignore: cast_nullable_to_non_nullable
                      as String,
            sizeBytes: null == sizeBytes
                ? _value.sizeBytes
                : sizeBytes // ignore: cast_nullable_to_non_nullable
                      as int,
            width: freezed == width
                ? _value.width
                : width // ignore: cast_nullable_to_non_nullable
                      as int?,
            height: freezed == height
                ? _value.height
                : height // ignore: cast_nullable_to_non_nullable
                      as int?,
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
abstract class _$$MediaItemImplCopyWith<$Res>
    implements $MediaItemCopyWith<$Res> {
  factory _$$MediaItemImplCopyWith(
    _$MediaItemImpl value,
    $Res Function(_$MediaItemImpl) then,
  ) = __$$MediaItemImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String type,
    String fileName,
    String mimeType,
    int sizeBytes,
    int? width,
    int? height,
    String createdAt,
  });
}

/// @nodoc
class __$$MediaItemImplCopyWithImpl<$Res>
    extends _$MediaItemCopyWithImpl<$Res, _$MediaItemImpl>
    implements _$$MediaItemImplCopyWith<$Res> {
  __$$MediaItemImplCopyWithImpl(
    _$MediaItemImpl _value,
    $Res Function(_$MediaItemImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of MediaItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? fileName = null,
    Object? mimeType = null,
    Object? sizeBytes = null,
    Object? width = freezed,
    Object? height = freezed,
    Object? createdAt = null,
  }) {
    return _then(
      _$MediaItemImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        type: null == type
            ? _value.type
            : type // ignore: cast_nullable_to_non_nullable
                  as String,
        fileName: null == fileName
            ? _value.fileName
            : fileName // ignore: cast_nullable_to_non_nullable
                  as String,
        mimeType: null == mimeType
            ? _value.mimeType
            : mimeType // ignore: cast_nullable_to_non_nullable
                  as String,
        sizeBytes: null == sizeBytes
            ? _value.sizeBytes
            : sizeBytes // ignore: cast_nullable_to_non_nullable
                  as int,
        width: freezed == width
            ? _value.width
            : width // ignore: cast_nullable_to_non_nullable
                  as int?,
        height: freezed == height
            ? _value.height
            : height // ignore: cast_nullable_to_non_nullable
                  as int?,
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
class _$MediaItemImpl implements _MediaItem {
  const _$MediaItemImpl({
    required this.id,
    required this.type,
    required this.fileName,
    required this.mimeType,
    required this.sizeBytes,
    this.width,
    this.height,
    required this.createdAt,
  });

  factory _$MediaItemImpl.fromJson(Map<String, dynamic> json) =>
      _$$MediaItemImplFromJson(json);

  @override
  final String id;
  @override
  final String type;
  @override
  final String fileName;
  @override
  final String mimeType;
  @override
  final int sizeBytes;
  @override
  final int? width;
  @override
  final int? height;
  @override
  final String createdAt;

  @override
  String toString() {
    return 'MediaItem(id: $id, type: $type, fileName: $fileName, mimeType: $mimeType, sizeBytes: $sizeBytes, width: $width, height: $height, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MediaItemImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.fileName, fileName) ||
                other.fileName == fileName) &&
            (identical(other.mimeType, mimeType) ||
                other.mimeType == mimeType) &&
            (identical(other.sizeBytes, sizeBytes) ||
                other.sizeBytes == sizeBytes) &&
            (identical(other.width, width) || other.width == width) &&
            (identical(other.height, height) || other.height == height) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    type,
    fileName,
    mimeType,
    sizeBytes,
    width,
    height,
    createdAt,
  );

  /// Create a copy of MediaItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MediaItemImplCopyWith<_$MediaItemImpl> get copyWith =>
      __$$MediaItemImplCopyWithImpl<_$MediaItemImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$MediaItemImplToJson(this);
  }
}

abstract class _MediaItem implements MediaItem {
  const factory _MediaItem({
    required String id,
    required String type,
    required String fileName,
    required String mimeType,
    required int sizeBytes,
    int? width,
    int? height,
    required String createdAt,
  }) = _$MediaItemImpl;

  factory _MediaItem.fromJson(Map<String, dynamic> json) =
      _$MediaItemImpl.fromJson;

  @override
  String get id;
  @override
  String get type;
  @override
  String get fileName;
  @override
  String get mimeType;
  @override
  int get sizeBytes;
  @override
  int? get width;
  @override
  int? get height;
  @override
  String get createdAt;

  /// Create a copy of MediaItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MediaItemImplCopyWith<_$MediaItemImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
