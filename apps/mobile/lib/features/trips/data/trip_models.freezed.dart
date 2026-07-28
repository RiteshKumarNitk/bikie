// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'trip_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

TripDestinationRef _$TripDestinationRefFromJson(Map<String, dynamic> json) {
  return _TripDestinationRef.fromJson(json);
}

/// @nodoc
mixin _$TripDestinationRef {
  String get name => throw _privateConstructorUsedError;
  String get slug => throw _privateConstructorUsedError;

  /// Serializes this TripDestinationRef to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of TripDestinationRef
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TripDestinationRefCopyWith<TripDestinationRef> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TripDestinationRefCopyWith<$Res> {
  factory $TripDestinationRefCopyWith(
    TripDestinationRef value,
    $Res Function(TripDestinationRef) then,
  ) = _$TripDestinationRefCopyWithImpl<$Res, TripDestinationRef>;
  @useResult
  $Res call({String name, String slug});
}

/// @nodoc
class _$TripDestinationRefCopyWithImpl<$Res, $Val extends TripDestinationRef>
    implements $TripDestinationRefCopyWith<$Res> {
  _$TripDestinationRefCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of TripDestinationRef
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? name = null, Object? slug = null}) {
    return _then(
      _value.copyWith(
            name: null == name
                ? _value.name
                : name // ignore: cast_nullable_to_non_nullable
                      as String,
            slug: null == slug
                ? _value.slug
                : slug // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$TripDestinationRefImplCopyWith<$Res>
    implements $TripDestinationRefCopyWith<$Res> {
  factory _$$TripDestinationRefImplCopyWith(
    _$TripDestinationRefImpl value,
    $Res Function(_$TripDestinationRefImpl) then,
  ) = __$$TripDestinationRefImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String name, String slug});
}

/// @nodoc
class __$$TripDestinationRefImplCopyWithImpl<$Res>
    extends _$TripDestinationRefCopyWithImpl<$Res, _$TripDestinationRefImpl>
    implements _$$TripDestinationRefImplCopyWith<$Res> {
  __$$TripDestinationRefImplCopyWithImpl(
    _$TripDestinationRefImpl _value,
    $Res Function(_$TripDestinationRefImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of TripDestinationRef
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? name = null, Object? slug = null}) {
    return _then(
      _$TripDestinationRefImpl(
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        slug: null == slug
            ? _value.slug
            : slug // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$TripDestinationRefImpl implements _TripDestinationRef {
  const _$TripDestinationRefImpl({required this.name, required this.slug});

  factory _$TripDestinationRefImpl.fromJson(Map<String, dynamic> json) =>
      _$$TripDestinationRefImplFromJson(json);

  @override
  final String name;
  @override
  final String slug;

  @override
  String toString() {
    return 'TripDestinationRef(name: $name, slug: $slug)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TripDestinationRefImpl &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.slug, slug) || other.slug == slug));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, name, slug);

  /// Create a copy of TripDestinationRef
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TripDestinationRefImplCopyWith<_$TripDestinationRefImpl> get copyWith =>
      __$$TripDestinationRefImplCopyWithImpl<_$TripDestinationRefImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$TripDestinationRefImplToJson(this);
  }
}

abstract class _TripDestinationRef implements TripDestinationRef {
  const factory _TripDestinationRef({
    required final String name,
    required final String slug,
  }) = _$TripDestinationRefImpl;

  factory _TripDestinationRef.fromJson(Map<String, dynamic> json) =
      _$TripDestinationRefImpl.fromJson;

  @override
  String get name;
  @override
  String get slug;

  /// Create a copy of TripDestinationRef
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TripDestinationRefImplCopyWith<_$TripDestinationRefImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

TripOrganizer _$TripOrganizerFromJson(Map<String, dynamic> json) {
  return _TripOrganizer.fromJson(json);
}

/// @nodoc
mixin _$TripOrganizer {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String? get image => throw _privateConstructorUsedError;

  /// Serializes this TripOrganizer to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of TripOrganizer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TripOrganizerCopyWith<TripOrganizer> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TripOrganizerCopyWith<$Res> {
  factory $TripOrganizerCopyWith(
    TripOrganizer value,
    $Res Function(TripOrganizer) then,
  ) = _$TripOrganizerCopyWithImpl<$Res, TripOrganizer>;
  @useResult
  $Res call({String id, String name, String? image});
}

/// @nodoc
class _$TripOrganizerCopyWithImpl<$Res, $Val extends TripOrganizer>
    implements $TripOrganizerCopyWith<$Res> {
  _$TripOrganizerCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of TripOrganizer
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? id = null, Object? name = null, Object? image = freezed}) {
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
            image: freezed == image
                ? _value.image
                : image // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$TripOrganizerImplCopyWith<$Res>
    implements $TripOrganizerCopyWith<$Res> {
  factory _$$TripOrganizerImplCopyWith(
    _$TripOrganizerImpl value,
    $Res Function(_$TripOrganizerImpl) then,
  ) = __$$TripOrganizerImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, String name, String? image});
}

/// @nodoc
class __$$TripOrganizerImplCopyWithImpl<$Res>
    extends _$TripOrganizerCopyWithImpl<$Res, _$TripOrganizerImpl>
    implements _$$TripOrganizerImplCopyWith<$Res> {
  __$$TripOrganizerImplCopyWithImpl(
    _$TripOrganizerImpl _value,
    $Res Function(_$TripOrganizerImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of TripOrganizer
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? id = null, Object? name = null, Object? image = freezed}) {
    return _then(
      _$TripOrganizerImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        image: freezed == image
            ? _value.image
            : image // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$TripOrganizerImpl implements _TripOrganizer {
  const _$TripOrganizerImpl({required this.id, required this.name, this.image});

  factory _$TripOrganizerImpl.fromJson(Map<String, dynamic> json) =>
      _$$TripOrganizerImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String? image;

  @override
  String toString() {
    return 'TripOrganizer(id: $id, name: $name, image: $image)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TripOrganizerImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.image, image) || other.image == image));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, image);

  /// Create a copy of TripOrganizer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TripOrganizerImplCopyWith<_$TripOrganizerImpl> get copyWith =>
      __$$TripOrganizerImplCopyWithImpl<_$TripOrganizerImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$TripOrganizerImplToJson(this);
  }
}

abstract class _TripOrganizer implements TripOrganizer {
  const factory _TripOrganizer({
    required final String id,
    required final String name,
    final String? image,
  }) = _$TripOrganizerImpl;

  factory _TripOrganizer.fromJson(Map<String, dynamic> json) =
      _$TripOrganizerImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String? get image;

  /// Create a copy of TripOrganizer
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TripOrganizerImplCopyWith<_$TripOrganizerImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

TripMember _$TripMemberFromJson(Map<String, dynamic> json) {
  return _TripMember.fromJson(json);
}

/// @nodoc
mixin _$TripMember {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String? get image => throw _privateConstructorUsedError;

  /// Serializes this TripMember to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of TripMember
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TripMemberCopyWith<TripMember> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TripMemberCopyWith<$Res> {
  factory $TripMemberCopyWith(
    TripMember value,
    $Res Function(TripMember) then,
  ) = _$TripMemberCopyWithImpl<$Res, TripMember>;
  @useResult
  $Res call({String id, String name, String? image});
}

/// @nodoc
class _$TripMemberCopyWithImpl<$Res, $Val extends TripMember>
    implements $TripMemberCopyWith<$Res> {
  _$TripMemberCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of TripMember
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? id = null, Object? name = null, Object? image = freezed}) {
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
            image: freezed == image
                ? _value.image
                : image // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$TripMemberImplCopyWith<$Res>
    implements $TripMemberCopyWith<$Res> {
  factory _$$TripMemberImplCopyWith(
    _$TripMemberImpl value,
    $Res Function(_$TripMemberImpl) then,
  ) = __$$TripMemberImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, String name, String? image});
}

/// @nodoc
class __$$TripMemberImplCopyWithImpl<$Res>
    extends _$TripMemberCopyWithImpl<$Res, _$TripMemberImpl>
    implements _$$TripMemberImplCopyWith<$Res> {
  __$$TripMemberImplCopyWithImpl(
    _$TripMemberImpl _value,
    $Res Function(_$TripMemberImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of TripMember
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? id = null, Object? name = null, Object? image = freezed}) {
    return _then(
      _$TripMemberImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        image: freezed == image
            ? _value.image
            : image // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$TripMemberImpl implements _TripMember {
  const _$TripMemberImpl({required this.id, required this.name, this.image});

  factory _$TripMemberImpl.fromJson(Map<String, dynamic> json) =>
      _$$TripMemberImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String? image;

  @override
  String toString() {
    return 'TripMember(id: $id, name: $name, image: $image)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TripMemberImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.image, image) || other.image == image));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, image);

  /// Create a copy of TripMember
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TripMemberImplCopyWith<_$TripMemberImpl> get copyWith =>
      __$$TripMemberImplCopyWithImpl<_$TripMemberImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$TripMemberImplToJson(this);
  }
}

abstract class _TripMember implements TripMember {
  const factory _TripMember({
    required final String id,
    required final String name,
    final String? image,
  }) = _$TripMemberImpl;

  factory _TripMember.fromJson(Map<String, dynamic> json) =
      _$TripMemberImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String? get image;

  /// Create a copy of TripMember
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TripMemberImplCopyWith<_$TripMemberImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

TripSummary _$TripSummaryFromJson(Map<String, dynamic> json) {
  return _TripSummary.fromJson(json);
}

/// @nodoc
mixin _$TripSummary {
  String get id => throw _privateConstructorUsedError;
  String get slug => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get imageUrl => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String get difficulty => throw _privateConstructorUsedError;
  num get price => throw _privateConstructorUsedError;
  int get seatsTotal => throw _privateConstructorUsedError;
  int get seatsLeft => throw _privateConstructorUsedError;
  String get startDate => throw _privateConstructorUsedError;
  String get endDate => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  TripDestinationRef? get destination => throw _privateConstructorUsedError;
  int? get unreadMessages => throw _privateConstructorUsedError;
  int? get pendingRequests => throw _privateConstructorUsedError;
  int? get membersCount => throw _privateConstructorUsedError;

  /// Serializes this TripSummary to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of TripSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TripSummaryCopyWith<TripSummary> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TripSummaryCopyWith<$Res> {
  factory $TripSummaryCopyWith(
    TripSummary value,
    $Res Function(TripSummary) then,
  ) = _$TripSummaryCopyWithImpl<$Res, TripSummary>;
  @useResult
  $Res call({
    String id,
    String slug,
    String title,
    String imageUrl,
    String type,
    String difficulty,
    num price,
    int seatsTotal,
    int seatsLeft,
    String startDate,
    String endDate,
    String status,
    TripDestinationRef? destination,
    int? unreadMessages,
    int? pendingRequests,
    int? membersCount,
  });

  $TripDestinationRefCopyWith<$Res>? get destination;
}

/// @nodoc
class _$TripSummaryCopyWithImpl<$Res, $Val extends TripSummary>
    implements $TripSummaryCopyWith<$Res> {
  _$TripSummaryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of TripSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? slug = null,
    Object? title = null,
    Object? imageUrl = null,
    Object? type = null,
    Object? difficulty = null,
    Object? price = null,
    Object? seatsTotal = null,
    Object? seatsLeft = null,
    Object? startDate = null,
    Object? endDate = null,
    Object? status = null,
    Object? destination = freezed,
    Object? unreadMessages = freezed,
    Object? pendingRequests = freezed,
    Object? membersCount = freezed,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            slug: null == slug
                ? _value.slug
                : slug // ignore: cast_nullable_to_non_nullable
                      as String,
            title: null == title
                ? _value.title
                : title // ignore: cast_nullable_to_non_nullable
                      as String,
            imageUrl: null == imageUrl
                ? _value.imageUrl
                : imageUrl // ignore: cast_nullable_to_non_nullable
                      as String,
            type: null == type
                ? _value.type
                : type // ignore: cast_nullable_to_non_nullable
                      as String,
            difficulty: null == difficulty
                ? _value.difficulty
                : difficulty // ignore: cast_nullable_to_non_nullable
                      as String,
            price: null == price
                ? _value.price
                : price // ignore: cast_nullable_to_non_nullable
                      as num,
            seatsTotal: null == seatsTotal
                ? _value.seatsTotal
                : seatsTotal // ignore: cast_nullable_to_non_nullable
                      as int,
            seatsLeft: null == seatsLeft
                ? _value.seatsLeft
                : seatsLeft // ignore: cast_nullable_to_non_nullable
                      as int,
            startDate: null == startDate
                ? _value.startDate
                : startDate // ignore: cast_nullable_to_non_nullable
                      as String,
            endDate: null == endDate
                ? _value.endDate
                : endDate // ignore: cast_nullable_to_non_nullable
                      as String,
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String,
            destination: freezed == destination
                ? _value.destination
                : destination // ignore: cast_nullable_to_non_nullable
                      as TripDestinationRef?,
            unreadMessages: freezed == unreadMessages
                ? _value.unreadMessages
                : unreadMessages // ignore: cast_nullable_to_non_nullable
                      as int?,
            pendingRequests: freezed == pendingRequests
                ? _value.pendingRequests
                : pendingRequests // ignore: cast_nullable_to_non_nullable
                      as int?,
            membersCount: freezed == membersCount
                ? _value.membersCount
                : membersCount // ignore: cast_nullable_to_non_nullable
                      as int?,
          )
          as $Val,
    );
  }

  /// Create a copy of TripSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $TripDestinationRefCopyWith<$Res>? get destination {
    if (_value.destination == null) {
      return null;
    }

    return $TripDestinationRefCopyWith<$Res>(_value.destination!, (value) {
      return _then(_value.copyWith(destination: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$TripSummaryImplCopyWith<$Res>
    implements $TripSummaryCopyWith<$Res> {
  factory _$$TripSummaryImplCopyWith(
    _$TripSummaryImpl value,
    $Res Function(_$TripSummaryImpl) then,
  ) = __$$TripSummaryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String slug,
    String title,
    String imageUrl,
    String type,
    String difficulty,
    num price,
    int seatsTotal,
    int seatsLeft,
    String startDate,
    String endDate,
    String status,
    TripDestinationRef? destination,
    int? unreadMessages,
    int? pendingRequests,
    int? membersCount,
  });

  @override
  $TripDestinationRefCopyWith<$Res>? get destination;
}

/// @nodoc
class __$$TripSummaryImplCopyWithImpl<$Res>
    extends _$TripSummaryCopyWithImpl<$Res, _$TripSummaryImpl>
    implements _$$TripSummaryImplCopyWith<$Res> {
  __$$TripSummaryImplCopyWithImpl(
    _$TripSummaryImpl _value,
    $Res Function(_$TripSummaryImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of TripSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? slug = null,
    Object? title = null,
    Object? imageUrl = null,
    Object? type = null,
    Object? difficulty = null,
    Object? price = null,
    Object? seatsTotal = null,
    Object? seatsLeft = null,
    Object? startDate = null,
    Object? endDate = null,
    Object? status = null,
    Object? destination = freezed,
    Object? unreadMessages = freezed,
    Object? pendingRequests = freezed,
    Object? membersCount = freezed,
  }) {
    return _then(
      _$TripSummaryImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        slug: null == slug
            ? _value.slug
            : slug // ignore: cast_nullable_to_non_nullable
                  as String,
        title: null == title
            ? _value.title
            : title // ignore: cast_nullable_to_non_nullable
                  as String,
        imageUrl: null == imageUrl
            ? _value.imageUrl
            : imageUrl // ignore: cast_nullable_to_non_nullable
                  as String,
        type: null == type
            ? _value.type
            : type // ignore: cast_nullable_to_non_nullable
                  as String,
        difficulty: null == difficulty
            ? _value.difficulty
            : difficulty // ignore: cast_nullable_to_non_nullable
                  as String,
        price: null == price
            ? _value.price
            : price // ignore: cast_nullable_to_non_nullable
                  as num,
        seatsTotal: null == seatsTotal
            ? _value.seatsTotal
            : seatsTotal // ignore: cast_nullable_to_non_nullable
                  as int,
        seatsLeft: null == seatsLeft
            ? _value.seatsLeft
            : seatsLeft // ignore: cast_nullable_to_non_nullable
                  as int,
        startDate: null == startDate
            ? _value.startDate
            : startDate // ignore: cast_nullable_to_non_nullable
                  as String,
        endDate: null == endDate
            ? _value.endDate
            : endDate // ignore: cast_nullable_to_non_nullable
                  as String,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
        destination: freezed == destination
            ? _value.destination
            : destination // ignore: cast_nullable_to_non_nullable
                  as TripDestinationRef?,
        unreadMessages: freezed == unreadMessages
            ? _value.unreadMessages
            : unreadMessages // ignore: cast_nullable_to_non_nullable
                  as int?,
        pendingRequests: freezed == pendingRequests
            ? _value.pendingRequests
            : pendingRequests // ignore: cast_nullable_to_non_nullable
                  as int?,
        membersCount: freezed == membersCount
            ? _value.membersCount
            : membersCount // ignore: cast_nullable_to_non_nullable
                  as int?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$TripSummaryImpl implements _TripSummary {
  const _$TripSummaryImpl({
    required this.id,
    required this.slug,
    required this.title,
    required this.imageUrl,
    required this.type,
    required this.difficulty,
    required this.price,
    required this.seatsTotal,
    required this.seatsLeft,
    required this.startDate,
    required this.endDate,
    required this.status,
    this.destination,
    this.unreadMessages,
    this.pendingRequests,
    this.membersCount,
  });

  factory _$TripSummaryImpl.fromJson(Map<String, dynamic> json) =>
      _$$TripSummaryImplFromJson(json);

  @override
  final String id;
  @override
  final String slug;
  @override
  final String title;
  @override
  final String imageUrl;
  @override
  final String type;
  @override
  final String difficulty;
  @override
  final num price;
  @override
  final int seatsTotal;
  @override
  final int seatsLeft;
  @override
  final String startDate;
  @override
  final String endDate;
  @override
  final String status;
  @override
  final TripDestinationRef? destination;
  @override
  final int? unreadMessages;
  @override
  final int? pendingRequests;
  @override
  final int? membersCount;

  @override
  String toString() {
    return 'TripSummary(id: $id, slug: $slug, title: $title, imageUrl: $imageUrl, type: $type, difficulty: $difficulty, price: $price, seatsTotal: $seatsTotal, seatsLeft: $seatsLeft, startDate: $startDate, endDate: $endDate, status: $status, destination: $destination, unreadMessages: $unreadMessages, pendingRequests: $pendingRequests, membersCount: $membersCount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TripSummaryImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.imageUrl, imageUrl) ||
                other.imageUrl == imageUrl) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.difficulty, difficulty) ||
                other.difficulty == difficulty) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.seatsTotal, seatsTotal) ||
                other.seatsTotal == seatsTotal) &&
            (identical(other.seatsLeft, seatsLeft) ||
                other.seatsLeft == seatsLeft) &&
            (identical(other.startDate, startDate) ||
                other.startDate == startDate) &&
            (identical(other.endDate, endDate) || other.endDate == endDate) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.destination, destination) ||
                other.destination == destination) &&
            (identical(other.unreadMessages, unreadMessages) ||
                other.unreadMessages == unreadMessages) &&
            (identical(other.pendingRequests, pendingRequests) ||
                other.pendingRequests == pendingRequests) &&
            (identical(other.membersCount, membersCount) ||
                other.membersCount == membersCount));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    slug,
    title,
    imageUrl,
    type,
    difficulty,
    price,
    seatsTotal,
    seatsLeft,
    startDate,
    endDate,
    status,
    destination,
    unreadMessages,
    pendingRequests,
    membersCount,
  );

  /// Create a copy of TripSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TripSummaryImplCopyWith<_$TripSummaryImpl> get copyWith =>
      __$$TripSummaryImplCopyWithImpl<_$TripSummaryImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$TripSummaryImplToJson(this);
  }
}

abstract class _TripSummary implements TripSummary {
  const factory _TripSummary({
    required final String id,
    required final String slug,
    required final String title,
    required final String imageUrl,
    required final String type,
    required final String difficulty,
    required final num price,
    required final int seatsTotal,
    required final int seatsLeft,
    required final String startDate,
    required final String endDate,
    required final String status,
    final TripDestinationRef? destination,
    final int? unreadMessages,
    final int? pendingRequests,
    final int? membersCount,
  }) = _$TripSummaryImpl;

  factory _TripSummary.fromJson(Map<String, dynamic> json) =
      _$TripSummaryImpl.fromJson;

  @override
  String get id;
  @override
  String get slug;
  @override
  String get title;
  @override
  String get imageUrl;
  @override
  String get type;
  @override
  String get difficulty;
  @override
  num get price;
  @override
  int get seatsTotal;
  @override
  int get seatsLeft;
  @override
  String get startDate;
  @override
  String get endDate;
  @override
  String get status;
  @override
  TripDestinationRef? get destination;
  @override
  int? get unreadMessages;
  @override
  int? get pendingRequests;
  @override
  int? get membersCount;

  /// Create a copy of TripSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TripSummaryImplCopyWith<_$TripSummaryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

TripDetail _$TripDetailFromJson(Map<String, dynamic> json) {
  return _TripDetail.fromJson(json);
}

/// @nodoc
mixin _$TripDetail {
  String get id => throw _privateConstructorUsedError;
  String get slug => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get imageUrl => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String get difficulty => throw _privateConstructorUsedError;
  num get price => throw _privateConstructorUsedError;
  int get seatsTotal => throw _privateConstructorUsedError;
  int get seatsLeft => throw _privateConstructorUsedError;
  String get startDate => throw _privateConstructorUsedError;
  String get endDate => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  TripDestinationRef? get destination => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  List<String> get gallery => throw _privateConstructorUsedError;
  String? get meetingPoint => throw _privateConstructorUsedError;
  TripOrganizer get organizer => throw _privateConstructorUsedError;
  List<TripMember>? get members => throw _privateConstructorUsedError;

  /// Serializes this TripDetail to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of TripDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TripDetailCopyWith<TripDetail> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TripDetailCopyWith<$Res> {
  factory $TripDetailCopyWith(
    TripDetail value,
    $Res Function(TripDetail) then,
  ) = _$TripDetailCopyWithImpl<$Res, TripDetail>;
  @useResult
  $Res call({
    String id,
    String slug,
    String title,
    String imageUrl,
    String type,
    String difficulty,
    num price,
    int seatsTotal,
    int seatsLeft,
    String startDate,
    String endDate,
    String status,
    TripDestinationRef? destination,
    String description,
    List<String> gallery,
    String? meetingPoint,
    TripOrganizer organizer,
    List<TripMember>? members,
  });

  $TripDestinationRefCopyWith<$Res>? get destination;
  $TripOrganizerCopyWith<$Res> get organizer;
}

/// @nodoc
class _$TripDetailCopyWithImpl<$Res, $Val extends TripDetail>
    implements $TripDetailCopyWith<$Res> {
  _$TripDetailCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of TripDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? slug = null,
    Object? title = null,
    Object? imageUrl = null,
    Object? type = null,
    Object? difficulty = null,
    Object? price = null,
    Object? seatsTotal = null,
    Object? seatsLeft = null,
    Object? startDate = null,
    Object? endDate = null,
    Object? status = null,
    Object? destination = freezed,
    Object? description = null,
    Object? gallery = null,
    Object? meetingPoint = freezed,
    Object? organizer = null,
    Object? members = freezed,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            slug: null == slug
                ? _value.slug
                : slug // ignore: cast_nullable_to_non_nullable
                      as String,
            title: null == title
                ? _value.title
                : title // ignore: cast_nullable_to_non_nullable
                      as String,
            imageUrl: null == imageUrl
                ? _value.imageUrl
                : imageUrl // ignore: cast_nullable_to_non_nullable
                      as String,
            type: null == type
                ? _value.type
                : type // ignore: cast_nullable_to_non_nullable
                      as String,
            difficulty: null == difficulty
                ? _value.difficulty
                : difficulty // ignore: cast_nullable_to_non_nullable
                      as String,
            price: null == price
                ? _value.price
                : price // ignore: cast_nullable_to_non_nullable
                      as num,
            seatsTotal: null == seatsTotal
                ? _value.seatsTotal
                : seatsTotal // ignore: cast_nullable_to_non_nullable
                      as int,
            seatsLeft: null == seatsLeft
                ? _value.seatsLeft
                : seatsLeft // ignore: cast_nullable_to_non_nullable
                      as int,
            startDate: null == startDate
                ? _value.startDate
                : startDate // ignore: cast_nullable_to_non_nullable
                      as String,
            endDate: null == endDate
                ? _value.endDate
                : endDate // ignore: cast_nullable_to_non_nullable
                      as String,
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String,
            destination: freezed == destination
                ? _value.destination
                : destination // ignore: cast_nullable_to_non_nullable
                      as TripDestinationRef?,
            description: null == description
                ? _value.description
                : description // ignore: cast_nullable_to_non_nullable
                      as String,
            gallery: null == gallery
                ? _value.gallery
                : gallery // ignore: cast_nullable_to_non_nullable
                      as List<String>,
            meetingPoint: freezed == meetingPoint
                ? _value.meetingPoint
                : meetingPoint // ignore: cast_nullable_to_non_nullable
                      as String?,
            organizer: null == organizer
                ? _value.organizer
                : organizer // ignore: cast_nullable_to_non_nullable
                      as TripOrganizer,
            members: freezed == members
                ? _value.members
                : members // ignore: cast_nullable_to_non_nullable
                      as List<TripMember>?,
          )
          as $Val,
    );
  }

  /// Create a copy of TripDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $TripDestinationRefCopyWith<$Res>? get destination {
    if (_value.destination == null) {
      return null;
    }

    return $TripDestinationRefCopyWith<$Res>(_value.destination!, (value) {
      return _then(_value.copyWith(destination: value) as $Val);
    });
  }

  /// Create a copy of TripDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $TripOrganizerCopyWith<$Res> get organizer {
    return $TripOrganizerCopyWith<$Res>(_value.organizer, (value) {
      return _then(_value.copyWith(organizer: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$TripDetailImplCopyWith<$Res>
    implements $TripDetailCopyWith<$Res> {
  factory _$$TripDetailImplCopyWith(
    _$TripDetailImpl value,
    $Res Function(_$TripDetailImpl) then,
  ) = __$$TripDetailImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String slug,
    String title,
    String imageUrl,
    String type,
    String difficulty,
    num price,
    int seatsTotal,
    int seatsLeft,
    String startDate,
    String endDate,
    String status,
    TripDestinationRef? destination,
    String description,
    List<String> gallery,
    String? meetingPoint,
    TripOrganizer organizer,
    List<TripMember>? members,
  });

  @override
  $TripDestinationRefCopyWith<$Res>? get destination;
  @override
  $TripOrganizerCopyWith<$Res> get organizer;
}

/// @nodoc
class __$$TripDetailImplCopyWithImpl<$Res>
    extends _$TripDetailCopyWithImpl<$Res, _$TripDetailImpl>
    implements _$$TripDetailImplCopyWith<$Res> {
  __$$TripDetailImplCopyWithImpl(
    _$TripDetailImpl _value,
    $Res Function(_$TripDetailImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of TripDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? slug = null,
    Object? title = null,
    Object? imageUrl = null,
    Object? type = null,
    Object? difficulty = null,
    Object? price = null,
    Object? seatsTotal = null,
    Object? seatsLeft = null,
    Object? startDate = null,
    Object? endDate = null,
    Object? status = null,
    Object? destination = freezed,
    Object? description = null,
    Object? gallery = null,
    Object? meetingPoint = freezed,
    Object? organizer = null,
    Object? members = freezed,
  }) {
    return _then(
      _$TripDetailImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        slug: null == slug
            ? _value.slug
            : slug // ignore: cast_nullable_to_non_nullable
                  as String,
        title: null == title
            ? _value.title
            : title // ignore: cast_nullable_to_non_nullable
                  as String,
        imageUrl: null == imageUrl
            ? _value.imageUrl
            : imageUrl // ignore: cast_nullable_to_non_nullable
                  as String,
        type: null == type
            ? _value.type
            : type // ignore: cast_nullable_to_non_nullable
                  as String,
        difficulty: null == difficulty
            ? _value.difficulty
            : difficulty // ignore: cast_nullable_to_non_nullable
                  as String,
        price: null == price
            ? _value.price
            : price // ignore: cast_nullable_to_non_nullable
                  as num,
        seatsTotal: null == seatsTotal
            ? _value.seatsTotal
            : seatsTotal // ignore: cast_nullable_to_non_nullable
                  as int,
        seatsLeft: null == seatsLeft
            ? _value.seatsLeft
            : seatsLeft // ignore: cast_nullable_to_non_nullable
                  as int,
        startDate: null == startDate
            ? _value.startDate
            : startDate // ignore: cast_nullable_to_non_nullable
                  as String,
        endDate: null == endDate
            ? _value.endDate
            : endDate // ignore: cast_nullable_to_non_nullable
                  as String,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
        destination: freezed == destination
            ? _value.destination
            : destination // ignore: cast_nullable_to_non_nullable
                  as TripDestinationRef?,
        description: null == description
            ? _value.description
            : description // ignore: cast_nullable_to_non_nullable
                  as String,
        gallery: null == gallery
            ? _value._gallery
            : gallery // ignore: cast_nullable_to_non_nullable
                  as List<String>,
        meetingPoint: freezed == meetingPoint
            ? _value.meetingPoint
            : meetingPoint // ignore: cast_nullable_to_non_nullable
                  as String?,
        organizer: null == organizer
            ? _value.organizer
            : organizer // ignore: cast_nullable_to_non_nullable
                  as TripOrganizer,
        members: freezed == members
            ? _value._members
            : members // ignore: cast_nullable_to_non_nullable
                  as List<TripMember>?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$TripDetailImpl implements _TripDetail {
  const _$TripDetailImpl({
    required this.id,
    required this.slug,
    required this.title,
    required this.imageUrl,
    required this.type,
    required this.difficulty,
    required this.price,
    required this.seatsTotal,
    required this.seatsLeft,
    required this.startDate,
    required this.endDate,
    required this.status,
    this.destination,
    required this.description,
    required final List<String> gallery,
    this.meetingPoint,
    required this.organizer,
    final List<TripMember>? members,
  }) : _gallery = gallery,
       _members = members;

  factory _$TripDetailImpl.fromJson(Map<String, dynamic> json) =>
      _$$TripDetailImplFromJson(json);

  @override
  final String id;
  @override
  final String slug;
  @override
  final String title;
  @override
  final String imageUrl;
  @override
  final String type;
  @override
  final String difficulty;
  @override
  final num price;
  @override
  final int seatsTotal;
  @override
  final int seatsLeft;
  @override
  final String startDate;
  @override
  final String endDate;
  @override
  final String status;
  @override
  final TripDestinationRef? destination;
  @override
  final String description;
  final List<String> _gallery;
  @override
  List<String> get gallery {
    if (_gallery is EqualUnmodifiableListView) return _gallery;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_gallery);
  }

  @override
  final String? meetingPoint;
  @override
  final TripOrganizer organizer;
  final List<TripMember>? _members;
  @override
  List<TripMember>? get members {
    final value = _members;
    if (value == null) return null;
    if (_members is EqualUnmodifiableListView) return _members;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  String toString() {
    return 'TripDetail(id: $id, slug: $slug, title: $title, imageUrl: $imageUrl, type: $type, difficulty: $difficulty, price: $price, seatsTotal: $seatsTotal, seatsLeft: $seatsLeft, startDate: $startDate, endDate: $endDate, status: $status, destination: $destination, description: $description, gallery: $gallery, meetingPoint: $meetingPoint, organizer: $organizer, members: $members)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TripDetailImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.imageUrl, imageUrl) ||
                other.imageUrl == imageUrl) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.difficulty, difficulty) ||
                other.difficulty == difficulty) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.seatsTotal, seatsTotal) ||
                other.seatsTotal == seatsTotal) &&
            (identical(other.seatsLeft, seatsLeft) ||
                other.seatsLeft == seatsLeft) &&
            (identical(other.startDate, startDate) ||
                other.startDate == startDate) &&
            (identical(other.endDate, endDate) || other.endDate == endDate) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.destination, destination) ||
                other.destination == destination) &&
            (identical(other.description, description) ||
                other.description == description) &&
            const DeepCollectionEquality().equals(other._gallery, _gallery) &&
            (identical(other.meetingPoint, meetingPoint) ||
                other.meetingPoint == meetingPoint) &&
            (identical(other.organizer, organizer) ||
                other.organizer == organizer) &&
            const DeepCollectionEquality().equals(other._members, _members));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    slug,
    title,
    imageUrl,
    type,
    difficulty,
    price,
    seatsTotal,
    seatsLeft,
    startDate,
    endDate,
    status,
    destination,
    description,
    const DeepCollectionEquality().hash(_gallery),
    meetingPoint,
    organizer,
    const DeepCollectionEquality().hash(_members),
  );

  /// Create a copy of TripDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TripDetailImplCopyWith<_$TripDetailImpl> get copyWith =>
      __$$TripDetailImplCopyWithImpl<_$TripDetailImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$TripDetailImplToJson(this);
  }
}

