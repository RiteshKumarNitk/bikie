// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'partner_membership_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

PartnerMembershipPlan _$PartnerMembershipPlanFromJson(
  Map<String, dynamic> json,
) {
  return _PartnerMembershipPlan.fromJson(json);
}

/// @nodoc
mixin _$PartnerMembershipPlan {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  num get price => throw _privateConstructorUsedError;
  int get durationDays => throw _privateConstructorUsedError;
  List<String> get benefits => throw _privateConstructorUsedError;
  bool get isActive => throw _privateConstructorUsedError;

  /// Serializes this PartnerMembershipPlan to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of PartnerMembershipPlan
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $PartnerMembershipPlanCopyWith<PartnerMembershipPlan> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PartnerMembershipPlanCopyWith<$Res> {
  factory $PartnerMembershipPlanCopyWith(
    PartnerMembershipPlan value,
    $Res Function(PartnerMembershipPlan) then,
  ) = _$PartnerMembershipPlanCopyWithImpl<$Res, PartnerMembershipPlan>;
  @useResult
  $Res call({
    String id,
    String name,
    String description,
    num price,
    int durationDays,
    List<String> benefits,
    bool isActive,
  });
}

/// @nodoc
class _$PartnerMembershipPlanCopyWithImpl<
  $Res,
  $Val extends PartnerMembershipPlan
>
    implements $PartnerMembershipPlanCopyWith<$Res> {
  _$PartnerMembershipPlanCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of PartnerMembershipPlan
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? description = null,
    Object? price = null,
    Object? durationDays = null,
    Object? benefits = null,
    Object? isActive = null,
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
            description: null == description
                ? _value.description
                : description // ignore: cast_nullable_to_non_nullable
                      as String,
            price: null == price
                ? _value.price
                : price // ignore: cast_nullable_to_non_nullable
                      as num,
            durationDays: null == durationDays
                ? _value.durationDays
                : durationDays // ignore: cast_nullable_to_non_nullable
                      as int,
            benefits: null == benefits
                ? _value.benefits
                : benefits // ignore: cast_nullable_to_non_nullable
                      as List<String>,
            isActive: null == isActive
                ? _value.isActive
                : isActive // ignore: cast_nullable_to_non_nullable
                      as bool,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$PartnerMembershipPlanImplCopyWith<$Res>
    implements $PartnerMembershipPlanCopyWith<$Res> {
  factory _$$PartnerMembershipPlanImplCopyWith(
    _$PartnerMembershipPlanImpl value,
    $Res Function(_$PartnerMembershipPlanImpl) then,
  ) = __$$PartnerMembershipPlanImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String name,
    String description,
    num price,
    int durationDays,
    List<String> benefits,
    bool isActive,
  });
}

/// @nodoc
class __$$PartnerMembershipPlanImplCopyWithImpl<$Res>
    extends
        _$PartnerMembershipPlanCopyWithImpl<$Res, _$PartnerMembershipPlanImpl>
    implements _$$PartnerMembershipPlanImplCopyWith<$Res> {
  __$$PartnerMembershipPlanImplCopyWithImpl(
    _$PartnerMembershipPlanImpl _value,
    $Res Function(_$PartnerMembershipPlanImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of PartnerMembershipPlan
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? description = null,
    Object? price = null,
    Object? durationDays = null,
    Object? benefits = null,
    Object? isActive = null,
  }) {
    return _then(
      _$PartnerMembershipPlanImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        description: null == description
            ? _value.description
            : description // ignore: cast_nullable_to_non_nullable
                  as String,
        price: null == price
            ? _value.price
            : price // ignore: cast_nullable_to_non_nullable
                  as num,
        durationDays: null == durationDays
            ? _value.durationDays
            : durationDays // ignore: cast_nullable_to_non_nullable
                  as int,
        benefits: null == benefits
            ? _value._benefits
            : benefits // ignore: cast_nullable_to_non_nullable
                  as List<String>,
        isActive: null == isActive
            ? _value.isActive
            : isActive // ignore: cast_nullable_to_non_nullable
                  as bool,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$PartnerMembershipPlanImpl implements _PartnerMembershipPlan {
  const _$PartnerMembershipPlanImpl({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.durationDays,
    required List<String> benefits,
    required this.isActive,
  }) : _benefits = benefits;

  factory _$PartnerMembershipPlanImpl.fromJson(Map<String, dynamic> json) =>
      _$$PartnerMembershipPlanImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String description;
  @override
  final num price;
  @override
  final int durationDays;
  final List<String> _benefits;
  @override
  List<String> get benefits {
    if (_benefits is EqualUnmodifiableListView) return _benefits;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_benefits);
  }

  @override
  final bool isActive;

  @override
  String toString() {
    return 'PartnerMembershipPlan(id: $id, name: $name, description: $description, price: $price, durationDays: $durationDays, benefits: $benefits, isActive: $isActive)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PartnerMembershipPlanImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.durationDays, durationDays) ||
                other.durationDays == durationDays) &&
            const DeepCollectionEquality().equals(other._benefits, _benefits) &&
            (identical(other.isActive, isActive) ||
                other.isActive == isActive));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    name,
    description,
    price,
    durationDays,
    const DeepCollectionEquality().hash(_benefits),
    isActive,
  );

  /// Create a copy of PartnerMembershipPlan
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PartnerMembershipPlanImplCopyWith<_$PartnerMembershipPlanImpl>
  get copyWith =>
      __$$PartnerMembershipPlanImplCopyWithImpl<_$PartnerMembershipPlanImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$PartnerMembershipPlanImplToJson(this);
  }
}

