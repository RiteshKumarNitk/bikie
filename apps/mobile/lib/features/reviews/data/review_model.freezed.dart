// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'review_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

ReviewAuthor _$ReviewAuthorFromJson(Map<String, dynamic> json) {
  return _ReviewAuthor.fromJson(json);
}

/// @nodoc
mixin _$ReviewAuthor {
  String get name => throw _privateConstructorUsedError;
  String? get image => throw _privateConstructorUsedError;

  /// Serializes this ReviewAuthor to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ReviewAuthor
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ReviewAuthorCopyWith<ReviewAuthor> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ReviewAuthorCopyWith<$Res> {
  factory $ReviewAuthorCopyWith(
    ReviewAuthor value,
    $Res Function(ReviewAuthor) then,
  ) = _$ReviewAuthorCopyWithImpl<$Res, ReviewAuthor>;
  @useResult
  $Res call({String name, String? image});
}

/// @nodoc
class _$ReviewAuthorCopyWithImpl<$Res, $Val extends ReviewAuthor>
    implements $ReviewAuthorCopyWith<$Res> {
  _$ReviewAuthorCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ReviewAuthor
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
abstract class _$$ReviewAuthorImplCopyWith<$Res>
    implements $ReviewAuthorCopyWith<$Res> {
  factory _$$ReviewAuthorImplCopyWith(
    _$ReviewAuthorImpl value,
    $Res Function(_$ReviewAuthorImpl) then,
  ) = __$$ReviewAuthorImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String name, String? image});
}

