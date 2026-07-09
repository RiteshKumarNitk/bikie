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
  $Res call({String name, String? image});
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
  $Res call({Object? name = null, Object? image = freezed}) {
    return _then(
      _value.copyWith(
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
  $Res call({String name, String? image});
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
  $Res call({Object? name = null, Object? image = freezed}) {
    return _then(
      _$TripOrganizerImpl(
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
  const _$TripOrganizerImpl({required this.name, this.image});

  factory _$TripOrganizerImpl.fromJson(Map<String, dynamic> json) =>
      _$$TripOrganizerImplFromJson(json);

  @override
  final String name;
  @override
  final String? image;

  @override
  String toString() {
    return 'TripOrganizer(name: $name, image: $image)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TripOrganizerImpl &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.image, image) || other.image == image));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, name, image);

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
    required final String name,
    final String? image,
  }) = _$TripOrganizerImpl;

  factory _TripOrganizer.fromJson(Map<String, dynamic> json) =
      _$TripOrganizerImpl.fromJson;

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
  String toString() {
    return 'TripSummary(id: $id, slug: $slug, title: $title, imageUrl: $imageUrl, type: $type, difficulty: $difficulty, price: $price, seatsTotal: $seatsTotal, seatsLeft: $seatsLeft, startDate: $startDate, endDate: $endDate, status: $status, destination: $destination)';
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
                other.destination == destination));
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
  TripOrganizer get organizer => throw _privateConstructorUsedError;

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
    TripOrganizer organizer,
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
    Object? organizer = null,
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
            organizer: null == organizer
                ? _value.organizer
                : organizer // ignore: cast_nullable_to_non_nullable
                      as TripOrganizer,
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
    TripOrganizer organizer,
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
    Object? organizer = null,
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
        organizer: null == organizer
            ? _value.organizer
            : organizer // ignore: cast_nullable_to_non_nullable
                  as TripOrganizer,
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
    required this.organizer,
  }) : _gallery = gallery;

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
  final TripOrganizer organizer;

  @override
  String toString() {
    return 'TripDetail(id: $id, slug: $slug, title: $title, imageUrl: $imageUrl, type: $type, difficulty: $difficulty, price: $price, seatsTotal: $seatsTotal, seatsLeft: $seatsLeft, startDate: $startDate, endDate: $endDate, status: $status, destination: $destination, description: $description, gallery: $gallery, organizer: $organizer)';
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
            (identical(other.organizer, organizer) ||
                other.organizer == organizer));
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
    organizer,
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
    required final TripOrganizer organizer,
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
  TripOrganizer get organizer;

  /// Create a copy of TripDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TripDetailImplCopyWith<_$TripDetailImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