abstract class _TripDetail implements TripDetail {
  const factory _TripDetail({
    required final String id,
    required final String slug,
    required final String title,
    required final String imageUrl,
    required final String type,
    required final String difficulty,
    required final num price,
    required final int seatsTotal,
    required final int seatsLeft,
    required final String startDate,
    required final String endDate,
    required final String status,
    final TripDestinationRef? destination,
    required final String description,
    required final List<String> gallery,
    final String? meetingPoint,
    required final TripOrganizer organizer,
    final List<TripMember>? members,
  }) = _$TripDetailImpl;

  factory _TripDetail.fromJson(Map<String, dynamic> json) =
      _$TripDetailImpl.fromJson;

  @override
  String get id;
  @override
  String get slug;
  @override
  String get title;
  @override
  String get imageUrl;
  @override
  String get type;
  @override
  String get difficulty;
  @override
  num get price;
  @override
  int get seatsTotal;
  @override
  int get seatsLeft;
  @override
  String get startDate;
  @override
  String get endDate;
  @override
  String get status;
  @override
  TripDestinationRef? get destination;
  @override
  String get description;
  @override
  List<String> get gallery;
  @override
  String? get meetingPoint;
  @override
  TripOrganizer get organizer;
  @override
  List<TripMember>? get members;

  /// Create a copy of TripDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TripDetailImplCopyWith<_$TripDetailImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

RideRequestRider _$RideRequestRiderFromJson(Map<String, dynamic> json) {
  return _RideRequestRider.fromJson(json);
}

/// @nodoc
mixin _$RideRequestRider {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String? get image => throw _privateConstructorUsedError;
  int? get completedRides => throw _privateConstructorUsedError;
  num? get rating => throw _privateConstructorUsedError;
  String? get bike => throw _privateConstructorUsedError;

  /// Serializes this RideRequestRider to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of RideRequestRider
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $RideRequestRiderCopyWith<RideRequestRider> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $RideRequestRiderCopyWith<$Res> {
  factory $RideRequestRiderCopyWith(
    RideRequestRider value,
    $Res Function(RideRequestRider) then,
  ) = _$RideRequestRiderCopyWithImpl<$Res, RideRequestRider>;
  @useResult
  $Res call({
    String id,
    String name,
    String? image,
    int? completedRides,
    num? rating,
    String? bike,
  });
}

/// @nodoc
class _$RideRequestRiderCopyWithImpl<$Res, $Val extends RideRequestRider>
    implements $RideRequestRiderCopyWith<$Res> {
  _$RideRequestRiderCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of RideRequestRider
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? image = freezed,
    Object? completedRides = freezed,
    Object? rating = freezed,
    Object? bike = freezed,
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
            image: freezed == image
                ? _value.image
                : image // ignore: cast_nullable_to_non_nullable
                      as String?,
            completedRides: freezed == completedRides
                ? _value.completedRides
                : completedRides // ignore: cast_nullable_to_non_nullable
                      as int?,
            rating: freezed == rating
                ? _value.rating
                : rating // ignore: cast_nullable_to_non_nullable
                      as num?,
            bike: freezed == bike
                ? _value.bike
                : bike // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$RideRequestRiderImplCopyWith<$Res>
    implements $RideRequestRiderCopyWith<$Res> {
  factory _$$RideRequestRiderImplCopyWith(
    _$RideRequestRiderImpl value,
    $Res Function(_$RideRequestRiderImpl) then,
  ) = __$$RideRequestRiderImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String name,
    String? image,
    int? completedRides,
    num? rating,
    String? bike,
  });
}

/// @nodoc
class __$$RideRequestRiderImplCopyWithImpl<$Res>
    extends _$RideRequestRiderCopyWithImpl<$Res, _$RideRequestRiderImpl>
    implements _$$RideRequestRiderImplCopyWith<$Res> {
  __$$RideRequestRiderImplCopyWithImpl(
    _$RideRequestRiderImpl _value,
    $Res Function(_$RideRequestRiderImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of RideRequestRider
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? image = freezed,
    Object? completedRides = freezed,
    Object? rating = freezed,
    Object? bike = freezed,
  }) {
    return _then(
      _$RideRequestRiderImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        image: freezed == image
            ? _value.image
            : image // ignore: cast_nullable_to_non_nullable
                  as String?,
        completedRides: freezed == completedRides
            ? _value.completedRides
            : completedRides // ignore: cast_nullable_to_non_nullable
                  as int?,
        rating: freezed == rating
            ? _value.rating
            : rating // ignore: cast_nullable_to_non_nullable
                  as num?,
        bike: freezed == bike
            ? _value.bike
            : bike // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$RideRequestRiderImpl implements _RideRequestRider {
  const _$RideRequestRiderImpl({
    required this.id,
    required this.name,
    this.image,
    this.completedRides,
    this.rating,
    this.bike,
  });

  factory _$RideRequestRiderImpl.fromJson(Map<String, dynamic> json) =>
      _$$RideRequestRiderImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String? image;
  @override
  final int? completedRides;
  @override
  final num? rating;
  @override
  final String? bike;

  @override
  String toString() {
    return 'RideRequestRider(id: $id, name: $name, image: $image, completedRides: $completedRides, rating: $rating, bike: $bike)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RideRequestRiderImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.image, image) || other.image == image) &&
            (identical(other.completedRides, completedRides) ||
                other.completedRides == completedRides) &&
            (identical(other.rating, rating) || other.rating == rating) &&
            (identical(other.bike, bike) || other.bike == bike));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, id, name, image, completedRides, rating, bike);

  /// Create a copy of RideRequestRider
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$RideRequestRiderImplCopyWith<_$RideRequestRiderImpl> get copyWith =>
      __$$RideRequestRiderImplCopyWithImpl<_$RideRequestRiderImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$RideRequestRiderImplToJson(this);
  }
}

abstract class _RideRequestRider implements RideRequestRider {
  const factory _RideRequestRider({
    required final String id,
    required final String name,
    final String? image,
    final int? completedRides,
    final num? rating,
    final String? bike,
  }) = _$RideRequestRiderImpl;

