// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'testimonial_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

TestimonialModel _$TestimonialModelFromJson(Map<String, dynamic> json) {
  return _TestimonialModel.fromJson(json);
}

/// @nodoc
mixin _$TestimonialModel {
  String get id => throw _privateConstructorUsedError;
  String get authorName => throw _privateConstructorUsedError;
  String? get authorAvatarUrl => throw _privateConstructorUsedError;
  String? get authorLocation => throw _privateConstructorUsedError;
  num get rating => throw _privateConstructorUsedError;
  String get quote => throw _privateConstructorUsedError;

  /// Serializes this TestimonialModel to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of TestimonialModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TestimonialModelCopyWith<TestimonialModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TestimonialModelCopyWith<$Res> {
  factory $TestimonialModelCopyWith(
    TestimonialModel value,
    $Res Function(TestimonialModel) then,
  ) = _$TestimonialModelCopyWithImpl<$Res, TestimonialModel>;
  @useResult
  $Res call({
    String id,
    String authorName,
    String? authorAvatarUrl,
    String? authorLocation,
    num rating,
    String quote,
  });
}

/// @nodoc
class _$TestimonialModelCopyWithImpl<$Res, $Val extends TestimonialModel>
    implements $TestimonialModelCopyWith<$Res> {
  _$TestimonialModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of TestimonialModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? authorName = null,
    Object? authorAvatarUrl = freezed,
    Object? authorLocation = freezed,
    Object? rating = null,
    Object? quote = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            authorName: null == authorName
                ? _value.authorName
                : authorName // ignore: cast_nullable_to_non_nullable
                      as String,
            authorAvatarUrl: freezed == authorAvatarUrl
                ? _value.authorAvatarUrl
                : authorAvatarUrl // ignore: cast_nullable_to_non_nullable
                      as String?,
            authorLocation: freezed == authorLocation
                ? _value.authorLocation
                : authorLocation // ignore: cast_nullable_to_non_nullable
                      as String?,
            rating: null == rating
                ? _value.rating
                : rating // ignore: cast_nullable_to_non_nullable
                      as num,
            quote: null == quote
                ? _value.quote
                : quote // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$TestimonialModelImplCopyWith<$Res>
    implements $TestimonialModelCopyWith<$Res> {
  factory _$$TestimonialModelImplCopyWith(
    _$TestimonialModelImpl value,
    $Res Function(_$TestimonialModelImpl) then,
  ) = __$$TestimonialModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String authorName,
    String? authorAvatarUrl,
    String? authorLocation,
    num rating,
    String quote,
  });
}

/// @nodoc
class __$$TestimonialModelImplCopyWithImpl<$Res>
    extends _$TestimonialModelCopyWithImpl<$Res, _$TestimonialModelImpl>
    implements _$$TestimonialModelImplCopyWith<$Res> {
  __$$TestimonialModelImplCopyWithImpl(
    _$TestimonialModelImpl _value,
    $Res Function(_$TestimonialModelImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of TestimonialModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? authorName = null,
    Object? authorAvatarUrl = freezed,
    Object? authorLocation = freezed,
    Object? rating = null,
    Object? quote = null,
  }) {
    return _then(
      _$TestimonialModelImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        authorName: null == authorName
            ? _value.authorName
            : authorName // ignore: cast_nullable_to_non_nullable
                  as String,
        authorAvatarUrl: freezed == authorAvatarUrl
            ? _value.authorAvatarUrl
            : authorAvatarUrl // ignore: cast_nullable_to_non_nullable
                  as String?,
        authorLocation: freezed == authorLocation
            ? _value.authorLocation
            : authorLocation // ignore: cast_nullable_to_non_nullable
                  as String?,
        rating: null == rating
            ? _value.rating
            : rating // ignore: cast_nullable_to_non_nullable
                  as num,
        quote: null == quote
            ? _value.quote
            : quote // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$TestimonialModelImpl implements _TestimonialModel {
  const _$TestimonialModelImpl({
    required this.id,
    required this.authorName,
    this.authorAvatarUrl,
    this.authorLocation,
    required this.rating,
    required this.quote,
  });

  factory _$TestimonialModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$TestimonialModelImplFromJson(json);

  @override
  final String id;
  @override
  final String authorName;
  @override
  final String? authorAvatarUrl;
  @override
  final String? authorLocation;
  @override
  final num rating;
  @override
  final String quote;

  @override
  String toString() {
    return 'TestimonialModel(id: $id, authorName: $authorName, authorAvatarUrl: $authorAvatarUrl, authorLocation: $authorLocation, rating: $rating, quote: $quote)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TestimonialModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.authorName, authorName) ||
                other.authorName == authorName) &&
            (identical(other.authorAvatarUrl, authorAvatarUrl) ||
                other.authorAvatarUrl == authorAvatarUrl) &&
            (identical(other.authorLocation, authorLocation) ||
                other.authorLocation == authorLocation) &&
            (identical(other.rating, rating) || other.rating == rating) &&
            (identical(other.quote, quote) || other.quote == quote));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    authorName,
    authorAvatarUrl,
    authorLocation,
    rating,
    quote,
  );

  /// Create a copy of TestimonialModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TestimonialModelImplCopyWith<_$TestimonialModelImpl> get copyWith =>
      __$$TestimonialModelImplCopyWithImpl<_$TestimonialModelImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$TestimonialModelImplToJson(this);
  }
}

abstract class _TestimonialModel implements TestimonialModel {
  const factory _TestimonialModel({
    required String id,
    required String authorName,
    String? authorAvatarUrl,
    String? authorLocation,
    required num rating,
    required String quote,
  }) = _$TestimonialModelImpl;

  factory _TestimonialModel.fromJson(Map<String, dynamic> json) =
      _$TestimonialModelImpl.fromJson;

  @override
  String get id;
  @override
  String get authorName;
  @override
  String? get authorAvatarUrl;
  @override
  String? get authorLocation;
  @override
  num get rating;
  @override
  String get quote;

  /// Create a copy of TestimonialModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TestimonialModelImplCopyWith<_$TestimonialModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
