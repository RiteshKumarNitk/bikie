// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'destination_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

DestinationSummary _$DestinationSummaryFromJson(Map<String, dynamic> json) {
  return _DestinationSummary.fromJson(json);
}

/// @nodoc
mixin _$DestinationSummary {
  String get id => throw _privateConstructorUsedError;
  String get slug => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get state => throw _privateConstructorUsedError;
  String get imageUrl => throw _privateConstructorUsedError;
  int get bikeCount => throw _privateConstructorUsedError;

  /// Serializes this DestinationSummary to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of DestinationSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $DestinationSummaryCopyWith<DestinationSummary> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DestinationSummaryCopyWith<$Res> {
  factory $DestinationSummaryCopyWith(
    DestinationSummary value,
    $Res Function(DestinationSummary) then,
  ) = _$DestinationSummaryCopyWithImpl<$Res, DestinationSummary>;
  @useResult
  $Res call({
    String id,
    String slug,
    String name,
    String state,
    String imageUrl,
    int bikeCount,
  });
}

/// @nodoc
class _$DestinationSummaryCopyWithImpl<$Res, $Val extends DestinationSummary>
    implements $DestinationSummaryCopyWith<$Res> {
  _$DestinationSummaryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of DestinationSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? slug = null,
    Object? name = null,
    Object? state = null,
    Object? imageUrl = null,
    Object? bikeCount = null,
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
            state: null == state
                ? _value.state
                : state // ignore: cast_nullable_to_non_nullable
                      as String,
            imageUrl: null == imageUrl
                ? _value.imageUrl
                : imageUrl // ignore: cast_nullable_to_non_nullable
                      as String,
            bikeCount: null == bikeCount
                ? _value.bikeCount
                : bikeCount // ignore: cast_nullable_to_non_nullable
                      as int,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$DestinationSummaryImplCopyWith<$Res>
    implements $DestinationSummaryCopyWith<$Res> {
  factory _$$DestinationSummaryImplCopyWith(
    _$DestinationSummaryImpl value,
    $Res Function(_$DestinationSummaryImpl) then,
  ) = __$$DestinationSummaryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String slug,
    String name,
    String state,
    String imageUrl,
    int bikeCount,
  });
}