abstract class _PartnerMembershipPlan implements PartnerMembershipPlan {
  const factory _PartnerMembershipPlan({
    required String id,
    required String name,
    required String description,
    required num price,
    required int durationDays,
    required List<String> benefits,
    required bool isActive,
  }) = _$PartnerMembershipPlanImpl;

  factory _PartnerMembershipPlan.fromJson(Map<String, dynamic> json) =
      _$PartnerMembershipPlanImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get description;
  @override
  num get price;
  @override
  int get durationDays;
  @override
  List<String> get benefits;
  @override
  bool get isActive;

  /// Create a copy of PartnerMembershipPlan
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PartnerMembershipPlanImplCopyWith<_$PartnerMembershipPlanImpl>
  get copyWith => throw _privateConstructorUsedError;
}

PartnerMembership _$PartnerMembershipFromJson(Map<String, dynamic> json) {
  return _PartnerMembership.fromJson(json);
}

/// @nodoc
mixin _$PartnerMembership {
  String get id => throw _privateConstructorUsedError;
  String get userId => throw _privateConstructorUsedError;
  String get planId => throw _privateConstructorUsedError;
  PartnerMembershipPlan get plan => throw _privateConstructorUsedError;
  String get startDate => throw _privateConstructorUsedError;
  String get endDate => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  int get daysLeft => throw _privateConstructorUsedError;

  /// Serializes this PartnerMembership to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of PartnerMembership
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $PartnerMembershipCopyWith<PartnerMembership> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PartnerMembershipCopyWith<$Res> {
  factory $PartnerMembershipCopyWith(
    PartnerMembership value,
    $Res Function(PartnerMembership) then,
  ) = _$PartnerMembershipCopyWithImpl<$Res, PartnerMembership>;
  @useResult
  $Res call({
    String id,
    String userId,
    String planId,
    PartnerMembershipPlan plan,
    String startDate,
    String endDate,
    String status,
    int daysLeft,
  });

  $PartnerMembershipPlanCopyWith<$Res> get plan;
}

/// @nodoc
class _$PartnerMembershipCopyWithImpl<$Res, $Val extends PartnerMembership>
    implements $PartnerMembershipCopyWith<$Res> {
  _$PartnerMembershipCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of PartnerMembership
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? planId = null,
    Object? plan = null,
    Object? startDate = null,
    Object? endDate = null,
    Object? status = null,
    Object? daysLeft = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            userId: null == userId
                ? _value.userId
                : userId // ignore: cast_nullable_to_non_nullable
                      as String,
            planId: null == planId
                ? _value.planId
                : planId // ignore: cast_nullable_to_non_nullable
                      as String,
            plan: null == plan
                ? _value.plan
                : plan // ignore: cast_nullable_to_non_nullable
                      as PartnerMembershipPlan,
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
            daysLeft: null == daysLeft
                ? _value.daysLeft
                : daysLeft // ignore: cast_nullable_to_non_nullable
                      as int,
          )
          as $Val,
    );
  }

  /// Create a copy of PartnerMembership
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $PartnerMembershipPlanCopyWith<$Res> get plan {
    return $PartnerMembershipPlanCopyWith<$Res>(_value.plan, (value) {
      return _then(_value.copyWith(plan: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$PartnerMembershipImplCopyWith<$Res>
    implements $PartnerMembershipCopyWith<$Res> {
  factory _$$PartnerMembershipImplCopyWith(
    _$PartnerMembershipImpl value,
    $Res Function(_$PartnerMembershipImpl) then,
  ) = __$$PartnerMembershipImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String userId,
    String planId,
    PartnerMembershipPlan plan,
    String startDate,
    String endDate,
    String status,
    int daysLeft,
  });

  @override
  $PartnerMembershipPlanCopyWith<$Res> get plan;
}

/// @nodoc
class __$$PartnerMembershipImplCopyWithImpl<$Res>
    extends _$PartnerMembershipCopyWithImpl<$Res, _$PartnerMembershipImpl>
    implements _$$PartnerMembershipImplCopyWith<$Res> {
  __$$PartnerMembershipImplCopyWithImpl(
    _$PartnerMembershipImpl _value,
    $Res Function(_$PartnerMembershipImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of PartnerMembership
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? planId = null,
    Object? plan = null,
    Object? startDate = null,
    Object? endDate = null,
    Object? status = null,
    Object? daysLeft = null,
  }) {
    return _then(
      _$PartnerMembershipImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        userId: null == userId
            ? _value.userId
            : userId // ignore: cast_nullable_to_non_nullable
                  as String,
        planId: null == planId
            ? _value.planId
            : planId // ignore: cast_nullable_to_non_nullable
                  as String,
        plan: null == plan
            ? _value.plan
            : plan // ignore: cast_nullable_to_non_nullable
                  as PartnerMembershipPlan,
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
        daysLeft: null == daysLeft
            ? _value.daysLeft
            : daysLeft // ignore: cast_nullable_to_non_nullable
                  as int,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$PartnerMembershipImpl implements _PartnerMembership {
  const _$PartnerMembershipImpl({
    required this.id,
    required this.userId,
    required this.planId,
    required this.plan,
    required this.startDate,
    required this.endDate,
    required this.status,
    required this.daysLeft,
  });

  factory _$PartnerMembershipImpl.fromJson(Map<String, dynamic> json) =>
      _$$PartnerMembershipImplFromJson(json);

  @override
  final String id;
  @override
  final String userId;
  @override
  final String planId;
  @override
  final PartnerMembershipPlan plan;
  @override
  final String startDate;
  @override
  final String endDate;
  @override
  final String status;
  @override
  final int daysLeft;

  @override
  String toString() {
    return 'PartnerMembership(id: $id, userId: $userId, planId: $planId, plan: $plan, startDate: $startDate, endDate: $endDate, status: $status, daysLeft: $daysLeft)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PartnerMembershipImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.planId, planId) || other.planId == planId) &&
            (identical(other.plan, plan) || other.plan == plan) &&
            (identical(other.startDate, startDate) ||
                other.startDate == startDate) &&
            (identical(other.endDate, endDate) || other.endDate == endDate) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.daysLeft, daysLeft) ||
                other.daysLeft == daysLeft));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    userId,
    planId,
    plan,
    startDate,
    endDate,
    status,
    daysLeft,
  );

  /// Create a copy of PartnerMembership
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PartnerMembershipImplCopyWith<_$PartnerMembershipImpl> get copyWith =>
      __$$PartnerMembershipImplCopyWithImpl<_$PartnerMembershipImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$PartnerMembershipImplToJson(this);
  }
}

abstract class _PartnerMembership implements PartnerMembership {
  const factory _PartnerMembership({
    required String id,
    required String userId,
    required String planId,
    required PartnerMembershipPlan plan,
    required String startDate,
    required String endDate,
    required String status,
    required int daysLeft,
  }) = _$PartnerMembershipImpl;

  factory _PartnerMembership.fromJson(Map<String, dynamic> json) =
      _$PartnerMembershipImpl.fromJson;

  @override
  String get id;
  @override
  String get userId;
  @override
  String get planId;
  @override
  PartnerMembershipPlan get plan;
  @override
  String get startDate;
  @override
  String get endDate;
  @override
  String get status;
  @override
  int get daysLeft;

  /// Create a copy of PartnerMembership
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PartnerMembershipImplCopyWith<_$PartnerMembershipImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
