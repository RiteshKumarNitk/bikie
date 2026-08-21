// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'bike_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

BikeCategoryRef _$BikeCategoryRefFromJson(Map<String, dynamic> json) {
  return _BikeCategoryRef.fromJson(json);
}

/// @nodoc
mixin _$BikeCategoryRef {
  String get name => throw _privateConstructorUsedError;
  String get slug => throw _privateConstructorUsedError;

  /// Serializes this BikeCategoryRef to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of BikeCategoryRef
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $BikeCategoryRefCopyWith<BikeCategoryRef> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BikeCategoryRefCopyWith<$Res> {
  factory $BikeCategoryRefCopyWith(
    BikeCategoryRef value,
    $Res Function(BikeCategoryRef) then,
  ) = _$BikeCategoryRefCopyWithImpl<$Res, BikeCategoryRef>;
  @useResult
  $Res call({String name, String slug});
}

/// @nodoc
class _$BikeCategoryRefCopyWithImpl<$Res, $Val extends BikeCategoryRef>
    implements $BikeCategoryRefCopyWith<$Res> {
  _$BikeCategoryRefCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of BikeCategoryRef
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
abstract class _$$BikeCategoryRefImplCopyWith<$Res>
    implements $BikeCategoryRefCopyWith<$Res> {
  factory _$$BikeCategoryRefImplCopyWith(
    _$BikeCategoryRefImpl value,
    $Res Function(_$BikeCategoryRefImpl) then,
  ) = __$$BikeCategoryRefImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String name, String slug});
}

