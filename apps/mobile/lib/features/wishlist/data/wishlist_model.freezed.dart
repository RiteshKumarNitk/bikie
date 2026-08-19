// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'wishlist_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

WishlistItem _$WishlistItemFromJson(Map<String, dynamic> json) {
  return _WishlistItem.fromJson(json);
}

/// @nodoc
mixin _$WishlistItem {
  String get id => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;
  BikeSummary get bike => throw _privateConstructorUsedError;

  /// Serializes this WishlistItem to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of WishlistItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $WishlistItemCopyWith<WishlistItem> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $WishlistItemCopyWith<$Res> {
  factory $WishlistItemCopyWith(
    WishlistItem value,
    $Res Function(WishlistItem) then,
  ) = _$WishlistItemCopyWithImpl<$Res, WishlistItem>;
  @useResult
  $Res call({String id, String createdAt, BikeSummary bike});

  $BikeSummaryCopyWith<$Res> get bike;
}

/// @nodoc
class _$WishlistItemCopyWithImpl<$Res, $Val extends WishlistItem>
    implements $WishlistItemCopyWith<$Res> {
  _$WishlistItemCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of WishlistItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? createdAt = null,
    Object? bike = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as String,
            bike: null == bike
                ? _value.bike
                : bike // ignore: cast_nullable_to_non_nullable
                      as BikeSummary,
          )
          as $Val,
    );
  }

  /// Create a copy of WishlistItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $BikeSummaryCopyWith<$Res> get bike {
    return $BikeSummaryCopyWith<$Res>(_value.bike, (value) {
      return _then(_value.copyWith(bike: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$WishlistItemImplCopyWith<$Res>
    implements $WishlistItemCopyWith<$Res> {
  factory _$$WishlistItemImplCopyWith(
    _$WishlistItemImpl value,
    $Res Function(_$WishlistItemImpl) then,
  ) = __$$WishlistItemImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, String createdAt, BikeSummary bike});

  @override
  $BikeSummaryCopyWith<$Res> get bike;
}

/// @nodoc
class __$$WishlistItemImplCopyWithImpl<$Res>
    extends _$WishlistItemCopyWithImpl<$Res, _$WishlistItemImpl>
    implements _$$WishlistItemImplCopyWith<$Res> {
  __$$WishlistItemImplCopyWithImpl(
    _$WishlistItemImpl _value,
    $Res Function(_$WishlistItemImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of WishlistItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? createdAt = null,
    Object? bike = null,
  }) {
    return _then(
      _$WishlistItemImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as String,
        bike: null == bike
            ? _value.bike
            : bike // ignore: cast_nullable_to_non_nullable
                  as BikeSummary,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$WishlistItemImpl implements _WishlistItem {
  const _$WishlistItemImpl({
    required this.id,
    required this.createdAt,
    required this.bike,
  });

  factory _$WishlistItemImpl.fromJson(Map<String, dynamic> json) =>
      _$$WishlistItemImplFromJson(json);

  @override
  final String id;
  @override
  final String createdAt;
  @override
  final BikeSummary bike;

  @override
  String toString() {
    return 'WishlistItem(id: $id, createdAt: $createdAt, bike: $bike)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$WishlistItemImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.bike, bike) || other.bike == bike));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, createdAt, bike);

  /// Create a copy of WishlistItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$WishlistItemImplCopyWith<_$WishlistItemImpl> get copyWith =>
      __$$WishlistItemImplCopyWithImpl<_$WishlistItemImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$WishlistItemImplToJson(this);
  }
}

abstract class _WishlistItem implements WishlistItem {
  const factory _WishlistItem({
    required String id,
    required String createdAt,
    required BikeSummary bike,
  }) = _$WishlistItemImpl;

  factory _WishlistItem.fromJson(Map<String, dynamic> json) =
      _$WishlistItemImpl.fromJson;

  @override
  String get id;
  @override
  String get createdAt;
  @override
  BikeSummary get bike;

  /// Create a copy of WishlistItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$WishlistItemImplCopyWith<_$WishlistItemImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