/// @nodoc
class __$$DestinationSummaryImplCopyWithImpl<$Res>
    extends _$DestinationSummaryCopyWithImpl<$Res, _$DestinationSummaryImpl>
    implements _$$DestinationSummaryImplCopyWith<$Res> {
  __$$DestinationSummaryImplCopyWithImpl(
    _$DestinationSummaryImpl _value,
    $Res Function(_$DestinationSummaryImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of DestinationSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? slug = null,
    Object? name = null,
    Object? state = null,
    Object? imageUrl = null,
    Object? bikeCount = null,
  }) {
    return _then(
      _$DestinationSummaryImpl(
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
        state: null == state
            ? _value.state
            : state // ignore: cast_nullable_to_non_nullable
                  as String,
        imageUrl: null == imageUrl
            ? _value.imageUrl
            : imageUrl // ignore: cast_nullable_to_non_nullable
                  as String,
        bikeCount: null == bikeCount
            ? _value.bikeCount
            : bikeCount // ignore: cast_nullable_to_non_nullable
                  as int,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$DestinationSummaryImpl implements _DestinationSummary {
  const _$DestinationSummaryImpl({
    required this.id,
    required this.slug,
    required this.name,
    required this.state,
    required this.imageUrl,
    required this.bikeCount,
  });

  factory _$DestinationSummaryImpl.fromJson(Map<String, dynamic> json) =>
      _$$DestinationSummaryImplFromJson(json);

  @override
  final String id;
  @override
  final String slug;
  @override
  final String name;
  @override
  final String state;
  @override
  final String imageUrl;
  @override
  final int bikeCount;

  @override
  String toString() {
    return 'DestinationSummary(id: $id, slug: $slug, name: $name, state: $state, imageUrl: $imageUrl, bikeCount: $bikeCount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DestinationSummaryImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.state, state) || other.state == state) &&
            (identical(other.imageUrl, imageUrl) ||
                other.imageUrl == imageUrl) &&
            (identical(other.bikeCount, bikeCount) ||
                other.bikeCount == bikeCount));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, id, slug, name, state, imageUrl, bikeCount);

  /// Create a copy of DestinationSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$DestinationSummaryImplCopyWith<_$DestinationSummaryImpl> get copyWith =>
      __$$DestinationSummaryImplCopyWithImpl<_$DestinationSummaryImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$DestinationSummaryImplToJson(this);
  }
}

abstract class _DestinationSummary implements DestinationSummary {
  const factory _DestinationSummary({
    required String id,
    required String slug,
    required String name,
    required String state,
    required String imageUrl,
    required int bikeCount,
  }) = _$DestinationSummaryImpl;

  factory _DestinationSummary.fromJson(Map<String, dynamic> json) =
      _$DestinationSummaryImpl.fromJson;

  @override
  String get id;
  @override
  String get slug;
  @override
  String get name;
  @override
  String get state;
  @override
  String get imageUrl;
  @override
  int get bikeCount;

  /// Create a copy of DestinationSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$DestinationSummaryImplCopyWith<_$DestinationSummaryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

DestinationDetail _$DestinationDetailFromJson(Map<String, dynamic> json) {
  return _DestinationDetail.fromJson(json);
}

/// @nodoc
mixin _$DestinationDetail {
  String get id => throw _privateConstructorUsedError;
  String get slug => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get state => throw _privateConstructorUsedError;
  String get imageUrl => throw _privateConstructorUsedError;
  int get bikeCount => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  List<BikeSummary> get bikes => throw _privateConstructorUsedError;

  /// Serializes this DestinationDetail to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of DestinationDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $DestinationDetailCopyWith<DestinationDetail> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DestinationDetailCopyWith<$Res> {
  factory $DestinationDetailCopyWith(
    DestinationDetail value,
    $Res Function(DestinationDetail) then,
  ) = _$DestinationDetailCopyWithImpl<$Res, DestinationDetail>;
  @useResult
  $Res call({
    String id,
    String slug,
    String name,
    String state,
    String imageUrl,
    int bikeCount,
    String? description,
    List<BikeSummary> bikes,
  });
}

/// @nodoc
class _$DestinationDetailCopyWithImpl<$Res, $Val extends DestinationDetail>
    implements $DestinationDetailCopyWith<$Res> {
  _$DestinationDetailCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of DestinationDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? slug = null,
    Object? name = null,
    Object? state = null,
    Object? imageUrl = null,
    Object? bikeCount = null,
    Object? description = freezed,
    Object? bikes = null,
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
            state: null == state
                ? _value.state
                : state // ignore: cast_nullable_to_non_nullable
                      as String,
            imageUrl: null == imageUrl
                ? _value.imageUrl
                : imageUrl // ignore: cast_nullable_to_non_nullable
                      as String,
            bikeCount: null == bikeCount
                ? _value.bikeCount
                : bikeCount // ignore: cast_nullable_to_non_nullable
                      as int,
            description: freezed == description
                ? _value.description
                : description // ignore: cast_nullable_to_non_nullable
                      as String?,
            bikes: null == bikes
                ? _value.bikes
                : bikes // ignore: cast_nullable_to_non_nullable
                      as List<BikeSummary>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$DestinationDetailImplCopyWith<$Res>
    implements $DestinationDetailCopyWith<$Res> {
  factory _$$DestinationDetailImplCopyWith(
    _$DestinationDetailImpl value,
    $Res Function(_$DestinationDetailImpl) then,
  ) = __$$DestinationDetailImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String slug,
    String name,
    String state,
    String imageUrl,
    int bikeCount,
    String? description,
    List<BikeSummary> bikes,
  });
}

/// @nodoc
class __$$DestinationDetailImplCopyWithImpl<$Res>
    extends _$DestinationDetailCopyWithImpl<$Res, _$DestinationDetailImpl>
    implements _$$DestinationDetailImplCopyWith<$Res> {
  __$$DestinationDetailImplCopyWithImpl(
    _$DestinationDetailImpl _value,
    $Res Function(_$DestinationDetailImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of DestinationDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? slug = null,
    Object? name = null,
    Object? state = null,
    Object? imageUrl = null,
    Object? bikeCount = null,
    Object? description = freezed,
    Object? bikes = null,
  }) {
    return _then(
      _$DestinationDetailImpl(
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
        state: null == state
            ? _value.state
            : state // ignore: cast_nullable_to_non_nullable
                  as String,
        imageUrl: null == imageUrl
            ? _value.imageUrl
            : imageUrl // ignore: cast_nullable_to_non_nullable
                  as String,
        bikeCount: null == bikeCount
            ? _value.bikeCount
            : bikeCount // ignore: cast_nullable_to_non_nullable
                  as int,
        description: freezed == description
            ? _value.description
            : description // ignore: cast_nullable_to_non_nullable
                  as String?,
        bikes: null == bikes
            ? _value._bikes
            : bikes // ignore: cast_nullable_to_non_nullable
                  as List<BikeSummary>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$DestinationDetailImpl implements _DestinationDetail {
  const _$DestinationDetailImpl({
    required this.id,
    required this.slug,
    required this.name,
    required this.state,
    required this.imageUrl,
    required this.bikeCount,
    this.description,
    required List<BikeSummary> bikes,
  }) : _bikes = bikes;

  factory _$DestinationDetailImpl.fromJson(Map<String, dynamic> json) =>
      _$$DestinationDetailImplFromJson(json);

  @override
  final String id;
  @override
  final String slug;
  @override
  final String name;
  @override
  final String state;
  @override
  final String imageUrl;
  @override
  final int bikeCount;
  @override
  final String? description;
  final List<BikeSummary> _bikes;
  @override
  List<BikeSummary> get bikes {
    if (_bikes is EqualUnmodifiableListView) return _bikes;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_bikes);
  }

  @override
  String toString() {
    return 'DestinationDetail(id: $id, slug: $slug, name: $name, state: $state, imageUrl: $imageUrl, bikeCount: $bikeCount, description: $description, bikes: $bikes)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DestinationDetailImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.slug, slug) || other.slug == slug) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.state, state) || other.state == state) &&
            (identical(other.imageUrl, imageUrl) ||
                other.imageUrl == imageUrl) &&
            (identical(other.bikeCount, bikeCount) ||
                other.bikeCount == bikeCount) &&
            (identical(other.description, description) ||
                other.description == description) &&
            const DeepCollectionEquality().equals(other._bikes, _bikes));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    slug,
    name,
    state,
    imageUrl,
    bikeCount,
    description,
    const DeepCollectionEquality().hash(_bikes),
  );

  /// Create a copy of DestinationDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$DestinationDetailImplCopyWith<_$DestinationDetailImpl> get copyWith =>
      __$$DestinationDetailImplCopyWithImpl<_$DestinationDetailImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$DestinationDetailImplToJson(this);
  }
}

abstract class _DestinationDetail implements DestinationDetail {
  const factory _DestinationDetail({
    required String id,
    required String slug,
    required String name,
    required String state,
    required String imageUrl,
    required int bikeCount,
    String? description,
    required List<BikeSummary> bikes,
  }) = _$DestinationDetailImpl;

  factory _DestinationDetail.fromJson(Map<String, dynamic> json) =
      _$DestinationDetailImpl.fromJson;

  @override
  String get id;
  @override
  String get slug;
  @override
  String get name;
  @override
  String get state;
  @override
  String get imageUrl;
  @override
  int get bikeCount;
  @override
  String? get description;
  @override
  List<BikeSummary> get bikes;

  /// Create a copy of DestinationDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$DestinationDetailImplCopyWith<_$DestinationDetailImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