/// @nodoc
class __$$BikeCategoryRefImplCopyWithImpl<$Res>
    extends _$BikeCategoryRefCopyWithImpl<$Res, _$BikeCategoryRefImpl>
    implements _$$BikeCategoryRefImplCopyWith<$Res> {
  __$$BikeCategoryRefImplCopyWithImpl(
    _$BikeCategoryRefImpl _value,
    $Res Function(_$BikeCategoryRefImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of BikeCategoryRef
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? name = null, Object? slug = null}) {
    return _then(
      _$BikeCategoryRefImpl(
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
class _$BikeCategoryRefImpl implements _BikeCategoryRef {
  const _$BikeCategoryRefImpl({required this.name, required this.slug});

  factory _$BikeCategoryRefImpl.fromJson(Map<String, dynamic> json) =>
      _$$BikeCategoryRefImplFromJson(json);

  @override
  final String name;
  @override
  final String slug;

  @override
  String toString() {
    return 'BikeCategoryRef(name: $name, slug: $slug)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BikeCategoryRefImpl &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.slug, slug) || other.slug == slug));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, name, slug);

  /// Create a copy of BikeCategoryRef
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$BikeCategoryRefImplCopyWith<_$BikeCategoryRefImpl> get copyWith =>
      __$$BikeCategoryRefImplCopyWithImpl<_$BikeCategoryRefImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$BikeCategoryRefImplToJson(this);
  }
}

abstract class _BikeCategoryRef implements BikeCategoryRef {
  const factory _BikeCategoryRef({required String name, required String slug}) =
      _$BikeCategoryRefImpl;

  factory _BikeCategoryRef.fromJson(Map<String, dynamic> json) =
      _$BikeCategoryRefImpl.fromJson;

  @override
  String get name;
  @override
  String get slug;

  /// Create a copy of BikeCategoryRef
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$BikeCategoryRefImplCopyWith<_$BikeCategoryRefImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

BikeDestinationRef _$BikeDestinationRefFromJson(Map<String, dynamic> json) {
  return _BikeDestinationRef.fromJson(json);
}

/// @nodoc
mixin _$BikeDestinationRef {
  String get name => throw _privateConstructorUsedError;
  String get slug => throw _privateConstructorUsedError;

  /// Serializes this BikeDestinationRef to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of BikeDestinationRef
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $BikeDestinationRefCopyWith<BikeDestinationRef> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BikeDestinationRefCopyWith<$Res> {
  factory $BikeDestinationRefCopyWith(
    BikeDestinationRef value,
    $Res Function(BikeDestinationRef) then,
  ) = _$BikeDestinationRefCopyWithImpl<$Res, BikeDestinationRef>;
  @useResult
  $Res call({String name, String slug});
}

/// @nodoc
class _$BikeDestinationRefCopyWithImpl<$Res, $Val extends BikeDestinationRef>
    implements $BikeDestinationRefCopyWith<$Res> {
  _$BikeDestinationRefCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of BikeDestinationRef
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
abstract class _$$BikeDestinationRefImplCopyWith<$Res>
    implements $BikeDestinationRefCopyWith<$Res> {
  factory _$$BikeDestinationRefImplCopyWith(
    _$BikeDestinationRefImpl value,
    $Res Function(_$BikeDestinationRefImpl) then,
  ) = __$$BikeDestinationRefImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String name, String slug});
}

/// @nodoc
class __$$BikeDestinationRefImplCopyWithImpl<$Res>
    extends _$BikeDestinationRefCopyWithImpl<$Res, _$BikeDestinationRefImpl>
    implements _$$BikeDestinationRefImplCopyWith<$Res> {
  __$$BikeDestinationRefImplCopyWithImpl(
    _$BikeDestinationRefImpl _value,
    $Res Function(_$BikeDestinationRefImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of BikeDestinationRef
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? name = null, Object? slug = null}) {
    return _then(
      _$BikeDestinationRefImpl(
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
class _$BikeDestinationRefImpl implements _BikeDestinationRef {
  const _$BikeDestinationRefImpl({required this.name, required this.slug});

  factory _$BikeDestinationRefImpl.fromJson(Map<String, dynamic> json) =>
      _$$BikeDestinationRefImplFromJson(json);

  @override
  final String name;
  @override
  final String slug;

  @override
  String toString() {
    return 'BikeDestinationRef(name: $name, slug: $slug)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BikeDestinationRefImpl &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.slug, slug) || other.slug == slug));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, name, slug);

  /// Create a copy of BikeDestinationRef
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$BikeDestinationRefImplCopyWith<_$BikeDestinationRefImpl> get copyWith =>
      __$$BikeDestinationRefImplCopyWithImpl<_$BikeDestinationRefImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$BikeDestinationRefImplToJson(this);
  }
}

abstract class _BikeDestinationRef implements BikeDestinationRef {
  const factory _BikeDestinationRef({
    required String name,
    required String slug,
  }) = _$BikeDestinationRefImpl;

  factory _BikeDestinationRef.fromJson(Map<String, dynamic> json) =
      _$BikeDestinationRefImpl.fromJson;

  @override
  String get name;
  @override
  String get slug;

  /// Create a copy of BikeDestinationRef
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$BikeDestinationRefImplCopyWith<_$BikeDestinationRefImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

BikeSummary _$BikeSummaryFromJson(Map<String, dynamic> json) {
  return _BikeSummary.fromJson(json);
}

/// @nodoc
mixin _$BikeSummary {
  String get id => throw _privateConstructorUsedError;
  String get slug => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get brand => throw _privateConstructorUsedError;
  BikeCategoryRef get category => throw _privateConstructorUsedError;
  num get pricePerDay => throw _privateConstructorUsedError;
  String get city => throw _privateConstructorUsedError;
  String get imageUrl => throw _privateConstructorUsedError;
  num get ratingAvg => throw _privateConstructorUsedError;
  int get ratingCount => throw _privateConstructorUsedError;
  bool get instantBooking => throw _privateConstructorUsedError;

  /// Serializes this BikeSummary to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of BikeSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $BikeSummaryCopyWith<BikeSummary> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BikeSummaryCopyWith<$Res> {
  factory $BikeSummaryCopyWith(
    BikeSummary value,
    $Res Function(BikeSummary) then,
  ) = _$BikeSummaryCopyWithImpl<$Res, BikeSummary>;
  @useResult
  $Res call({
    String id,
    String slug,
    String name,
    String brand,
    BikeCategoryRef category,
    num pricePerDay,
    String city,
    String imageUrl,
    num ratingAvg,
    int ratingCount,
    bool instantBooking,
  });

  $BikeCategoryRefCopyWith<$Res> get category;
}

/// @nodoc
class _$BikeSummaryCopyWithImpl<$Res, $Val extends BikeSummary>
    implements $BikeSummaryCopyWith<$Res> {
  _$BikeSummaryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of BikeSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? slug = null,
    Object? name = null,
    Object? brand = null,
    Object? category = null,
    Object? pricePerDay = null,
    Object? city = null,
    Object? imageUrl = null,
    Object? ratingAvg = null,
    Object? ratingCount = null,
    Object? instantBooking = null,
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
            name: null == name
                ? _value.name
                : name // ignore: cast_nullable_to_non_nullable
                      as String,
            brand: null == brand
                ? _value.brand
                : brand // ignore: cast_nullable_to_non_nullable
                      as String,
            category: null == category
                ? _value.category
                : category // ignore: cast_nullable_to_non_nullable
                      as BikeCategoryRef,
            pricePerDay: null == pricePerDay
                ? _value.pricePerDay
                : pricePerDay // ignore: cast_nullable_to_non_nullable
                      as num,
            city: null == city
                ? _value.city
                : city // ignore: cast_nullable_to_non_nullable
                      as String,
            imageUrl: null == imageUrl
                ? _value.imageUrl
                : imageUrl // ignore: cast_nullable_to_non_nullable
                      as String,
            ratingAvg: null == ratingAvg
                ? _value.ratingAvg
                : ratingAvg // ignore: cast_nullable_to_non_nullable
                      as num,
            ratingCount: null == ratingCount
                ? _value.ratingCount
                : ratingCount // ignore: cast_nullable_to_non_nullable
                      as int,
            instantBooking: null == instantBooking
                ? _value.instantBooking
                : instantBooking // ignore: cast_nullable_to_non_nullable
                      as bool,
          )
          as $Val,
    );
  }

  /// Create a copy of BikeSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $BikeCategoryRefCopyWith<$Res> get category {
    return $BikeCategoryRefCopyWith<$Res>(_value.category, (value) {
      return _then(_value.copyWith(category: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$BikeSummaryImplCopyWith<$Res>
    implements $BikeSummaryCopyWith<$Res> {
  factory _$$BikeSummaryImplCopyWith(
    _$BikeSummaryImpl value,
    $Res Function(_$BikeSummaryImpl) then,
  ) = __$$BikeSummaryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String slug,
    String name,
    String brand,
    BikeCategoryRef category,
    num pricePerDay,
    String city,
    String imageUrl,
    num ratingAvg,
    int ratingCount,
    bool instantBooking,
  });

  @override
  $BikeCategoryRefCopyWith<$Res> get category;
}

/// @nodoc
class __$$BikeSummaryImplCopyWithImpl<$Res>
    extends _$BikeSummaryCopyWithImpl<$Res, _$BikeSummaryImpl>
    implements _$$BikeSummaryImplCopyWith<$Res> {
  __$$BikeSummaryImplCopyWithImpl(
    _$BikeSummaryImpl _value,
    $Res Function(_$BikeSummaryImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of BikeSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? slug = null,
    Object? name = null,
    Object? brand = null,
    Object? category = null,
    Object? pricePerDay = null,
    Object? city = null,
    Object? imageUrl = null,
    Object? ratingAvg = null,
    Object? ratingCount = null,
    Object? instantBooking = null,
  }) {
    return _then(
      _$BikeSummaryImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        slug: null == slug
            ? _value.slug
            : slug // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        brand: null == brand
            ? _value.brand
            : brand // ignore: cast_nullable_to_non_nullable
                  as String,
        category: null == category
            ? _value.category
            : category // ignore: cast_nullable_to_non_nullable
                  as BikeCategoryRef,
        pricePerDay: null == pricePerDay
            ? _value.pricePerDay
            : pricePerDay // ignore: cast_nullable_to_non_nullable
                  as num,
        city: null == city
            ? _value.city
            : city // ignore: cast_nullable_to_non_nullable
                  as String,
        imageUrl: null == imageUrl
            ? _value.imageUrl
            : imageUrl // ignore: cast_nullable_to_non_nullable
                  as String,
        ratingAvg: null == ratingAvg
            ? _value.ratingAvg
            : ratingAvg // ignore: cast_nullable_to_non_nullable
                  as num,
        ratingCount: null == ratingCount
            ? _value.ratingCount
            : ratingCount // ignore: cast_nullable_to_non_nullable
                  as int,
        instantBooking: null == instantBooking
            ? _value.instantBooking
            : instantBooking // ignore: cast_nullable_to_non_nullable
                  as bool,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$BikeSummaryImpl implements _BikeSummary {
  const _$BikeSummaryImpl({
    required this.id,
    required this.slug,
    required this.name,
    required this.brand,
    required this.category,
    required this.pricePerDay,
    required this.city,
    required this.imageUrl,
    required this.ratingAvg,
    required this.ratingCount,
    required this.instantBooking,
  });

  factory _$BikeSummaryImpl.fromJson(Map<String, dynamic> json) =>
      _$$BikeSummaryImplFromJson(json);

  @override
  final String id;
  @override
  final String slug;
  @override
  final String name;
  @override
  final String brand;
  @override
  final BikeCategoryRef category;
  @override
  final num pricePerDay;
  @override
  final String city;
  @override
  final String imageUrl;
  @override
  final num ratingAvg;
  @override
  final int ratingCount;
  @override
  final bool instantBooking;

  @override
  String toString() {
    return 'BikeSummary(id: $id, slug: $slug, name: $name, brand: $brand, category: $category, pricePerDay: $pricePerDay, city: $city, imageUrl: $imageUrl, ratingAvg: $ratingAvg, ratingCount: $ratingCount, instantBooking: $instantBooking)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BikeSummaryImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.brand, brand) || other.brand == brand) &&
            (identical(other.category, category) ||
                other.category == category) &&
            (identical(other.pricePerDay, pricePerDay) ||
                other.pricePerDay == pricePerDay) &&
            (identical(other.city, city) || other.city == city) &&
            (identical(other.imageUrl, imageUrl) ||
                other.imageUrl == imageUrl) &&
            (identical(other.ratingAvg, ratingAvg) ||
                other.ratingAvg == ratingAvg) &&
            (identical(other.ratingCount, ratingCount) ||
                other.ratingCount == ratingCount) &&
            (identical(other.instantBooking, instantBooking) ||
                other.instantBooking == instantBooking));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    slug,
    name,
    brand,
    category,
    pricePerDay,
    city,
    imageUrl,
    ratingAvg,
    ratingCount,
    instantBooking,
  );

  /// Create a copy of BikeSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$BikeSummaryImplCopyWith<_$BikeSummaryImpl> get copyWith =>
      __$$BikeSummaryImplCopyWithImpl<_$BikeSummaryImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$BikeSummaryImplToJson(this);
  }
}

abstract class _BikeSummary implements BikeSummary {
  const factory _BikeSummary({
    required String id,
    required String slug,
    required String name,
    required String brand,
    required BikeCategoryRef category,
    required num pricePerDay,
    required String city,
    required String imageUrl,
    required num ratingAvg,
    required int ratingCount,
    required bool instantBooking,
  }) = _$BikeSummaryImpl;

  factory _BikeSummary.fromJson(Map<String, dynamic> json) =
      _$BikeSummaryImpl.fromJson;

  @override
  String get id;
  @override
  String get slug;
  @override
  String get name;
  @override
  String get brand;
  @override
  BikeCategoryRef get category;
  @override
  num get pricePerDay;
  @override
  String get city;
  @override
  String get imageUrl;
  @override
  num get ratingAvg;
  @override
  int get ratingCount;
  @override
  bool get instantBooking;

  /// Create a copy of BikeSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$BikeSummaryImplCopyWith<_$BikeSummaryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

BikeDetail _$BikeDetailFromJson(Map<String, dynamic> json) {
  return _BikeDetail.fromJson(json);
}

/// @nodoc
mixin _$BikeDetail {
  String get id => throw _privateConstructorUsedError;
  String get slug => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get brand => throw _privateConstructorUsedError;
  BikeCategoryRef get category => throw _privateConstructorUsedError;
  num get pricePerDay => throw _privateConstructorUsedError;
  String get city => throw _privateConstructorUsedError;
  String get imageUrl => throw _privateConstructorUsedError;
  num get ratingAvg => throw _privateConstructorUsedError;
  int get ratingCount => throw _privateConstructorUsedError;
  bool get instantBooking => throw _privateConstructorUsedError;
  List<String> get gallery => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  num get securityDeposit => throw _privateConstructorUsedError;
  int? get engineCc => throw _privateConstructorUsedError;
  num? get mileageKmpl => throw _privateConstructorUsedError;
  num? get fuelTankLitres => throw _privateConstructorUsedError;
  bool get hasAbs => throw _privateConstructorUsedError;
  int? get seatHeightMm => throw _privateConstructorUsedError;
  int? get luggageCapacityL => throw _privateConstructorUsedError;
  bool get helmetIncluded => throw _privateConstructorUsedError;
  bool get deliveryAvailable => throw _privateConstructorUsedError;
  BikeDestinationRef? get destination => throw _privateConstructorUsedError;

  /// Serializes this BikeDetail to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of BikeDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $BikeDetailCopyWith<BikeDetail> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BikeDetailCopyWith<$Res> {
  factory $BikeDetailCopyWith(
    BikeDetail value,
    $Res Function(BikeDetail) then,
  ) = _$BikeDetailCopyWithImpl<$Res, BikeDetail>;
  @useResult
  $Res call({
    String id,
    String slug,
    String name,
    String brand,
    BikeCategoryRef category,
    num pricePerDay,
    String city,
    String imageUrl,
    num ratingAvg,
    int ratingCount,
    bool instantBooking,
    List<String> gallery,
    String? description,
    num securityDeposit,
    int? engineCc,
    num? mileageKmpl,
    num? fuelTankLitres,
    bool hasAbs,
    int? seatHeightMm,
    int? luggageCapacityL,
    bool helmetIncluded,
    bool deliveryAvailable,
    BikeDestinationRef? destination,
  });

  $BikeCategoryRefCopyWith<$Res> get category;
  $BikeDestinationRefCopyWith<$Res>? get destination;
}

/// @nodoc
class _$BikeDetailCopyWithImpl<$Res, $Val extends BikeDetail>
    implements $BikeDetailCopyWith<$Res> {
  _$BikeDetailCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of BikeDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? slug = null,
    Object? name = null,
    Object? brand = null,
    Object? category = null,
    Object? pricePerDay = null,
    Object? city = null,
    Object? imageUrl = null,
    Object? ratingAvg = null,
    Object? ratingCount = null,
    Object? instantBooking = null,
    Object? gallery = null,
    Object? description = freezed,
    Object? securityDeposit = null,
    Object? engineCc = freezed,
    Object? mileageKmpl = freezed,
    Object? fuelTankLitres = freezed,
    Object? hasAbs = null,
    Object? seatHeightMm = freezed,
    Object? luggageCapacityL = freezed,
    Object? helmetIncluded = null,
    Object? deliveryAvailable = null,
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
            name: null == name
                ? _value.name
                : name // ignore: cast_nullable_to_non_nullable
                      as String,
            brand: null == brand
                ? _value.brand
                : brand // ignore: cast_nullable_to_non_nullable
                      as String,
            category: null == category
                ? _value.category
                : category // ignore: cast_nullable_to_non_nullable
                      as BikeCategoryRef,
            pricePerDay: null == pricePerDay
                ? _value.pricePerDay
                : pricePerDay // ignore: cast_nullable_to_non_nullable
                      as num,
            city: null == city
                ? _value.city
                : city // ignore: cast_nullable_to_non_nullable
                      as String,
            imageUrl: null == imageUrl
                ? _value.imageUrl
                : imageUrl // ignore: cast_nullable_to_non_nullable
                      as String,
            ratingAvg: null == ratingAvg
                ? _value.ratingAvg
                : ratingAvg // ignore: cast_nullable_to_non_nullable
                      as num,
            ratingCount: null == ratingCount
                ? _value.ratingCount
                : ratingCount // ignore: cast_nullable_to_non_nullable
                      as int,
            instantBooking: null == instantBooking
                ? _value.instantBooking
                : instantBooking // ignore: cast_nullable_to_non_nullable
                      as bool,
            gallery: null == gallery
                ? _value.gallery
                : gallery // ignore: cast_nullable_to_non_nullable
                      as List<String>,
            description: freezed == description
                ? _value.description
                : description // ignore: cast_nullable_to_non_nullable
                      as String?,
            securityDeposit: null == securityDeposit
                ? _value.securityDeposit
                : securityDeposit // ignore: cast_nullable_to_non_nullable
                      as num,
            engineCc: freezed == engineCc
                ? _value.engineCc
                : engineCc // ignore: cast_nullable_to_non_nullable
                      as int?,
            mileageKmpl: freezed == mileageKmpl
                ? _value.mileageKmpl
                : mileageKmpl // ignore: cast_nullable_to_non_nullable
                      as num?,
            fuelTankLitres: freezed == fuelTankLitres
                ? _value.fuelTankLitres
                : fuelTankLitres // ignore: cast_nullable_to_non_nullable
                      as num?,
            hasAbs: null == hasAbs
                ? _value.hasAbs
                : hasAbs // ignore: cast_nullable_to_non_nullable
                      as bool,
            seatHeightMm: freezed == seatHeightMm
                ? _value.seatHeightMm
                : seatHeightMm // ignore: cast_nullable_to_non_nullable
                      as int?,
            luggageCapacityL: freezed == luggageCapacityL
                ? _value.luggageCapacityL
                : luggageCapacityL // ignore: cast_nullable_to_non_nullable
                      as int?,
            helmetIncluded: null == helmetIncluded
                ? _value.helmetIncluded
                : helmetIncluded // ignore: cast_nullable_to_non_nullable
                      as bool,
            deliveryAvailable: null == deliveryAvailable
                ? _value.deliveryAvailable
                : deliveryAvailable // ignore: cast_nullable_to_non_nullable
                      as bool,
            destination: freezed == destination
                ? _value.destination
                : destination // ignore: cast_nullable_to_non_nullable
                      as BikeDestinationRef?,
          )
          as $Val,
    );
  }

  /// Create a copy of BikeDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $BikeCategoryRefCopyWith<$Res> get category {
    return $BikeCategoryRefCopyWith<$Res>(_value.category, (value) {
      return _then(_value.copyWith(category: value) as $Val);
    });
  }

  /// Create a copy of BikeDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $BikeDestinationRefCopyWith<$Res>? get destination {
    if (_value.destination == null) {
      return null;
    }

    return $BikeDestinationRefCopyWith<$Res>(_value.destination!, (value) {
      return _then(_value.copyWith(destination: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$BikeDetailImplCopyWith<$Res>
    implements $BikeDetailCopyWith<$Res> {
  factory _$$BikeDetailImplCopyWith(
    _$BikeDetailImpl value,
    $Res Function(_$BikeDetailImpl) then,
  ) = __$$BikeDetailImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String slug,
    String name,
    String brand,
    BikeCategoryRef category,
    num pricePerDay,
    String city,
    String imageUrl,
    num ratingAvg,
    int ratingCount,
    bool instantBooking,
    List<String> gallery,
    String? description,
    num securityDeposit,
    int? engineCc,
    num? mileageKmpl,
    num? fuelTankLitres,
    bool hasAbs,
    int? seatHeightMm,
    int? luggageCapacityL,
    bool helmetIncluded,
    bool deliveryAvailable,
    BikeDestinationRef? destination,
  });

  @override
  $BikeCategoryRefCopyWith<$Res> get category;
  @override
  $BikeDestinationRefCopyWith<$Res>? get destination;
}

/// @nodoc
class __$$BikeDetailImplCopyWithImpl<$Res>
    extends _$BikeDetailCopyWithImpl<$Res, _$BikeDetailImpl>
    implements _$$BikeDetailImplCopyWith<$Res> {
  __$$BikeDetailImplCopyWithImpl(
    _$BikeDetailImpl _value,
    $Res Function(_$BikeDetailImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of BikeDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? slug = null,
    Object? name = null,
    Object? brand = null,
    Object? category = null,
    Object? pricePerDay = null,
    Object? city = null,
    Object? imageUrl = null,
    Object? ratingAvg = null,
    Object? ratingCount = null,
    Object? instantBooking = null,
    Object? gallery = null,
    Object? description = freezed,
    Object? securityDeposit = null,
    Object? engineCc = freezed,
    Object? mileageKmpl = freezed,
    Object? fuelTankLitres = freezed,
    Object? hasAbs = null,
    Object? seatHeightMm = freezed,
    Object? luggageCapacityL = freezed,
    Object? helmetIncluded = null,
    Object? deliveryAvailable = null,
    Object? destination = freezed,
  }) {
    return _then(
      _$BikeDetailImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        slug: null == slug
            ? _value.slug
            : slug // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        brand: null == brand
            ? _value.brand
            : brand // ignore: cast_nullable_to_non_nullable
                  as String,
        category: null == category
            ? _value.category
            : category // ignore: cast_nullable_to_non_nullable
                  as BikeCategoryRef,
        pricePerDay: null == pricePerDay
            ? _value.pricePerDay
            : pricePerDay // ignore: cast_nullable_to_non_nullable
                  as num,
        city: null == city
            ? _value.city
            : city // ignore: cast_nullable_to_non_nullable
                  as String,
        imageUrl: null == imageUrl
            ? _value.imageUrl
            : imageUrl // ignore: cast_nullable_to_non_nullable
                  as String,
        ratingAvg: null == ratingAvg
            ? _value.ratingAvg
            : ratingAvg // ignore: cast_nullable_to_non_nullable
                  as num,
        ratingCount: null == ratingCount
            ? _value.ratingCount
            : ratingCount // ignore: cast_nullable_to_non_nullable
                  as int,
        instantBooking: null == instantBooking
            ? _value.instantBooking
            : instantBooking // ignore: cast_nullable_to_non_nullable
                  as bool,
        gallery: null == gallery
            ? _value._gallery
            : gallery // ignore: cast_nullable_to_non_nullable
                  as List<String>,
        description: freezed == description
            ? _value.description
            : description // ignore: cast_nullable_to_non_nullable
                  as String?,
        securityDeposit: null == securityDeposit
            ? _value.securityDeposit
            : securityDeposit // ignore: cast_nullable_to_non_nullable
                  as num,
        engineCc: freezed == engineCc
            ? _value.engineCc
            : engineCc // ignore: cast_nullable_to_non_nullable
                  as int?,
        mileageKmpl: freezed == mileageKmpl
            ? _value.mileageKmpl
            : mileageKmpl // ignore: cast_nullable_to_non_nullable
                  as num?,
        fuelTankLitres: freezed == fuelTankLitres
            ? _value.fuelTankLitres
            : fuelTankLitres // ignore: cast_nullable_to_non_nullable
                  as num?,
        hasAbs: null == hasAbs
            ? _value.hasAbs
            : hasAbs // ignore: cast_nullable_to_non_nullable
                  as bool,
        seatHeightMm: freezed == seatHeightMm
            ? _value.seatHeightMm
            : seatHeightMm // ignore: cast_nullable_to_non_nullable
                  as int?,
        luggageCapacityL: freezed == luggageCapacityL
            ? _value.luggageCapacityL
            : luggageCapacityL // ignore: cast_nullable_to_non_nullable
                  as int?,
        helmetIncluded: null == helmetIncluded
            ? _value.helmetIncluded
            : helmetIncluded // ignore: cast_nullable_to_non_nullable
                  as bool,
        deliveryAvailable: null == deliveryAvailable
            ? _value.deliveryAvailable
            : deliveryAvailable // ignore: cast_nullable_to_non_nullable
                  as bool,
        destination: freezed == destination
            ? _value.destination
            : destination // ignore: cast_nullable_to_non_nullable
                  as BikeDestinationRef?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$BikeDetailImpl implements _BikeDetail {
  const _$BikeDetailImpl({
    required this.id,
    required this.slug,
    required this.name,
    required this.brand,
    required this.category,
    required this.pricePerDay,
    required this.city,
    required this.imageUrl,
    required this.ratingAvg,
    required this.ratingCount,
    required this.instantBooking,
    required List<String> gallery,
    this.description,
    required this.securityDeposit,
    this.engineCc,
    this.mileageKmpl,
    this.fuelTankLitres,
    required this.hasAbs,
    this.seatHeightMm,
    this.luggageCapacityL,
    required this.helmetIncluded,
    required this.deliveryAvailable,
    this.destination,
  }) : _gallery = gallery;

  factory _$BikeDetailImpl.fromJson(Map<String, dynamic> json) =>
      _$$BikeDetailImplFromJson(json);

  @override
  final String id;
  @override
  final String slug;
  @override
  final String name;
  @override
  final String brand;
  @override
  final BikeCategoryRef category;
  @override
  final num pricePerDay;
  @override
  final String city;
  @override
  final String imageUrl;
  @override
  final num ratingAvg;
  @override
  final int ratingCount;
  @override
  final bool instantBooking;
  final List<String> _gallery;
  @override
  List<String> get gallery {
    if (_gallery is EqualUnmodifiableListView) return _gallery;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_gallery);
  }

  @override
  final String? description;
  @override
  final num securityDeposit;
  @override
  final int? engineCc;
  @override
  final num? mileageKmpl;
  @override
  final num? fuelTankLitres;
  @override
  final bool hasAbs;
  @override
  final int? seatHeightMm;
  @override
  final int? luggageCapacityL;
  @override
  final bool helmetIncluded;
  @override
  final bool deliveryAvailable;
  @override
  final BikeDestinationRef? destination;

  @override
  String toString() {
    return 'BikeDetail(id: $id, slug: $slug, name: $name, brand: $brand, category: $category, pricePerDay: $pricePerDay, city: $city, imageUrl: $imageUrl, ratingAvg: $ratingAvg, ratingCount: $ratingCount, instantBooking: $instantBooking, gallery: $gallery, description: $description, securityDeposit: $securityDeposit, engineCc: $engineCc, mileageKmpl: $mileageKmpl, fuelTankLitres: $fuelTankLitres, hasAbs: $hasAbs, seatHeightMm: $seatHeightMm, luggageCapacityL: $luggageCapacityL, helmetIncluded: $helmetIncluded, deliveryAvailable: $deliveryAvailable, destination: $destination)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BikeDetailImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.brand, brand) || other.brand == brand) &&
            (identical(other.category, category) ||
                other.category == category) &&
            (identical(other.pricePerDay, pricePerDay) ||
                other.pricePerDay == pricePerDay) &&
            (identical(other.city, city) || other.city == city) &&
            (identical(other.imageUrl, imageUrl) ||
                other.imageUrl == imageUrl) &&
            (identical(other.ratingAvg, ratingAvg) ||
                other.ratingAvg == ratingAvg) &&
            (identical(other.ratingCount, ratingCount) ||
                other.ratingCount == ratingCount) &&
            (identical(other.instantBooking, instantBooking) ||
                other.instantBooking == instantBooking) &&
            const DeepCollectionEquality().equals(other._gallery, _gallery) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.securityDeposit, securityDeposit) ||
                other.securityDeposit == securityDeposit) &&
            (identical(other.engineCc, engineCc) ||
                other.engineCc == engineCc) &&
            (identical(other.mileageKmpl, mileageKmpl) ||
                other.mileageKmpl == mileageKmpl) &&
            (identical(other.fuelTankLitres, fuelTankLitres) ||
                other.fuelTankLitres == fuelTankLitres) &&
            (identical(other.hasAbs, hasAbs) || other.hasAbs == hasAbs) &&
            (identical(other.seatHeightMm, seatHeightMm) ||
                other.seatHeightMm == seatHeightMm) &&
            (identical(other.luggageCapacityL, luggageCapacityL) ||
                other.luggageCapacityL == luggageCapacityL) &&
            (identical(other.helmetIncluded, helmetIncluded) ||
                other.helmetIncluded == helmetIncluded) &&
            (identical(other.deliveryAvailable, deliveryAvailable) ||
                other.deliveryAvailable == deliveryAvailable) &&
            (identical(other.destination, destination) ||
                other.destination == destination));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hashAll([
    runtimeType,
    id,
    slug,
    name,
    brand,
    category,
    pricePerDay,
    city,
    imageUrl,
    ratingAvg,
    ratingCount,
    instantBooking,
    const DeepCollectionEquality().hash(_gallery),
    description,
    securityDeposit,
    engineCc,
    mileageKmpl,
    fuelTankLitres,
    hasAbs,
    seatHeightMm,
    luggageCapacityL,
    helmetIncluded,
    deliveryAvailable,
    destination,
  ]);

  /// Create a copy of BikeDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$BikeDetailImplCopyWith<_$BikeDetailImpl> get copyWith =>
      __$$BikeDetailImplCopyWithImpl<_$BikeDetailImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$BikeDetailImplToJson(this);
  }
}

abstract class _BikeDetail implements BikeDetail {
  const factory _BikeDetail({
    required String id,
    required String slug,
    required String name,
    required String brand,
    required BikeCategoryRef category,
    required num pricePerDay,
    required String city,
    required String imageUrl,
    required num ratingAvg,
    required int ratingCount,
    required bool instantBooking,
    required List<String> gallery,
    String? description,
    required num securityDeposit,
    int? engineCc,
    num? mileageKmpl,
    num? fuelTankLitres,
    required bool hasAbs,
    int? seatHeightMm,
    int? luggageCapacityL,
    required bool helmetIncluded,
    required bool deliveryAvailable,
    BikeDestinationRef? destination,
  }) = _$BikeDetailImpl;

  factory _BikeDetail.fromJson(Map<String, dynamic> json) =
      _$BikeDetailImpl.fromJson;

  @override
  String get id;
  @override
  String get slug;
  @override
  String get name;
  @override
  String get brand;
  @override
  BikeCategoryRef get category;
  @override
  num get pricePerDay;
  @override
  String get city;
  @override
  String get imageUrl;
  @override
  num get ratingAvg;
  @override
  int get ratingCount;
  @override
  bool get instantBooking;
  @override
  List<String> get gallery;
  @override
  String? get description;
  @override
  num get securityDeposit;
  @override
  int? get engineCc;
  @override
  num? get mileageKmpl;
  @override
  num? get fuelTankLitres;
  @override
  bool get hasAbs;
  @override
  int? get seatHeightMm;
  @override
  int? get luggageCapacityL;
  @override
  bool get helmetIncluded;
  @override
  bool get deliveryAvailable;
  @override
  BikeDestinationRef? get destination;

  /// Create a copy of BikeDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$BikeDetailImplCopyWith<_$BikeDetailImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

BikeSearchResult _$BikeSearchResultFromJson(Map<String, dynamic> json) {
  return _BikeSearchResult.fromJson(json);
}

/// @nodoc
mixin _$BikeSearchResult {
  List<BikeSummary> get bikes => throw _privateConstructorUsedError;
  int get total => throw _privateConstructorUsedError;
  int get page => throw _privateConstructorUsedError;
  int get pageSize => throw _privateConstructorUsedError;

  /// Serializes this BikeSearchResult to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of BikeSearchResult
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $BikeSearchResultCopyWith<BikeSearchResult> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BikeSearchResultCopyWith<$Res> {
  factory $BikeSearchResultCopyWith(
    BikeSearchResult value,
    $Res Function(BikeSearchResult) then,
  ) = _$BikeSearchResultCopyWithImpl<$Res, BikeSearchResult>;
  @useResult
  $Res call({List<BikeSummary> bikes, int total, int page, int pageSize});
}

/// @nodoc
class _$BikeSearchResultCopyWithImpl<$Res, $Val extends BikeSearchResult>
    implements $BikeSearchResultCopyWith<$Res> {
  _$BikeSearchResultCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of BikeSearchResult
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? bikes = null,
    Object? total = null,
    Object? page = null,
    Object? pageSize = null,
  }) {
    return _then(
      _value.copyWith(
            bikes: null == bikes
                ? _value.bikes
                : bikes // ignore: cast_nullable_to_non_nullable
                      as List<BikeSummary>,
            total: null == total
                ? _value.total
                : total // ignore: cast_nullable_to_non_nullable
                      as int,
            page: null == page
                ? _value.page
                : page // ignore: cast_nullable_to_non_nullable
                      as int,
            pageSize: null == pageSize
                ? _value.pageSize
                : pageSize // ignore: cast_nullable_to_non_nullable
                      as int,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$BikeSearchResultImplCopyWith<$Res>
    implements $BikeSearchResultCopyWith<$Res> {
  factory _$$BikeSearchResultImplCopyWith(
    _$BikeSearchResultImpl value,
    $Res Function(_$BikeSearchResultImpl) then,
  ) = __$$BikeSearchResultImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({List<BikeSummary> bikes, int total, int page, int pageSize});
}

/// @nodoc
class __$$BikeSearchResultImplCopyWithImpl<$Res>
    extends _$BikeSearchResultCopyWithImpl<$Res, _$BikeSearchResultImpl>
    implements _$$BikeSearchResultImplCopyWith<$Res> {
  __$$BikeSearchResultImplCopyWithImpl(
    _$BikeSearchResultImpl _value,
    $Res Function(_$BikeSearchResultImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of BikeSearchResult
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? bikes = null,
    Object? total = null,
    Object? page = null,
    Object? pageSize = null,
  }) {
    return _then(
      _$BikeSearchResultImpl(
        bikes: null == bikes
            ? _value._bikes
            : bikes // ignore: cast_nullable_to_non_nullable
                  as List<BikeSummary>,
        total: null == total
            ? _value.total
            : total // ignore: cast_nullable_to_non_nullable
                  as int,
        page: null == page
            ? _value.page
            : page // ignore: cast_nullable_to_non_nullable
                  as int,
        pageSize: null == pageSize
            ? _value.pageSize
            : pageSize // ignore: cast_nullable_to_non_nullable
                  as int,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$BikeSearchResultImpl implements _BikeSearchResult {
  const _$BikeSearchResultImpl({
    required List<BikeSummary> bikes,
    required this.total,
    required this.page,
    required this.pageSize,
  }) : _bikes = bikes;

  factory _$BikeSearchResultImpl.fromJson(Map<String, dynamic> json) =>
      _$$BikeSearchResultImplFromJson(json);

  final List<BikeSummary> _bikes;
  @override
  List<BikeSummary> get bikes {
    if (_bikes is EqualUnmodifiableListView) return _bikes;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_bikes);
  }

  @override
  final int total;
  @override
  final int page;
  @override
  final int pageSize;

  @override
  String toString() {
    return 'BikeSearchResult(bikes: $bikes, total: $total, page: $page, pageSize: $pageSize)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BikeSearchResultImpl &&
            const DeepCollectionEquality().equals(other._bikes, _bikes) &&
            (identical(other.total, total) || other.total == total) &&
            (identical(other.page, page) || other.page == page) &&
            (identical(other.pageSize, pageSize) ||
                other.pageSize == pageSize));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    const DeepCollectionEquality().hash(_bikes),
    total,
    page,
    pageSize,
  );

  /// Create a copy of BikeSearchResult
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$BikeSearchResultImplCopyWith<_$BikeSearchResultImpl> get copyWith =>
      __$$BikeSearchResultImplCopyWithImpl<_$BikeSearchResultImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$BikeSearchResultImplToJson(this);
  }
}

abstract class _BikeSearchResult implements BikeSearchResult {
  const factory _BikeSearchResult({
    required List<BikeSummary> bikes,
    required int total,
    required int page,
    required int pageSize,
  }) = _$BikeSearchResultImpl;

  factory _BikeSearchResult.fromJson(Map<String, dynamic> json) =
      _$BikeSearchResultImpl.fromJson;

  @override
  List<BikeSummary> get bikes;
  @override
  int get total;
  @override
  int get page;
  @override
  int get pageSize;

  /// Create a copy of BikeSearchResult
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$BikeSearchResultImplCopyWith<_$BikeSearchResultImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