  factory _RideRequestRider.fromJson(Map<String, dynamic> json) =
      _$RideRequestRiderImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String? get image;
  @override
  int? get completedRides;
  @override
  num? get rating;
  @override
  String? get bike;

  /// Create a copy of RideRequestRider
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$RideRequestRiderImplCopyWith<_$RideRequestRiderImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

RideJoinRequest _$RideJoinRequestFromJson(Map<String, dynamic> json) {
  return _RideJoinRequest.fromJson(json);
}

/// @nodoc
mixin _$RideJoinRequest {
  String get id => throw _privateConstructorUsedError;
  String get tripId => throw _privateConstructorUsedError;
  String get tripSlug => throw _privateConstructorUsedError;
  String get tripTitle => throw _privateConstructorUsedError;
  String? get message => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;
  RideRequestRider get rider => throw _privateConstructorUsedError;

  /// Serializes this RideJoinRequest to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of RideJoinRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $RideJoinRequestCopyWith<RideJoinRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $RideJoinRequestCopyWith<$Res> {
  factory $RideJoinRequestCopyWith(
    RideJoinRequest value,
    $Res Function(RideJoinRequest) then,
  ) = _$RideJoinRequestCopyWithImpl<$Res, RideJoinRequest>;
  @useResult
  $Res call({
    String id,
    String tripId,
    String tripSlug,
    String tripTitle,
    String? message,
    String createdAt,
    RideRequestRider rider,
  });

  $RideRequestRiderCopyWith<$Res> get rider;
}

/// @nodoc
class _$RideJoinRequestCopyWithImpl<$Res, $Val extends RideJoinRequest>
    implements $RideJoinRequestCopyWith<$Res> {
  _$RideJoinRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of RideJoinRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? tripId = null,
    Object? tripSlug = null,
    Object? tripTitle = null,
    Object? message = freezed,
    Object? createdAt = null,
    Object? rider = null,
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
            tripSlug: null == tripSlug
                ? _value.tripSlug
                : tripSlug // ignore: cast_nullable_to_non_nullable
                      as String,
            tripTitle: null == tripTitle
                ? _value.tripTitle
                : tripTitle // ignore: cast_nullable_to_non_nullable
                      as String,
            message: freezed == message
                ? _value.message
                : message // ignore: cast_nullable_to_non_nullable
                      as String?,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as String,
            rider: null == rider
                ? _value.rider
                : rider // ignore: cast_nullable_to_non_nullable
                      as RideRequestRider,
          )
          as $Val,
    );
  }

  /// Create a copy of RideJoinRequest
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $RideRequestRiderCopyWith<$Res> get rider {
    return $RideRequestRiderCopyWith<$Res>(_value.rider, (value) {
      return _then(_value.copyWith(rider: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$RideJoinRequestImplCopyWith<$Res>
    implements $RideJoinRequestCopyWith<$Res> {
  factory _$$RideJoinRequestImplCopyWith(
    _$RideJoinRequestImpl value,
    $Res Function(_$RideJoinRequestImpl) then,
  ) = __$$RideJoinRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String tripId,
    String tripSlug,
    String tripTitle,
    String? message,
    String createdAt,
    RideRequestRider rider,
  });

  @override
  $RideRequestRiderCopyWith<$Res> get rider;
}

/// @nodoc
class __$$RideJoinRequestImplCopyWithImpl<$Res>
    extends _$RideJoinRequestCopyWithImpl<$Res, _$RideJoinRequestImpl>
    implements _$$RideJoinRequestImplCopyWith<$Res> {
  __$$RideJoinRequestImplCopyWithImpl(
    _$RideJoinRequestImpl _value,
    $Res Function(_$RideJoinRequestImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of RideJoinRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? tripId = null,
    Object? tripSlug = null,
    Object? tripTitle = null,
    Object? message = freezed,
    Object? createdAt = null,
    Object? rider = null,
  }) {
    return _then(
      _$RideJoinRequestImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        tripId: null == tripId
            ? _value.tripId
            : tripId // ignore: cast_nullable_to_non_nullable
                  as String,
        tripSlug: null == tripSlug
            ? _value.tripSlug
            : tripSlug // ignore: cast_nullable_to_non_nullable
                  as String,
        tripTitle: null == tripTitle
            ? _value.tripTitle
            : tripTitle // ignore: cast_nullable_to_non_nullable
                  as String,
        message: freezed == message
            ? _value.message
            : message // ignore: cast_nullable_to_non_nullable
                  as String?,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as String,
        rider: null == rider
            ? _value.rider
            : rider // ignore: cast_nullable_to_non_nullable
                  as RideRequestRider,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$RideJoinRequestImpl implements _RideJoinRequest {
  const _$RideJoinRequestImpl({
    required this.id,
    required this.tripId,
    required this.tripSlug,
    required this.tripTitle,
    this.message,
    required this.createdAt,
    required this.rider,
  });

  factory _$RideJoinRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$RideJoinRequestImplFromJson(json);

  @override
  final String id;
  @override
  final String tripId;
  @override
  final String tripSlug;
  @override
  final String tripTitle;
  @override
  final String? message;
  @override
  final String createdAt;
  @override
  final RideRequestRider rider;

  @override
  String toString() {
    return 'RideJoinRequest(id: $id, tripId: $tripId, tripSlug: $tripSlug, tripTitle: $tripTitle, message: $message, createdAt: $createdAt, rider: $rider)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RideJoinRequestImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.tripId, tripId) || other.tripId == tripId) &&
            (identical(other.tripSlug, tripSlug) ||
                other.tripSlug == tripSlug) &&
            (identical(other.tripTitle, tripTitle) ||
                other.tripTitle == tripTitle) &&
            (identical(other.message, message) || other.message == message) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.rider, rider) || other.rider == rider));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    tripId,
    tripSlug,
    tripTitle,
    message,
    createdAt,
    rider,
  );

  /// Create a copy of RideJoinRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$RideJoinRequestImplCopyWith<_$RideJoinRequestImpl> get copyWith =>
      __$$RideJoinRequestImplCopyWithImpl<_$RideJoinRequestImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$RideJoinRequestImplToJson(this);
  }
}

abstract class _RideJoinRequest implements RideJoinRequest {
  const factory _RideJoinRequest({
    required final String id,
    required final String tripId,
    required final String tripSlug,
    required final String tripTitle,
    final String? message,
    required final String createdAt,
    required final RideRequestRider rider,
  }) = _$RideJoinRequestImpl;

  factory _RideJoinRequest.fromJson(Map<String, dynamic> json) =
      _$RideJoinRequestImpl.fromJson;

  @override
  String get id;
  @override
  String get tripId;
  @override
  String get tripSlug;
  @override
  String get tripTitle;
  @override
  String? get message;
  @override
  String get createdAt;
  @override
  RideRequestRider get rider;

  /// Create a copy of RideJoinRequest
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$RideJoinRequestImplCopyWith<_$RideJoinRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

MyRideRequestStatus _$MyRideRequestStatusFromJson(Map<String, dynamic> json) {
  return _MyRideRequestStatus.fromJson(json);
}

/// @nodoc
mixin _$MyRideRequestStatus {
  String get status => throw _privateConstructorUsedError;
  String? get message => throw _privateConstructorUsedError;

  /// Serializes this MyRideRequestStatus to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of MyRideRequestStatus
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $MyRideRequestStatusCopyWith<MyRideRequestStatus> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $MyRideRequestStatusCopyWith<$Res> {
  factory $MyRideRequestStatusCopyWith(
    MyRideRequestStatus value,
    $Res Function(MyRideRequestStatus) then,
  ) = _$MyRideRequestStatusCopyWithImpl<$Res, MyRideRequestStatus>;
  @useResult
  $Res call({String status, String? message});
}

/// @nodoc
class _$MyRideRequestStatusCopyWithImpl<$Res, $Val extends MyRideRequestStatus>
    implements $MyRideRequestStatusCopyWith<$Res> {
  _$MyRideRequestStatusCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of MyRideRequestStatus
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? status = null, Object? message = freezed}) {
    return _then(
      _value.copyWith(
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String,
            message: freezed == message
                ? _value.message
                : message // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$MyRideRequestStatusImplCopyWith<$Res>
    implements $MyRideRequestStatusCopyWith<$Res> {
  factory _$$MyRideRequestStatusImplCopyWith(
    _$MyRideRequestStatusImpl value,
    $Res Function(_$MyRideRequestStatusImpl) then,
  ) = __$$MyRideRequestStatusImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String status, String? message});
}

/// @nodoc
class __$$MyRideRequestStatusImplCopyWithImpl<$Res>
    extends _$MyRideRequestStatusCopyWithImpl<$Res, _$MyRideRequestStatusImpl>
    implements _$$MyRideRequestStatusImplCopyWith<$Res> {
  __$$MyRideRequestStatusImplCopyWithImpl(
    _$MyRideRequestStatusImpl _value,
    $Res Function(_$MyRideRequestStatusImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of MyRideRequestStatus
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? status = null, Object? message = freezed}) {
    return _then(
      _$MyRideRequestStatusImpl(
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
        message: freezed == message
            ? _value.message
            : message // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$MyRideRequestStatusImpl implements _MyRideRequestStatus {
  const _$MyRideRequestStatusImpl({required this.status, this.message});

  factory _$MyRideRequestStatusImpl.fromJson(Map<String, dynamic> json) =>
      _$$MyRideRequestStatusImplFromJson(json);

  @override
  final String status;
  @override
  final String? message;

  @override
  String toString() {
    return 'MyRideRequestStatus(status: $status, message: $message)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MyRideRequestStatusImpl &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.message, message) || other.message == message));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, status, message);

  /// Create a copy of MyRideRequestStatus
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MyRideRequestStatusImplCopyWith<_$MyRideRequestStatusImpl> get copyWith =>
      __$$MyRideRequestStatusImplCopyWithImpl<_$MyRideRequestStatusImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$MyRideRequestStatusImplToJson(this);
  }
}

abstract class _MyRideRequestStatus implements MyRideRequestStatus {
  const factory _MyRideRequestStatus({
    required final String status,
    final String? message,
  }) = _$MyRideRequestStatusImpl;

  factory _MyRideRequestStatus.fromJson(Map<String, dynamic> json) =
      _$MyRideRequestStatusImpl.fromJson;

  @override
  String get status;
  @override
  String? get message;

  /// Create a copy of MyRideRequestStatus
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MyRideRequestStatusImplCopyWith<_$MyRideRequestStatusImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

RideStats _$RideStatsFromJson(Map<String, dynamic> json) {
  return _RideStats.fromJson(json);
}

/// @nodoc
mixin _$RideStats {
  int get ridesOrganized => throw _privateConstructorUsedError;
  int get requestsSent => throw _privateConstructorUsedError;
  int get requestsApproved => throw _privateConstructorUsedError;
  int get ridesCancelled => throw _privateConstructorUsedError;
  int? get approvalRate => throw _privateConstructorUsedError;

  /// Serializes this RideStats to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of RideStats
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $RideStatsCopyWith<RideStats> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $RideStatsCopyWith<$Res> {
  factory $RideStatsCopyWith(RideStats value, $Res Function(RideStats) then) =
      _$RideStatsCopyWithImpl<$Res, RideStats>;
  @useResult
  $Res call({
    int ridesOrganized,
    int requestsSent,
    int requestsApproved,
    int ridesCancelled,
    int? approvalRate,
  });
}

/// @nodoc
class _$RideStatsCopyWithImpl<$Res, $Val extends RideStats>
    implements $RideStatsCopyWith<$Res> {
  _$RideStatsCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of RideStats
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? ridesOrganized = null,
    Object? requestsSent = null,
    Object? requestsApproved = null,
    Object? ridesCancelled = null,
    Object? approvalRate = freezed,
  }) {
    return _then(
      _value.copyWith(
            ridesOrganized: null == ridesOrganized
                ? _value.ridesOrganized
                : ridesOrganized // ignore: cast_nullable_to_non_nullable
                      as int,
            requestsSent: null == requestsSent
                ? _value.requestsSent
                : requestsSent // ignore: cast_nullable_to_non_nullable
                      as int,
            requestsApproved: null == requestsApproved
                ? _value.requestsApproved
                : requestsApproved // ignore: cast_nullable_to_non_nullable
                      as int,
            ridesCancelled: null == ridesCancelled
                ? _value.ridesCancelled
                : ridesCancelled // ignore: cast_nullable_to_non_nullable
                      as int,
            approvalRate: freezed == approvalRate
                ? _value.approvalRate
                : approvalRate // ignore: cast_nullable_to_non_nullable
                      as int?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$RideStatsImplCopyWith<$Res>
    implements $RideStatsCopyWith<$Res> {
  factory _$$RideStatsImplCopyWith(
    _$RideStatsImpl value,
    $Res Function(_$RideStatsImpl) then,
  ) = __$$RideStatsImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    int ridesOrganized,
    int requestsSent,
    int requestsApproved,
    int ridesCancelled,
    int? approvalRate,
  });
}

/// @nodoc
class __$$RideStatsImplCopyWithImpl<$Res>
    extends _$RideStatsCopyWithImpl<$Res, _$RideStatsImpl>
    implements _$$RideStatsImplCopyWith<$Res> {
  __$$RideStatsImplCopyWithImpl(
    _$RideStatsImpl _value,
    $Res Function(_$RideStatsImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of RideStats
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? ridesOrganized = null,
    Object? requestsSent = null,
    Object? requestsApproved = null,
    Object? ridesCancelled = null,
    Object? approvalRate = freezed,
  }) {
    return _then(
      _$RideStatsImpl(
        ridesOrganized: null == ridesOrganized
            ? _value.ridesOrganized
            : ridesOrganized // ignore: cast_nullable_to_non_nullable
                  as int,
        requestsSent: null == requestsSent
            ? _value.requestsSent
            : requestsSent // ignore: cast_nullable_to_non_nullable
                  as int,
        requestsApproved: null == requestsApproved
            ? _value.requestsApproved
            : requestsApproved // ignore: cast_nullable_to_non_nullable
                  as int,
        ridesCancelled: null == ridesCancelled
            ? _value.ridesCancelled
            : ridesCancelled // ignore: cast_nullable_to_non_nullable
                  as int,
        approvalRate: freezed == approvalRate
            ? _value.approvalRate
            : approvalRate // ignore: cast_nullable_to_non_nullable
                  as int?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$RideStatsImpl implements _RideStats {
  const _$RideStatsImpl({
    required this.ridesOrganized,
    required this.requestsSent,
    required this.requestsApproved,
    required this.ridesCancelled,
    this.approvalRate,
  });

  factory _$RideStatsImpl.fromJson(Map<String, dynamic> json) =>
      _$$RideStatsImplFromJson(json);

  @override
  final int ridesOrganized;
  @override
  final int requestsSent;
  @override
  final int requestsApproved;
  @override
  final int ridesCancelled;
  @override
  final int? approvalRate;

  @override
  String toString() {
    return 'RideStats(ridesOrganized: $ridesOrganized, requestsSent: $requestsSent, requestsApproved: $requestsApproved, ridesCancelled: $ridesCancelled, approvalRate: $approvalRate)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RideStatsImpl &&
            (identical(other.ridesOrganized, ridesOrganized) ||
                other.ridesOrganized == ridesOrganized) &&
            (identical(other.requestsSent, requestsSent) ||
                other.requestsSent == requestsSent) &&
            (identical(other.requestsApproved, requestsApproved) ||
                other.requestsApproved == requestsApproved) &&
            (identical(other.ridesCancelled, ridesCancelled) ||
                other.ridesCancelled == ridesCancelled) &&
            (identical(other.approvalRate, approvalRate) ||
                other.approvalRate == approvalRate));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    ridesOrganized,
    requestsSent,
    requestsApproved,
    ridesCancelled,
    approvalRate,
  );

  /// Create a copy of RideStats
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$RideStatsImplCopyWith<_$RideStatsImpl> get copyWith =>
      __$$RideStatsImplCopyWithImpl<_$RideStatsImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$RideStatsImplToJson(this);
  }
}

abstract class _RideStats implements RideStats {
  const factory _RideStats({
    required final int ridesOrganized,
    required final int requestsSent,
    required final int requestsApproved,
    required final int ridesCancelled,
    final int? approvalRate,
  }) = _$RideStatsImpl;

  factory _RideStats.fromJson(Map<String, dynamic> json) =
      _$RideStatsImpl.fromJson;

  @override
  int get ridesOrganized;
  @override
  int get requestsSent;
  @override
  int get requestsApproved;
  @override
  int get ridesCancelled;
  @override
  int? get approvalRate;

  /// Create a copy of RideStats
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$RideStatsImplCopyWith<_$RideStatsImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

MyRides _$MyRidesFromJson(Map<String, dynamic> json) {
  return _MyRides.fromJson(json);
}

/// @nodoc
mixin _$MyRides {
  List<TripSummary> get organized => throw _privateConstructorUsedError;
  List<TripSummary> get joined => throw _privateConstructorUsedError;
  List<TripSummary> get requested => throw _privateConstructorUsedError;
  RideStats get stats => throw _privateConstructorUsedError;

  /// Serializes this MyRides to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of MyRides
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $MyRidesCopyWith<MyRides> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $MyRidesCopyWith<$Res> {
  factory $MyRidesCopyWith(MyRides value, $Res Function(MyRides) then) =
      _$MyRidesCopyWithImpl<$Res, MyRides>;
  @useResult
  $Res call({
    List<TripSummary> organized,
    List<TripSummary> joined,
    List<TripSummary> requested,
    RideStats stats,
  });

  $RideStatsCopyWith<$Res> get stats;
}

/// @nodoc
class _$MyRidesCopyWithImpl<$Res, $Val extends MyRides>
    implements $MyRidesCopyWith<$Res> {
  _$MyRidesCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of MyRides
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? organized = null,
    Object? joined = null,
    Object? requested = null,
    Object? stats = null,
  }) {
    return _then(
      _value.copyWith(
            organized: null == organized
                ? _value.organized
                : organized // ignore: cast_nullable_to_non_nullable
                      as List<TripSummary>,
            joined: null == joined
                ? _value.joined
                : joined // ignore: cast_nullable_to_non_nullable
                      as List<TripSummary>,
            requested: null == requested
                ? _value.requested
                : requested // ignore: cast_nullable_to_non_nullable
                      as List<TripSummary>,
            stats: null == stats
                ? _value.stats
                : stats // ignore: cast_nullable_to_non_nullable
                      as RideStats,
          )
          as $Val,
    );
  }

  /// Create a copy of MyRides
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $RideStatsCopyWith<$Res> get stats {
    return $RideStatsCopyWith<$Res>(_value.stats, (value) {
      return _then(_value.copyWith(stats: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$MyRidesImplCopyWith<$Res> implements $MyRidesCopyWith<$Res> {
  factory _$$MyRidesImplCopyWith(
    _$MyRidesImpl value,
    $Res Function(_$MyRidesImpl) then,
  ) = __$$MyRidesImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    List<TripSummary> organized,
    List<TripSummary> joined,
    List<TripSummary> requested,
    RideStats stats,
  });

  @override
  $RideStatsCopyWith<$Res> get stats;
}

/// @nodoc
class __$$MyRidesImplCopyWithImpl<$Res>
    extends _$MyRidesCopyWithImpl<$Res, _$MyRidesImpl>
    implements _$$MyRidesImplCopyWith<$Res> {
  __$$MyRidesImplCopyWithImpl(
    _$MyRidesImpl _value,
    $Res Function(_$MyRidesImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of MyRides
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? organized = null,
    Object? joined = null,
    Object? requested = null,
    Object? stats = null,
  }) {
    return _then(
      _$MyRidesImpl(
        organized: null == organized
            ? _value._organized
            : organized // ignore: cast_nullable_to_non_nullable
                  as List<TripSummary>,
        joined: null == joined
            ? _value._joined
            : joined // ignore: cast_nullable_to_non_nullable
                  as List<TripSummary>,
        requested: null == requested
            ? _value._requested
            : requested // ignore: cast_nullable_to_non_nullable
                  as List<TripSummary>,
        stats: null == stats
            ? _value.stats
            : stats // ignore: cast_nullable_to_non_nullable
                  as RideStats,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$MyRidesImpl implements _MyRides {
  const _$MyRidesImpl({
    required final List<TripSummary> organized,
    required final List<TripSummary> joined,
    required final List<TripSummary> requested,
    required this.stats,
  }) : _organized = organized,
       _joined = joined,
       _requested = requested;

  factory _$MyRidesImpl.fromJson(Map<String, dynamic> json) =>
      _$$MyRidesImplFromJson(json);

  final List<TripSummary> _organized;
  @override
  List<TripSummary> get organized {
    if (_organized is EqualUnmodifiableListView) return _organized;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_organized);
  }

  final List<TripSummary> _joined;
  @override
  List<TripSummary> get joined {
    if (_joined is EqualUnmodifiableListView) return _joined;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_joined);
  }

  final List<TripSummary> _requested;
  @override
  List<TripSummary> get requested {
    if (_requested is EqualUnmodifiableListView) return _requested;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_requested);
  }

  @override
  final RideStats stats;

  @override
  String toString() {
    return 'MyRides(organized: $organized, joined: $joined, requested: $requested, stats: $stats)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MyRidesImpl &&
            const DeepCollectionEquality().equals(
              other._organized,
              _organized,
            ) &&
            const DeepCollectionEquality().equals(other._joined, _joined) &&
            const DeepCollectionEquality().equals(
              other._requested,
              _requested,
            ) &&
            (identical(other.stats, stats) || other.stats == stats));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    const DeepCollectionEquality().hash(_organized),
    const DeepCollectionEquality().hash(_joined),
    const DeepCollectionEquality().hash(_requested),
    stats,
  );

  /// Create a copy of MyRides
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MyRidesImplCopyWith<_$MyRidesImpl> get copyWith =>
      __$$MyRidesImplCopyWithImpl<_$MyRidesImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$MyRidesImplToJson(this);
  }
}

abstract class _MyRides implements MyRides {
  const factory _MyRides({
    required final List<TripSummary> organized,
    required final List<TripSummary> joined,
    required final List<TripSummary> requested,
    required final RideStats stats,
  }) = _$MyRidesImpl;

  factory _MyRides.fromJson(Map<String, dynamic> json) = _$MyRidesImpl.fromJson;

  @override
  List<TripSummary> get organized;
  @override
  List<TripSummary> get joined;
  @override
  List<TripSummary> get requested;
  @override
  RideStats get stats;

  /// Create a copy of MyRides
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MyRidesImplCopyWith<_$MyRidesImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
