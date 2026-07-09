// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'booking_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

BookingBikeRef _$BookingBikeRefFromJson(Map<String, dynamic> json) {
  return _BookingBikeRef.fromJson(json);
}

/// @nodoc
mixin _$BookingBikeRef {
  String get slug => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get imageUrl => throw _privateConstructorUsedError;
  String get brand => throw _privateConstructorUsedError;

  /// Serializes this BookingBikeRef to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of BookingBikeRef
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $BookingBikeRefCopyWith<BookingBikeRef> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BookingBikeRefCopyWith<$Res> {
  factory $BookingBikeRefCopyWith(
    BookingBikeRef value,
    $Res Function(BookingBikeRef) then,
  ) = _$BookingBikeRefCopyWithImpl<$Res, BookingBikeRef>;
  @useResult
  $Res call({String slug, String name, String imageUrl, String brand});
}

/// @nodoc
class _$BookingBikeRefCopyWithImpl<$Res, $Val extends BookingBikeRef>
    implements $BookingBikeRefCopyWith<$Res> {
  _$BookingBikeRefCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of BookingBikeRef
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
    Object? name = null,
    Object? imageUrl = null,
    Object? brand = null,
  }) {
    return _then(
      _value.copyWith(
            slug: null == slug
                ? _value.slug
                : slug // ignore: cast_nullable_to_non_nullable
                      as String,
            name: null == name
                ? _value.name
                : name // ignore: cast_nullable_to_non_nullable
                      as String,
            imageUrl: null == imageUrl
                ? _value.imageUrl
                : imageUrl // ignore: cast_nullable_to_non_nullable
                      as String,
            brand: null == brand
                ? _value.brand
                : brand // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$BookingBikeRefImplCopyWith<$Res>
    implements $BookingBikeRefCopyWith<$Res> {
  factory _$$BookingBikeRefImplCopyWith(
    _$BookingBikeRefImpl value,
    $Res Function(_$BookingBikeRefImpl) then,
  ) = __$$BookingBikeRefImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String slug, String name, String imageUrl, String brand});
}

/// @nodoc
class __$$BookingBikeRefImplCopyWithImpl<$Res>
    extends _$BookingBikeRefCopyWithImpl<$Res, _$BookingBikeRefImpl>
    implements _$$BookingBikeRefImplCopyWith<$Res> {
  __$$BookingBikeRefImplCopyWithImpl(
    _$BookingBikeRefImpl _value,
    $Res Function(_$BookingBikeRefImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of BookingBikeRef
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? slug = null,
    Object? name = null,
    Object? imageUrl = null,
    Object? brand = null,
  }) {
    return _then(
      _$BookingBikeRefImpl(
        slug: null == slug
            ? _value.slug
            : slug // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        imageUrl: null == imageUrl
            ? _value.imageUrl
            : imageUrl // ignore: cast_nullable_to_non_nullable
                  as String,
        brand: null == brand
            ? _value.brand
            : brand // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$BookingBikeRefImpl implements _BookingBikeRef {
  const _$BookingBikeRefImpl({
    required this.slug,
    required this.name,
    required this.imageUrl,
    required this.brand,
  });

  factory _$BookingBikeRefImpl.fromJson(Map<String, dynamic> json) =>
      _$$BookingBikeRefImplFromJson(json);

  @override
  final String slug;
  @override
  final String name;
  @override
  final String imageUrl;
  @override
  final String brand;

  @override
  String toString() {
    return 'BookingBikeRef(slug: $slug, name: $name, imageUrl: $imageUrl, brand: $brand)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BookingBikeRefImpl &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.imageUrl, imageUrl) ||
                other.imageUrl == imageUrl) &&
            (identical(other.brand, brand) || other.brand == brand));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, slug, name, imageUrl, brand);

  /// Create a copy of BookingBikeRef
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$BookingBikeRefImplCopyWith<_$BookingBikeRefImpl> get copyWith =>
      __$$BookingBikeRefImplCopyWithImpl<_$BookingBikeRefImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$BookingBikeRefImplToJson(this);
  }
}

abstract class _BookingBikeRef implements BookingBikeRef {
  const factory _BookingBikeRef({
    required final String slug,
    required final String name,
    required final String imageUrl,
    required final String brand,
  }) = _$BookingBikeRefImpl;

  factory _BookingBikeRef.fromJson(Map<String, dynamic> json) =
      _$BookingBikeRefImpl.fromJson;

  @override
  String get slug;
  @override
  String get name;
  @override
  String get imageUrl;
  @override
  String get brand;

  /// Create a copy of BookingBikeRef
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$BookingBikeRefImplCopyWith<_$BookingBikeRefImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

BookingModel _$BookingModelFromJson(Map<String, dynamic> json) {
  return _BookingModel.fromJson(json);
}

/// @nodoc
mixin _$BookingModel {
  String get id => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String get startDate => throw _privateConstructorUsedError;
  String get endDate => throw _privateConstructorUsedError;
  num get totalPrice => throw _privateConstructorUsedError;
  String get pickupCity => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;
  BookingBikeRef get bike => throw _privateConstructorUsedError;
  bool get hasReview => throw _privateConstructorUsedError;

  /// Serializes this BookingModel to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of BookingModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $BookingModelCopyWith<BookingModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BookingModelCopyWith<$Res> {
  factory $BookingModelCopyWith(
    BookingModel value,
    $Res Function(BookingModel) then,
  ) = _$BookingModelCopyWithImpl<$Res, BookingModel>;
  @useResult
  $Res call({
    String id,
    String status,
    String startDate,
    String endDate,
    num totalPrice,
    String pickupCity,
    String createdAt,
    BookingBikeRef bike,
    bool hasReview,
  });

  $BookingBikeRefCopyWith<$Res> get bike;
}

/// @nodoc
class _$BookingModelCopyWithImpl<$Res, $Val extends BookingModel>
    implements $BookingModelCopyWith<$Res> {
  _$BookingModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of BookingModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? status = null,
    Object? startDate = null,
    Object? endDate = null,
    Object? totalPrice = null,
    Object? pickupCity = null,
    Object? createdAt = null,
    Object? bike = null,
    Object? hasReview = null,
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
            startDate: null == startDate
                ? _value.startDate
                : startDate // ignore: cast_nullable_to_non_nullable
                      as String,
            endDate: null == endDate
                ? _value.endDate
                : endDate // ignore: cast_nullable_to_non_nullable
                      as String,
            totalPrice: null == totalPrice
                ? _value.totalPrice
                : totalPrice // ignore: cast_nullable_to_non_nullable
                      as num,
            pickupCity: null == pickupCity
                ? _value.pickupCity
                : pickupCity // ignore: cast_nullable_to_non_nullable
                      as String,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as String,
            bike: null == bike
                ? _value.bike
                : bike // ignore: cast_nullable_to_non_nullable
                      as BookingBikeRef,
            hasReview: null == hasReview
                ? _value.hasReview
                : hasReview // ignore: cast_nullable_to_non_nullable
                      as bool,
          )
          as $Val,
    );
  }

  /// Create a copy of BookingModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $BookingBikeRefCopyWith<$Res> get bike {
    return $BookingBikeRefCopyWith<$Res>(_value.bike, (value) {
      return _then(_value.copyWith(bike: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$BookingModelImplCopyWith<$Res>
    implements $BookingModelCopyWith<$Res> {
  factory _$$BookingModelImplCopyWith(
    _$BookingModelImpl value,
    $Res Function(_$BookingModelImpl) then,
  ) = __$$BookingModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String status,
    String startDate,
    String endDate,
    num totalPrice,
    String pickupCity,
    String createdAt,
    BookingBikeRef bike,
    bool hasReview,
  });

  @override
  $BookingBikeRefCopyWith<$Res> get bike;
}

/// @nodoc
class __$$BookingModelImplCopyWithImpl<$Res>
    extends _$BookingModelCopyWithImpl<$Res, _$BookingModelImpl>
    implements _$$BookingModelImplCopyWith<$Res> {
  __$$BookingModelImplCopyWithImpl(
    _$BookingModelImpl _value,
    $Res Function(_$BookingModelImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of BookingModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? status = null,
    Object? startDate = null,
    Object? endDate = null,
    Object? totalPrice = null,
    Object? pickupCity = null,
    Object? createdAt = null,
    Object? bike = null,
    Object? hasReview = null,
  }) {
    return _then(
      _$BookingModelImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
        startDate: null == startDate
            ? _value.startDate
            : startDate // ignore: cast_nullable_to_non_nullable
                  as String,
        endDate: null == endDate
            ? _value.endDate
            : endDate // ignore: cast_nullable_to_non_nullable
                  as String,
        totalPrice: null == totalPrice
            ? _value.totalPrice
            : totalPrice // ignore: cast_nullable_to_non_nullable
                  as num,
        pickupCity: null == pickupCity
            ? _value.pickupCity
            : pickupCity // ignore: cast_nullable_to_non_nullable
                  as String,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as String,
        bike: null == bike
            ? _value.bike
            : bike // ignore: cast_nullable_to_non_nullable
                  as BookingBikeRef,
        hasReview: null == hasReview
            ? _value.hasReview
            : hasReview // ignore: cast_nullable_to_non_nullable
                  as bool,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$BookingModelImpl implements _BookingModel {
  const _$BookingModelImpl({
    required this.id,
    required this.status,
    required this.startDate,
    required this.endDate,
    required this.totalPrice,
    required this.pickupCity,
    required this.createdAt,
    required this.bike,
    required this.hasReview,
  });

  factory _$BookingModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$BookingModelImplFromJson(json);

  @override
  final String id;
  @override
  final String status;
  @override
  final String startDate;
  @override
  final String endDate;
  @override
  final num totalPrice;
  @override
  final String pickupCity;
  @override
  final String createdAt;
  @override
  final BookingBikeRef bike;
  @override
  final bool hasReview;

  @override
  String toString() {
    return 'BookingModel(id: $id, status: $status, startDate: $startDate, endDate: $endDate, totalPrice: $totalPrice, pickupCity: $pickupCity, createdAt: $createdAt, bike: $bike, hasReview: $hasReview)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BookingModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.startDate, startDate) ||
                other.startDate == startDate) &&
            (identical(other.endDate, endDate) || other.endDate == endDate) &&
            (identical(other.totalPrice, totalPrice) ||
                other.totalPrice == totalPrice) &&
            (identical(other.pickupCity, pickupCity) ||
                other.pickupCity == pickupCity) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.bike, bike) || other.bike == bike) &&
            (identical(other.hasReview, hasReview) ||
                other.hasReview == hasReview));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    status,
    startDate,
    endDate,
    totalPrice,
    pickupCity,
    createdAt,
    bike,
    hasReview,
  );

  /// Create a copy of BookingModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$BookingModelImplCopyWith<_$BookingModelImpl> get copyWith =>
      __$$BookingModelImplCopyWithImpl<_$BookingModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$BookingModelImplToJson(this);
  }
}

abstract class _BookingModel implements BookingModel {
  const factory _BookingModel({
    required final String id,
    required final String status,
    required final String startDate,
    required final String endDate,
    required final num totalPrice,
    required final String pickupCity,
    required final String createdAt,
    required final BookingBikeRef bike,
    required final bool hasReview,
  }) = _$BookingModelImpl;

  factory _BookingModel.fromJson(Map<String, dynamic> json) =
      _$BookingModelImpl.fromJson;

  @override
  String get id;
  @override
  String get status;
  @override
  String get startDate;
  @override
  String get endDate;
  @override
  num get totalPrice;
  @override
  String get pickupCity;
  @override
  String get createdAt;
  @override
  BookingBikeRef get bike;
  @override
  bool get hasReview;

  /// Create a copy of BookingModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$BookingModelImplCopyWith<_$BookingModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
