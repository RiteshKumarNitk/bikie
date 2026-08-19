// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'nearby_riders_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

NearbyRider _$NearbyRiderFromJson(Map<String, dynamic> json) {
  return _NearbyRider.fromJson(json);
}

/// @nodoc
mixin _$NearbyRider {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  num get distanceMeters => throw _privateConstructorUsedError;

  /// Serializes this NearbyRider to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of NearbyRider
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $NearbyRiderCopyWith<NearbyRider> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $NearbyRiderCopyWith<$Res> {
  factory $NearbyRiderCopyWith(
    NearbyRider value,
    $Res Function(NearbyRider) then,
  ) = _$NearbyRiderCopyWithImpl<$Res, NearbyRider>;
  @useResult
  $Res call({String id, String name, num distanceMeters});
}

/// @nodoc
class _$NearbyRiderCopyWithImpl<$Res, $Val extends NearbyRider>
    implements $NearbyRiderCopyWith<$Res> {
  _$NearbyRiderCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of NearbyRider
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? distanceMeters = null,
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
            distanceMeters: null == distanceMeters
                ? _value.distanceMeters
                : distanceMeters // ignore: cast_nullable_to_non_nullable
                      as num,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$NearbyRiderImplCopyWith<$Res>
    implements $NearbyRiderCopyWith<$Res> {
  factory _$$NearbyRiderImplCopyWith(
    _$NearbyRiderImpl value,
    $Res Function(_$NearbyRiderImpl) then,
  ) = __$$NearbyRiderImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, String name, num distanceMeters});
}

/// @nodoc
class __$$NearbyRiderImplCopyWithImpl<$Res>
    extends _$NearbyRiderCopyWithImpl<$Res, _$NearbyRiderImpl>
    implements _$$NearbyRiderImplCopyWith<$Res> {
  __$$NearbyRiderImplCopyWithImpl(
    _$NearbyRiderImpl _value,
    $Res Function(_$NearbyRiderImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of NearbyRider
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? distanceMeters = null,
  }) {
    return _then(
      _$NearbyRiderImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        distanceMeters: null == distanceMeters
            ? _value.distanceMeters
            : distanceMeters // ignore: cast_nullable_to_non_nullable
                  as num,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$NearbyRiderImpl implements _NearbyRider {
  const _$NearbyRiderImpl({
    required this.id,
    required this.name,
    required this.distanceMeters,
  });

  factory _$NearbyRiderImpl.fromJson(Map<String, dynamic> json) =>
      _$$NearbyRiderImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final num distanceMeters;

  @override
  String toString() {
    return 'NearbyRider(id: $id, name: $name, distanceMeters: $distanceMeters)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$NearbyRiderImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.distanceMeters, distanceMeters) ||
                other.distanceMeters == distanceMeters));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, distanceMeters);

  /// Create a copy of NearbyRider
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$NearbyRiderImplCopyWith<_$NearbyRiderImpl> get copyWith =>
      __$$NearbyRiderImplCopyWithImpl<_$NearbyRiderImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$NearbyRiderImplToJson(this);
  }
}

abstract class _NearbyRider implements NearbyRider {
  const factory _NearbyRider({
    required String id,
    required String name,
    required num distanceMeters,
  }) = _$NearbyRiderImpl;

  factory _NearbyRider.fromJson(Map<String, dynamic> json) =
      _$NearbyRiderImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  num get distanceMeters;

  /// Create a copy of NearbyRider
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$NearbyRiderImplCopyWith<_$NearbyRiderImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