/// @nodoc
class __$$ReviewAuthorImplCopyWithImpl<$Res>
    extends _$ReviewAuthorCopyWithImpl<$Res, _$ReviewAuthorImpl>
    implements _$$ReviewAuthorImplCopyWith<$Res> {
  __$$ReviewAuthorImplCopyWithImpl(
    _$ReviewAuthorImpl _value,
    $Res Function(_$ReviewAuthorImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of ReviewAuthor
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? name = null, Object? image = freezed}) {
    return _then(
      _$ReviewAuthorImpl(
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
class _$ReviewAuthorImpl implements _ReviewAuthor {
  const _$ReviewAuthorImpl({required this.name, this.image});

  factory _$ReviewAuthorImpl.fromJson(Map<String, dynamic> json) =>
      _$$ReviewAuthorImplFromJson(json);

  @override
  final String name;
  @override
  final String? image;

  @override
  String toString() {
    return 'ReviewAuthor(name: $name, image: $image)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ReviewAuthorImpl &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.image, image) || other.image == image));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, name, image);

  /// Create a copy of ReviewAuthor
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ReviewAuthorImplCopyWith<_$ReviewAuthorImpl> get copyWith =>
      __$$ReviewAuthorImplCopyWithImpl<_$ReviewAuthorImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ReviewAuthorImplToJson(this);
  }
}

abstract class _ReviewAuthor implements ReviewAuthor {
  const factory _ReviewAuthor({required String name, String? image}) =
      _$ReviewAuthorImpl;

  factory _ReviewAuthor.fromJson(Map<String, dynamic> json) =
      _$ReviewAuthorImpl.fromJson;

  @override
  String get name;
  @override
  String? get image;

  /// Create a copy of ReviewAuthor
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ReviewAuthorImplCopyWith<_$ReviewAuthorImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ReviewBikeRef _$ReviewBikeRefFromJson(Map<String, dynamic> json) {
  return _ReviewBikeRef.fromJson(json);
}

/// @nodoc
mixin _$ReviewBikeRef {
  String get slug => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;

  /// Serializes this ReviewBikeRef to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ReviewBikeRef
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ReviewBikeRefCopyWith<ReviewBikeRef> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ReviewBikeRefCopyWith<$Res> {
  factory $ReviewBikeRefCopyWith(
    ReviewBikeRef value,
    $Res Function(ReviewBikeRef) then,
  ) = _$ReviewBikeRefCopyWithImpl<$Res, ReviewBikeRef>;
  @useResult
  $Res call({String slug, String name});
}

/// @nodoc
class _$ReviewBikeRefCopyWithImpl<$Res, $Val extends ReviewBikeRef>
    implements $ReviewBikeRefCopyWith<$Res> {
  _$ReviewBikeRefCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ReviewBikeRef
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? slug = null, Object? name = null}) {
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
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$ReviewBikeRefImplCopyWith<$Res>
    implements $ReviewBikeRefCopyWith<$Res> {
  factory _$$ReviewBikeRefImplCopyWith(
    _$ReviewBikeRefImpl value,
    $Res Function(_$ReviewBikeRefImpl) then,
  ) = __$$ReviewBikeRefImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String slug, String name});
}

/// @nodoc
class __$$ReviewBikeRefImplCopyWithImpl<$Res>
    extends _$ReviewBikeRefCopyWithImpl<$Res, _$ReviewBikeRefImpl>
    implements _$$ReviewBikeRefImplCopyWith<$Res> {
  __$$ReviewBikeRefImplCopyWithImpl(
    _$ReviewBikeRefImpl _value,
    $Res Function(_$ReviewBikeRefImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of ReviewBikeRef
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? slug = null, Object? name = null}) {
    return _then(
      _$ReviewBikeRefImpl(
        slug: null == slug
            ? _value.slug
            : slug // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$ReviewBikeRefImpl implements _ReviewBikeRef {
  const _$ReviewBikeRefImpl({required this.slug, required this.name});

  factory _$ReviewBikeRefImpl.fromJson(Map<String, dynamic> json) =>
      _$$ReviewBikeRefImplFromJson(json);

  @override
  final String slug;
  @override
  final String name;

  @override
  String toString() {
    return 'ReviewBikeRef(slug: $slug, name: $name)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ReviewBikeRefImpl &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, slug, name);

  /// Create a copy of ReviewBikeRef
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ReviewBikeRefImplCopyWith<_$ReviewBikeRefImpl> get copyWith =>
      __$$ReviewBikeRefImplCopyWithImpl<_$ReviewBikeRefImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ReviewBikeRefImplToJson(this);
  }
}

abstract class _ReviewBikeRef implements ReviewBikeRef {
  const factory _ReviewBikeRef({required String slug, required String name}) =
      _$ReviewBikeRefImpl;

  factory _ReviewBikeRef.fromJson(Map<String, dynamic> json) =
      _$ReviewBikeRefImpl.fromJson;

  @override
  String get slug;
  @override
  String get name;

  /// Create a copy of ReviewBikeRef
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ReviewBikeRefImplCopyWith<_$ReviewBikeRefImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ReviewModel _$ReviewModelFromJson(Map<String, dynamic> json) {
  return _ReviewModel.fromJson(json);
}

/// @nodoc
mixin _$ReviewModel {
  String get id => throw _privateConstructorUsedError;
  num get rating => throw _privateConstructorUsedError;
  String get comment => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;
  ReviewAuthor get author => throw _privateConstructorUsedError;
  ReviewBikeRef? get bike => throw _privateConstructorUsedError;

  /// Serializes this ReviewModel to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ReviewModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ReviewModelCopyWith<ReviewModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ReviewModelCopyWith<$Res> {
  factory $ReviewModelCopyWith(
    ReviewModel value,
    $Res Function(ReviewModel) then,
  ) = _$ReviewModelCopyWithImpl<$Res, ReviewModel>;
  @useResult
  $Res call({
    String id,
    num rating,
    String comment,
    String createdAt,
    ReviewAuthor author,
    ReviewBikeRef? bike,
  });

  $ReviewAuthorCopyWith<$Res> get author;
  $ReviewBikeRefCopyWith<$Res>? get bike;
}

/// @nodoc
class _$ReviewModelCopyWithImpl<$Res, $Val extends ReviewModel>
    implements $ReviewModelCopyWith<$Res> {
  _$ReviewModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ReviewModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? rating = null,
    Object? comment = null,
    Object? createdAt = null,
    Object? author = null,
    Object? bike = freezed,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            rating: null == rating
                ? _value.rating
                : rating // ignore: cast_nullable_to_non_nullable
                      as num,
            comment: null == comment
                ? _value.comment
                : comment // ignore: cast_nullable_to_non_nullable
                      as String,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as String,
            author: null == author
                ? _value.author
                : author // ignore: cast_nullable_to_non_nullable
                      as ReviewAuthor,
            bike: freezed == bike
                ? _value.bike
                : bike // ignore: cast_nullable_to_non_nullable
                      as ReviewBikeRef?,
          )
          as $Val,
    );
  }

  /// Create a copy of ReviewModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $ReviewAuthorCopyWith<$Res> get author {
    return $ReviewAuthorCopyWith<$Res>(_value.author, (value) {
      return _then(_value.copyWith(author: value) as $Val);
    });
  }

  /// Create a copy of ReviewModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $ReviewBikeRefCopyWith<$Res>? get bike {
    if (_value.bike == null) {
      return null;
    }

    return $ReviewBikeRefCopyWith<$Res>(_value.bike!, (value) {
      return _then(_value.copyWith(bike: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$ReviewModelImplCopyWith<$Res>
    implements $ReviewModelCopyWith<$Res> {
  factory _$$ReviewModelImplCopyWith(
    _$ReviewModelImpl value,
    $Res Function(_$ReviewModelImpl) then,
  ) = __$$ReviewModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    num rating,
    String comment,
    String createdAt,
    ReviewAuthor author,
    ReviewBikeRef? bike,
  });

  @override
  $ReviewAuthorCopyWith<$Res> get author;
  @override
  $ReviewBikeRefCopyWith<$Res>? get bike;
}

/// @nodoc
class __$$ReviewModelImplCopyWithImpl<$Res>
    extends _$ReviewModelCopyWithImpl<$Res, _$ReviewModelImpl>
    implements _$$ReviewModelImplCopyWith<$Res> {
  __$$ReviewModelImplCopyWithImpl(
    _$ReviewModelImpl _value,
    $Res Function(_$ReviewModelImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of ReviewModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? rating = null,
    Object? comment = null,
    Object? createdAt = null,
    Object? author = null,
    Object? bike = freezed,
  }) {
    return _then(
      _$ReviewModelImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        rating: null == rating
            ? _value.rating
            : rating // ignore: cast_nullable_to_non_nullable
                  as num,
        comment: null == comment
            ? _value.comment
            : comment // ignore: cast_nullable_to_non_nullable
                  as String,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as String,
        author: null == author
            ? _value.author
            : author // ignore: cast_nullable_to_non_nullable
                  as ReviewAuthor,
        bike: freezed == bike
            ? _value.bike
            : bike // ignore: cast_nullable_to_non_nullable
                  as ReviewBikeRef?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$ReviewModelImpl implements _ReviewModel {
  const _$ReviewModelImpl({
    required this.id,
    required this.rating,
    required this.comment,
    required this.createdAt,
    required this.author,
    this.bike,
  });

  factory _$ReviewModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$ReviewModelImplFromJson(json);

  @override
  final String id;
  @override
  final num rating;
  @override
  final String comment;
  @override
  final String createdAt;
  @override
  final ReviewAuthor author;
  @override
  final ReviewBikeRef? bike;

  @override
  String toString() {
    return 'ReviewModel(id: $id, rating: $rating, comment: $comment, createdAt: $createdAt, author: $author, bike: $bike)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ReviewModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.rating, rating) || other.rating == rating) &&
            (identical(other.comment, comment) || other.comment == comment) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.author, author) || other.author == author) &&
            (identical(other.bike, bike) || other.bike == bike));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, id, rating, comment, createdAt, author, bike);

  /// Create a copy of ReviewModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ReviewModelImplCopyWith<_$ReviewModelImpl> get copyWith =>
      __$$ReviewModelImplCopyWithImpl<_$ReviewModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ReviewModelImplToJson(this);
  }
}

abstract class _ReviewModel implements ReviewModel {
  const factory _ReviewModel({
    required String id,
    required num rating,
    required String comment,
    required String createdAt,
    required ReviewAuthor author,
    ReviewBikeRef? bike,
  }) = _$ReviewModelImpl;

  factory _ReviewModel.fromJson(Map<String, dynamic> json) =
      _$ReviewModelImpl.fromJson;

  @override
  String get id;
  @override
  num get rating;
  @override
  String get comment;
  @override
  String get createdAt;
  @override
  ReviewAuthor get author;
  @override
  ReviewBikeRef? get bike;

  /// Create a copy of ReviewModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ReviewModelImplCopyWith<_$ReviewModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
