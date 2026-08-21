// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'message_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

ConversationParticipant _$ConversationParticipantFromJson(
  Map<String, dynamic> json,
) {
  return _ConversationParticipant.fromJson(json);
}

/// @nodoc
mixin _$ConversationParticipant {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get role => throw _privateConstructorUsedError;

  /// Serializes this ConversationParticipant to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ConversationParticipant
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ConversationParticipantCopyWith<ConversationParticipant> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ConversationParticipantCopyWith<$Res> {
  factory $ConversationParticipantCopyWith(
    ConversationParticipant value,
    $Res Function(ConversationParticipant) then,
  ) = _$ConversationParticipantCopyWithImpl<$Res, ConversationParticipant>;
  @useResult
  $Res call({String id, String name, String role});
}

/// @nodoc
class _$ConversationParticipantCopyWithImpl<
  $Res,
  $Val extends ConversationParticipant
>
    implements $ConversationParticipantCopyWith<$Res> {
  _$ConversationParticipantCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ConversationParticipant
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? id = null, Object? name = null, Object? role = null}) {
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
            role: null == role
                ? _value.role
                : role // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$ConversationParticipantImplCopyWith<$Res>
    implements $ConversationParticipantCopyWith<$Res> {
  factory _$$ConversationParticipantImplCopyWith(
    _$ConversationParticipantImpl value,
    $Res Function(_$ConversationParticipantImpl) then,
  ) = __$$ConversationParticipantImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, String name, String role});
}

/// @nodoc
class __$$ConversationParticipantImplCopyWithImpl<$Res>
    extends
        _$ConversationParticipantCopyWithImpl<
          $Res,
          _$ConversationParticipantImpl
        >
    implements _$$ConversationParticipantImplCopyWith<$Res> {
  __$$ConversationParticipantImplCopyWithImpl(
    _$ConversationParticipantImpl _value,
    $Res Function(_$ConversationParticipantImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of ConversationParticipant
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? id = null, Object? name = null, Object? role = null}) {
    return _then(
      _$ConversationParticipantImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        role: null == role
            ? _value.role
            : role // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$ConversationParticipantImpl implements _ConversationParticipant {
  const _$ConversationParticipantImpl({
    required this.id,
    required this.name,
    required this.role,
  });

  factory _$ConversationParticipantImpl.fromJson(Map<String, dynamic> json) =>
      _$$ConversationParticipantImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String role;

  @override
  String toString() {
    return 'ConversationParticipant(id: $id, name: $name, role: $role)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ConversationParticipantImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.role, role) || other.role == role));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, role);

  /// Create a copy of ConversationParticipant
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ConversationParticipantImplCopyWith<_$ConversationParticipantImpl>
  get copyWith =>
      __$$ConversationParticipantImplCopyWithImpl<
        _$ConversationParticipantImpl
      >(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ConversationParticipantImplToJson(this);
  }
}

abstract class _ConversationParticipant implements ConversationParticipant {
  const factory _ConversationParticipant({
    required String id,
    required String name,
    required String role,
  }) = _$ConversationParticipantImpl;

  factory _ConversationParticipant.fromJson(Map<String, dynamic> json) =
      _$ConversationParticipantImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get role;

  /// Create a copy of ConversationParticipant
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ConversationParticipantImplCopyWith<_$ConversationParticipantImpl>
  get copyWith => throw _privateConstructorUsedError;
}

LastMessagePreview _$LastMessagePreviewFromJson(Map<String, dynamic> json) {
  return _LastMessagePreview.fromJson(json);
}

/// @nodoc
mixin _$LastMessagePreview {
  String? get content => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;
  String? get senderId => throw _privateConstructorUsedError;

  /// Serializes this LastMessagePreview to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of LastMessagePreview
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $LastMessagePreviewCopyWith<LastMessagePreview> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $LastMessagePreviewCopyWith<$Res> {
  factory $LastMessagePreviewCopyWith(
    LastMessagePreview value,
    $Res Function(LastMessagePreview) then,
  ) = _$LastMessagePreviewCopyWithImpl<$Res, LastMessagePreview>;
  @useResult
  $Res call({String? content, String createdAt, String? senderId});
}

/// @nodoc
class _$LastMessagePreviewCopyWithImpl<$Res, $Val extends LastMessagePreview>
    implements $LastMessagePreviewCopyWith<$Res> {
  _$LastMessagePreviewCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of LastMessagePreview
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? content = freezed,
    Object? createdAt = null,
    Object? senderId = freezed,
  }) {
    return _then(
      _value.copyWith(
            content: freezed == content
                ? _value.content
                : content // ignore: cast_nullable_to_non_nullable
                      as String?,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as String,
            senderId: freezed == senderId
                ? _value.senderId
                : senderId // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$LastMessagePreviewImplCopyWith<$Res>
    implements $LastMessagePreviewCopyWith<$Res> {
  factory _$$LastMessagePreviewImplCopyWith(
    _$LastMessagePreviewImpl value,
    $Res Function(_$LastMessagePreviewImpl) then,
  ) = __$$LastMessagePreviewImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String? content, String createdAt, String? senderId});
}

/// @nodoc
class __$$LastMessagePreviewImplCopyWithImpl<$Res>
    extends _$LastMessagePreviewCopyWithImpl<$Res, _$LastMessagePreviewImpl>
    implements _$$LastMessagePreviewImplCopyWith<$Res> {
  __$$LastMessagePreviewImplCopyWithImpl(
    _$LastMessagePreviewImpl _value,
    $Res Function(_$LastMessagePreviewImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of LastMessagePreview
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? content = freezed,
    Object? createdAt = null,
    Object? senderId = freezed,
  }) {
    return _then(
      _$LastMessagePreviewImpl(
        content: freezed == content
            ? _value.content
            : content // ignore: cast_nullable_to_non_nullable
                  as String?,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as String,
        senderId: freezed == senderId
            ? _value.senderId
            : senderId // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$LastMessagePreviewImpl implements _LastMessagePreview {
  const _$LastMessagePreviewImpl({
    this.content,
    required this.createdAt,
    this.senderId,
  });

  factory _$LastMessagePreviewImpl.fromJson(Map<String, dynamic> json) =>
      _$$LastMessagePreviewImplFromJson(json);

  @override
  final String? content;
  @override
  final String createdAt;
  @override
  final String? senderId;

  @override
  String toString() {
    return 'LastMessagePreview(content: $content, createdAt: $createdAt, senderId: $senderId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$LastMessagePreviewImpl &&
            (identical(other.content, content) || other.content == content) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.senderId, senderId) ||
                other.senderId == senderId));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, content, createdAt, senderId);

  /// Create a copy of LastMessagePreview
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$LastMessagePreviewImplCopyWith<_$LastMessagePreviewImpl> get copyWith =>
      __$$LastMessagePreviewImplCopyWithImpl<_$LastMessagePreviewImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$LastMessagePreviewImplToJson(this);
  }
}

abstract class _LastMessagePreview implements LastMessagePreview {
  const factory _LastMessagePreview({
    String? content,
    required String createdAt,
    String? senderId,
  }) = _$LastMessagePreviewImpl;

  factory _LastMessagePreview.fromJson(Map<String, dynamic> json) =
      _$LastMessagePreviewImpl.fromJson;

  @override
  String? get content;
  @override
  String get createdAt;
  @override
  String? get senderId;

  /// Create a copy of LastMessagePreview
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$LastMessagePreviewImplCopyWith<_$LastMessagePreviewImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ConversationModel _$ConversationModelFromJson(Map<String, dynamic> json) {
  return _ConversationModel.fromJson(json);
}

/// @nodoc
mixin _$ConversationModel {
  String get id => throw _privateConstructorUsedError;
  String? get subject => throw _privateConstructorUsedError;
  bool get isLocked => throw _privateConstructorUsedError;
  List<ConversationParticipant> get participants =>
      throw _privateConstructorUsedError;
  LastMessagePreview? get lastMessage => throw _privateConstructorUsedError;
  int get unreadCount => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;
  String get updatedAt => throw _privateConstructorUsedError;

  /// Serializes this ConversationModel to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ConversationModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ConversationModelCopyWith<ConversationModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ConversationModelCopyWith<$Res> {
  factory $ConversationModelCopyWith(
    ConversationModel value,
    $Res Function(ConversationModel) then,
  ) = _$ConversationModelCopyWithImpl<$Res, ConversationModel>;
  @useResult
  $Res call({
    String id,
    String? subject,
    bool isLocked,
    List<ConversationParticipant> participants,
    LastMessagePreview? lastMessage,
    int unreadCount,
    String createdAt,
    String updatedAt,
  });

  $LastMessagePreviewCopyWith<$Res>? get lastMessage;
}

/// @nodoc
class _$ConversationModelCopyWithImpl<$Res, $Val extends ConversationModel>
    implements $ConversationModelCopyWith<$Res> {
  _$ConversationModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ConversationModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? subject = freezed,
    Object? isLocked = null,
    Object? participants = null,
    Object? lastMessage = freezed,
    Object? unreadCount = null,
    Object? createdAt = null,
    Object? updatedAt = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            subject: freezed == subject
                ? _value.subject
                : subject // ignore: cast_nullable_to_non_nullable
                      as String?,
            isLocked: null == isLocked
                ? _value.isLocked
                : isLocked // ignore: cast_nullable_to_non_nullable
                      as bool,
            participants: null == participants
                ? _value.participants
                : participants // ignore: cast_nullable_to_non_nullable
                      as List<ConversationParticipant>,
            lastMessage: freezed == lastMessage
                ? _value.lastMessage
                : lastMessage // ignore: cast_nullable_to_non_nullable
                      as LastMessagePreview?,
            unreadCount: null == unreadCount
                ? _value.unreadCount
                : unreadCount // ignore: cast_nullable_to_non_nullable
                      as int,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as String,
            updatedAt: null == updatedAt
                ? _value.updatedAt
                : updatedAt // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }

  /// Create a copy of ConversationModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $LastMessagePreviewCopyWith<$Res>? get lastMessage {
    if (_value.lastMessage == null) {
      return null;
    }

    return $LastMessagePreviewCopyWith<$Res>(_value.lastMessage!, (value) {
      return _then(_value.copyWith(lastMessage: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$ConversationModelImplCopyWith<$Res>
    implements $ConversationModelCopyWith<$Res> {
  factory _$$ConversationModelImplCopyWith(
    _$ConversationModelImpl value,
    $Res Function(_$ConversationModelImpl) then,
  ) = __$$ConversationModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String? subject,
    bool isLocked,
    List<ConversationParticipant> participants,
    LastMessagePreview? lastMessage,
    int unreadCount,
    String createdAt,
    String updatedAt,
  });

  @override
  $LastMessagePreviewCopyWith<$Res>? get lastMessage;
}

/// @nodoc
class __$$ConversationModelImplCopyWithImpl<$Res>
    extends _$ConversationModelCopyWithImpl<$Res, _$ConversationModelImpl>
    implements _$$ConversationModelImplCopyWith<$Res> {
  __$$ConversationModelImplCopyWithImpl(
    _$ConversationModelImpl _value,
    $Res Function(_$ConversationModelImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of ConversationModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? subject = freezed,
    Object? isLocked = null,
    Object? participants = null,
    Object? lastMessage = freezed,
    Object? unreadCount = null,
    Object? createdAt = null,
    Object? updatedAt = null,
  }) {
    return _then(
      _$ConversationModelImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        subject: freezed == subject
            ? _value.subject
            : subject // ignore: cast_nullable_to_non_nullable
                  as String?,
        isLocked: null == isLocked
            ? _value.isLocked
            : isLocked // ignore: cast_nullable_to_non_nullable
                  as bool,
        participants: null == participants
            ? _value._participants
            : participants // ignore: cast_nullable_to_non_nullable
                  as List<ConversationParticipant>,
        lastMessage: freezed == lastMessage
            ? _value.lastMessage
            : lastMessage // ignore: cast_nullable_to_non_nullable
                  as LastMessagePreview?,
        unreadCount: null == unreadCount
            ? _value.unreadCount
            : unreadCount // ignore: cast_nullable_to_non_nullable
                  as int,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as String,
        updatedAt: null == updatedAt
            ? _value.updatedAt
            : updatedAt // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$ConversationModelImpl implements _ConversationModel {
  const _$ConversationModelImpl({
    required this.id,
    this.subject,
    this.isLocked = false,
    required List<ConversationParticipant> participants,
    this.lastMessage,
    required this.unreadCount,
    required this.createdAt,
    required this.updatedAt,
  }) : _participants = participants;

  factory _$ConversationModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$ConversationModelImplFromJson(json);

  @override
  final String id;
  @override
  final String? subject;
  @override
  @JsonKey()
  final bool isLocked;
  final List<ConversationParticipant> _participants;
  @override
  List<ConversationParticipant> get participants {
    if (_participants is EqualUnmodifiableListView) return _participants;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_participants);
  }

  @override
  final LastMessagePreview? lastMessage;
  @override
  final int unreadCount;
  @override
  final String createdAt;
  @override
  final String updatedAt;

  @override
  String toString() {
    return 'ConversationModel(id: $id, subject: $subject, isLocked: $isLocked, participants: $participants, lastMessage: $lastMessage, unreadCount: $unreadCount, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ConversationModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.subject, subject) || other.subject == subject) &&
            (identical(other.isLocked, isLocked) ||
                other.isLocked == isLocked) &&
            const DeepCollectionEquality().equals(
              other._participants,
              _participants,
            ) &&
            (identical(other.lastMessage, lastMessage) ||
                other.lastMessage == lastMessage) &&
            (identical(other.unreadCount, unreadCount) ||
                other.unreadCount == unreadCount) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    subject,
    isLocked,
    const DeepCollectionEquality().hash(_participants),
    lastMessage,
    unreadCount,
    createdAt,
    updatedAt,
  );

  /// Create a copy of ConversationModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ConversationModelImplCopyWith<_$ConversationModelImpl> get copyWith =>
      __$$ConversationModelImplCopyWithImpl<_$ConversationModelImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$ConversationModelImplToJson(this);
  }
}

abstract class _ConversationModel implements ConversationModel {
  const factory _ConversationModel({
    required String id,
    String? subject,
    bool isLocked,
    required List<ConversationParticipant> participants,
    LastMessagePreview? lastMessage,
    required int unreadCount,
    required String createdAt,
    required String updatedAt,
  }) = _$ConversationModelImpl;

  factory _ConversationModel.fromJson(Map<String, dynamic> json) =
      _$ConversationModelImpl.fromJson;

  @override
  String get id;
  @override
  String? get subject;
  @override
  bool get isLocked;
  @override
  List<ConversationParticipant> get participants;
  @override
  LastMessagePreview? get lastMessage;
  @override
  int get unreadCount;
  @override
  String get createdAt;
  @override
  String get updatedAt;

  /// Create a copy of ConversationModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ConversationModelImplCopyWith<_$ConversationModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

MessageAttachment _$MessageAttachmentFromJson(Map<String, dynamic> json) {
  return _MessageAttachment.fromJson(json);
}

/// @nodoc
mixin _$MessageAttachment {
  String get id => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String get fileName => throw _privateConstructorUsedError;
  String get mimeType => throw _privateConstructorUsedError;
  int get sizeBytes => throw _privateConstructorUsedError;
  int? get width => throw _privateConstructorUsedError;
  int? get height => throw _privateConstructorUsedError;

  /// Serializes this MessageAttachment to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of MessageAttachment
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $MessageAttachmentCopyWith<MessageAttachment> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $MessageAttachmentCopyWith<$Res> {
  factory $MessageAttachmentCopyWith(
    MessageAttachment value,
    $Res Function(MessageAttachment) then,
  ) = _$MessageAttachmentCopyWithImpl<$Res, MessageAttachment>;
  @useResult
  $Res call({
    String id,
    String type,
    String fileName,
    String mimeType,
    int sizeBytes,
    int? width,
    int? height,
  });
}

/// @nodoc
class _$MessageAttachmentCopyWithImpl<$Res, $Val extends MessageAttachment>
    implements $MessageAttachmentCopyWith<$Res> {
  _$MessageAttachmentCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of MessageAttachment
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? fileName = null,
    Object? mimeType = null,
    Object? sizeBytes = null,
    Object? width = freezed,
    Object? height = freezed,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            type: null == type
                ? _value.type
                : type // ignore: cast_nullable_to_non_nullable
                      as String,
            fileName: null == fileName
                ? _value.fileName
                : fileName // ignore: cast_nullable_to_non_nullable
                      as String,
            mimeType: null == mimeType
                ? _value.mimeType
                : mimeType // ignore: cast_nullable_to_non_nullable
                      as String,
            sizeBytes: null == sizeBytes
                ? _value.sizeBytes
                : sizeBytes // ignore: cast_nullable_to_non_nullable
                      as int,
            width: freezed == width
                ? _value.width
                : width // ignore: cast_nullable_to_non_nullable
                      as int?,
            height: freezed == height
                ? _value.height
                : height // ignore: cast_nullable_to_non_nullable
                      as int?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$MessageAttachmentImplCopyWith<$Res>
    implements $MessageAttachmentCopyWith<$Res> {
  factory _$$MessageAttachmentImplCopyWith(
    _$MessageAttachmentImpl value,
    $Res Function(_$MessageAttachmentImpl) then,
  ) = __$$MessageAttachmentImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String type,
    String fileName,
    String mimeType,
    int sizeBytes,
    int? width,
    int? height,
  });
}

/// @nodoc
class __$$MessageAttachmentImplCopyWithImpl<$Res>
    extends _$MessageAttachmentCopyWithImpl<$Res, _$MessageAttachmentImpl>
    implements _$$MessageAttachmentImplCopyWith<$Res> {
  __$$MessageAttachmentImplCopyWithImpl(
    _$MessageAttachmentImpl _value,
    $Res Function(_$MessageAttachmentImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of MessageAttachment
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? fileName = null,
    Object? mimeType = null,
    Object? sizeBytes = null,
    Object? width = freezed,
    Object? height = freezed,
  }) {
    return _then(
      _$MessageAttachmentImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        type: null == type
            ? _value.type
            : type // ignore: cast_nullable_to_non_nullable
                  as String,
        fileName: null == fileName
            ? _value.fileName
            : fileName // ignore: cast_nullable_to_non_nullable
                  as String,
        mimeType: null == mimeType
            ? _value.mimeType
            : mimeType // ignore: cast_nullable_to_non_nullable
                  as String,
        sizeBytes: null == sizeBytes
            ? _value.sizeBytes
            : sizeBytes // ignore: cast_nullable_to_non_nullable
                  as int,
        width: freezed == width
            ? _value.width
            : width // ignore: cast_nullable_to_non_nullable
                  as int?,
        height: freezed == height
            ? _value.height
            : height // ignore: cast_nullable_to_non_nullable
                  as int?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$MessageAttachmentImpl implements _MessageAttachment {
  const _$MessageAttachmentImpl({
    required this.id,
    required this.type,
    required this.fileName,
    required this.mimeType,
    required this.sizeBytes,
    this.width,
    this.height,
  });

  factory _$MessageAttachmentImpl.fromJson(Map<String, dynamic> json) =>
      _$$MessageAttachmentImplFromJson(json);

  @override
  final String id;
  @override
  final String type;
  @override
  final String fileName;
  @override
  final String mimeType;
  @override
  final int sizeBytes;
  @override
  final int? width;
  @override
  final int? height;

  @override
  String toString() {
    return 'MessageAttachment(id: $id, type: $type, fileName: $fileName, mimeType: $mimeType, sizeBytes: $sizeBytes, width: $width, height: $height)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MessageAttachmentImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.fileName, fileName) ||
                other.fileName == fileName) &&
            (identical(other.mimeType, mimeType) ||
                other.mimeType == mimeType) &&
            (identical(other.sizeBytes, sizeBytes) ||
                other.sizeBytes == sizeBytes) &&
            (identical(other.width, width) || other.width == width) &&
            (identical(other.height, height) || other.height == height));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    type,
    fileName,
    mimeType,
    sizeBytes,
    width,
    height,
  );

  /// Create a copy of MessageAttachment
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MessageAttachmentImplCopyWith<_$MessageAttachmentImpl> get copyWith =>
      __$$MessageAttachmentImplCopyWithImpl<_$MessageAttachmentImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$MessageAttachmentImplToJson(this);
  }
}

abstract class _MessageAttachment implements MessageAttachment {
  const factory _MessageAttachment({
    required String id,
    required String type,
    required String fileName,
    required String mimeType,
    required int sizeBytes,
    int? width,
    int? height,
  }) = _$MessageAttachmentImpl;

  factory _MessageAttachment.fromJson(Map<String, dynamic> json) =
      _$MessageAttachmentImpl.fromJson;

  @override
  String get id;
  @override
  String get type;
  @override
  String get fileName;
  @override
  String get mimeType;
  @override
  int get sizeBytes;
  @override
  int? get width;
  @override
  int? get height;

  /// Create a copy of MessageAttachment
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MessageAttachmentImplCopyWith<_$MessageAttachmentImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

MessageReceipt _$MessageReceiptFromJson(Map<String, dynamic> json) {
  return _MessageReceipt.fromJson(json);
}

/// @nodoc
mixin _$MessageReceipt {
  String get userId => throw _privateConstructorUsedError;
  String? get deliveredAt => throw _privateConstructorUsedError;
  String? get readAt => throw _privateConstructorUsedError;

  /// Serializes this MessageReceipt to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of MessageReceipt
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $MessageReceiptCopyWith<MessageReceipt> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $MessageReceiptCopyWith<$Res> {
  factory $MessageReceiptCopyWith(
    MessageReceipt value,
    $Res Function(MessageReceipt) then,
  ) = _$MessageReceiptCopyWithImpl<$Res, MessageReceipt>;
  @useResult
  $Res call({String userId, String? deliveredAt, String? readAt});
}

/// @nodoc
class _$MessageReceiptCopyWithImpl<$Res, $Val extends MessageReceipt>
    implements $MessageReceiptCopyWith<$Res> {
  _$MessageReceiptCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of MessageReceipt
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? userId = null,
    Object? deliveredAt = freezed,
    Object? readAt = freezed,
  }) {
    return _then(
      _value.copyWith(
            userId: null == userId
                ? _value.userId
                : userId // ignore: cast_nullable_to_non_nullable
                      as String,
            deliveredAt: freezed == deliveredAt
                ? _value.deliveredAt
                : deliveredAt // ignore: cast_nullable_to_non_nullable
                      as String?,
            readAt: freezed == readAt
                ? _value.readAt
                : readAt // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$MessageReceiptImplCopyWith<$Res>
    implements $MessageReceiptCopyWith<$Res> {
  factory _$$MessageReceiptImplCopyWith(
    _$MessageReceiptImpl value,
    $Res Function(_$MessageReceiptImpl) then,
  ) = __$$MessageReceiptImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String userId, String? deliveredAt, String? readAt});
}

/// @nodoc
class __$$MessageReceiptImplCopyWithImpl<$Res>
    extends _$MessageReceiptCopyWithImpl<$Res, _$MessageReceiptImpl>
    implements _$$MessageReceiptImplCopyWith<$Res> {
  __$$MessageReceiptImplCopyWithImpl(
    _$MessageReceiptImpl _value,
    $Res Function(_$MessageReceiptImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of MessageReceipt
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? userId = null,
    Object? deliveredAt = freezed,
    Object? readAt = freezed,
  }) {
    return _then(
      _$MessageReceiptImpl(
        userId: null == userId
            ? _value.userId
            : userId // ignore: cast_nullable_to_non_nullable
                  as String,
        deliveredAt: freezed == deliveredAt
            ? _value.deliveredAt
            : deliveredAt // ignore: cast_nullable_to_non_nullable
                  as String?,
        readAt: freezed == readAt
            ? _value.readAt
            : readAt // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$MessageReceiptImpl implements _MessageReceipt {
  const _$MessageReceiptImpl({
    required this.userId,
    this.deliveredAt,
    this.readAt,
  });

  factory _$MessageReceiptImpl.fromJson(Map<String, dynamic> json) =>
      _$$MessageReceiptImplFromJson(json);

  @override
  final String userId;
  @override
  final String? deliveredAt;
  @override
  final String? readAt;

  @override
  String toString() {
    return 'MessageReceipt(userId: $userId, deliveredAt: $deliveredAt, readAt: $readAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MessageReceiptImpl &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.deliveredAt, deliveredAt) ||
                other.deliveredAt == deliveredAt) &&
            (identical(other.readAt, readAt) || other.readAt == readAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, userId, deliveredAt, readAt);

  /// Create a copy of MessageReceipt
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MessageReceiptImplCopyWith<_$MessageReceiptImpl> get copyWith =>
      __$$MessageReceiptImplCopyWithImpl<_$MessageReceiptImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$MessageReceiptImplToJson(this);
  }
}

abstract class _MessageReceipt implements MessageReceipt {
  const factory _MessageReceipt({
    required String userId,
    String? deliveredAt,
    String? readAt,
  }) = _$MessageReceiptImpl;

  factory _MessageReceipt.fromJson(Map<String, dynamic> json) =
      _$MessageReceiptImpl.fromJson;

  @override
  String get userId;
  @override
  String? get deliveredAt;
  @override
  String? get readAt;

  /// Create a copy of MessageReceipt
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MessageReceiptImplCopyWith<_$MessageReceiptImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

MessageReaction _$MessageReactionFromJson(Map<String, dynamic> json) {
  return _MessageReaction.fromJson(json);
}

/// @nodoc
mixin _$MessageReaction {
  String get emoji => throw _privateConstructorUsedError;
  String get userId => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;

  /// Serializes this MessageReaction to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of MessageReaction
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $MessageReactionCopyWith<MessageReaction> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $MessageReactionCopyWith<$Res> {
  factory $MessageReactionCopyWith(
    MessageReaction value,
    $Res Function(MessageReaction) then,
  ) = _$MessageReactionCopyWithImpl<$Res, MessageReaction>;
  @useResult
  $Res call({String emoji, String userId, String createdAt});
}

/// @nodoc
class _$MessageReactionCopyWithImpl<$Res, $Val extends MessageReaction>
    implements $MessageReactionCopyWith<$Res> {
  _$MessageReactionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of MessageReaction
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? emoji = null,
    Object? userId = null,
    Object? createdAt = null,
  }) {
    return _then(
      _value.copyWith(
            emoji: null == emoji
                ? _value.emoji
                : emoji // ignore: cast_nullable_to_non_nullable
                      as String,
            userId: null == userId
                ? _value.userId
                : userId // ignore: cast_nullable_to_non_nullable
                      as String,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$MessageReactionImplCopyWith<$Res>
    implements $MessageReactionCopyWith<$Res> {
  factory _$$MessageReactionImplCopyWith(
    _$MessageReactionImpl value,
    $Res Function(_$MessageReactionImpl) then,
  ) = __$$MessageReactionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String emoji, String userId, String createdAt});
}

/// @nodoc
class __$$MessageReactionImplCopyWithImpl<$Res>
    extends _$MessageReactionCopyWithImpl<$Res, _$MessageReactionImpl>
    implements _$$MessageReactionImplCopyWith<$Res> {
  __$$MessageReactionImplCopyWithImpl(
    _$MessageReactionImpl _value,
    $Res Function(_$MessageReactionImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of MessageReaction
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? emoji = null,
    Object? userId = null,
    Object? createdAt = null,
  }) {
    return _then(
      _$MessageReactionImpl(
        emoji: null == emoji
            ? _value.emoji
            : emoji // ignore: cast_nullable_to_non_nullable
                  as String,
        userId: null == userId
            ? _value.userId
            : userId // ignore: cast_nullable_to_non_nullable
                  as String,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$MessageReactionImpl implements _MessageReaction {
  const _$MessageReactionImpl({
    required this.emoji,
    required this.userId,
    required this.createdAt,
  });

  factory _$MessageReactionImpl.fromJson(Map<String, dynamic> json) =>
      _$$MessageReactionImplFromJson(json);

  @override
  final String emoji;
  @override
  final String userId;
  @override
  final String createdAt;

  @override
  String toString() {
    return 'MessageReaction(emoji: $emoji, userId: $userId, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MessageReactionImpl &&
            (identical(other.emoji, emoji) || other.emoji == emoji) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, emoji, userId, createdAt);

  /// Create a copy of MessageReaction
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MessageReactionImplCopyWith<_$MessageReactionImpl> get copyWith =>
      __$$MessageReactionImplCopyWithImpl<_$MessageReactionImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$MessageReactionImplToJson(this);
  }
}

abstract class _MessageReaction implements MessageReaction {
  const factory _MessageReaction({
    required String emoji,
    required String userId,
    required String createdAt,
  }) = _$MessageReactionImpl;

  factory _MessageReaction.fromJson(Map<String, dynamic> json) =
      _$MessageReactionImpl.fromJson;

  @override
  String get emoji;
  @override
  String get userId;
  @override
  String get createdAt;

  /// Create a copy of MessageReaction
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MessageReactionImplCopyWith<_$MessageReactionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

MessageModel _$MessageModelFromJson(Map<String, dynamic> json) {
  return _MessageModel.fromJson(json);
}

/// @nodoc
mixin _$MessageModel {
  String get id => throw _privateConstructorUsedError;
  String get conversationId => throw _privateConstructorUsedError;
  String? get senderId => throw _privateConstructorUsedError;
  String? get senderName => throw _privateConstructorUsedError;
  String? get senderImage => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String? get content => throw _privateConstructorUsedError;
  String? get replyToId => throw _privateConstructorUsedError;
  String? get editedAt => throw _privateConstructorUsedError;
  String? get deletedAt => throw _privateConstructorUsedError;
  List<MessageAttachment> get attachments => throw _privateConstructorUsedError;
  List<MessageReceipt> get receipts => throw _privateConstructorUsedError;
  List<MessageReaction> get reactions => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;

  /// Serializes this MessageModel to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of MessageModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $MessageModelCopyWith<MessageModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $MessageModelCopyWith<$Res> {
  factory $MessageModelCopyWith(
    MessageModel value,
    $Res Function(MessageModel) then,
  ) = _$MessageModelCopyWithImpl<$Res, MessageModel>;
  @useResult
  $Res call({
    String id,
    String conversationId,
    String? senderId,
    String? senderName,
    String? senderImage,
    String type,
    String? content,
    String? replyToId,
    String? editedAt,
    String? deletedAt,
    List<MessageAttachment> attachments,
    List<MessageReceipt> receipts,
    List<MessageReaction> reactions,
    String createdAt,
  });
}

/// @nodoc
class _$MessageModelCopyWithImpl<$Res, $Val extends MessageModel>
    implements $MessageModelCopyWith<$Res> {
  _$MessageModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of MessageModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? conversationId = null,
    Object? senderId = freezed,
    Object? senderName = freezed,
    Object? senderImage = freezed,
    Object? type = null,
    Object? content = freezed,
    Object? replyToId = freezed,
    Object? editedAt = freezed,
    Object? deletedAt = freezed,
    Object? attachments = null,
    Object? receipts = null,
    Object? reactions = null,
    Object? createdAt = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            conversationId: null == conversationId
                ? _value.conversationId
                : conversationId // ignore: cast_nullable_to_non_nullable
                      as String,
            senderId: freezed == senderId
                ? _value.senderId
                : senderId // ignore: cast_nullable_to_non_nullable
                      as String?,
            senderName: freezed == senderName
                ? _value.senderName
                : senderName // ignore: cast_nullable_to_non_nullable
                      as String?,
            senderImage: freezed == senderImage
                ? _value.senderImage
                : senderImage // ignore: cast_nullable_to_non_nullable
                      as String?,
            type: null == type
                ? _value.type
                : type // ignore: cast_nullable_to_non_nullable
                      as String,
            content: freezed == content
                ? _value.content
                : content // ignore: cast_nullable_to_non_nullable
                      as String?,
            replyToId: freezed == replyToId
                ? _value.replyToId
                : replyToId // ignore: cast_nullable_to_non_nullable
                      as String?,
            editedAt: freezed == editedAt
                ? _value.editedAt
                : editedAt // ignore: cast_nullable_to_non_nullable
                      as String?,
            deletedAt: freezed == deletedAt
                ? _value.deletedAt
                : deletedAt // ignore: cast_nullable_to_non_nullable
                      as String?,
            attachments: null == attachments
                ? _value.attachments
                : attachments // ignore: cast_nullable_to_non_nullable
                      as List<MessageAttachment>,
            receipts: null == receipts
                ? _value.receipts
                : receipts // ignore: cast_nullable_to_non_nullable
                      as List<MessageReceipt>,
            reactions: null == reactions
                ? _value.reactions
                : reactions // ignore: cast_nullable_to_non_nullable
                      as List<MessageReaction>,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$MessageModelImplCopyWith<$Res>
    implements $MessageModelCopyWith<$Res> {
  factory _$$MessageModelImplCopyWith(
    _$MessageModelImpl value,
    $Res Function(_$MessageModelImpl) then,
  ) = __$$MessageModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String conversationId,
    String? senderId,
    String? senderName,
    String? senderImage,
    String type,
    String? content,
    String? replyToId,
    String? editedAt,
    String? deletedAt,
    List<MessageAttachment> attachments,
    List<MessageReceipt> receipts,
    List<MessageReaction> reactions,
    String createdAt,
  });
}

/// @nodoc
class __$$MessageModelImplCopyWithImpl<$Res>
    extends _$MessageModelCopyWithImpl<$Res, _$MessageModelImpl>
    implements _$$MessageModelImplCopyWith<$Res> {
  __$$MessageModelImplCopyWithImpl(
    _$MessageModelImpl _value,
    $Res Function(_$MessageModelImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of MessageModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? conversationId = null,
    Object? senderId = freezed,
    Object? senderName = freezed,
    Object? senderImage = freezed,
    Object? type = null,
    Object? content = freezed,
    Object? replyToId = freezed,
    Object? editedAt = freezed,
    Object? deletedAt = freezed,
    Object? attachments = null,
    Object? receipts = null,
    Object? reactions = null,
    Object? createdAt = null,
  }) {
    return _then(
      _$MessageModelImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        conversationId: null == conversationId
            ? _value.conversationId
            : conversationId // ignore: cast_nullable_to_non_nullable
                  as String,
        senderId: freezed == senderId
            ? _value.senderId
            : senderId // ignore: cast_nullable_to_non_nullable
                  as String?,
        senderName: freezed == senderName
            ? _value.senderName
            : senderName // ignore: cast_nullable_to_non_nullable
                  as String?,
        senderImage: freezed == senderImage
            ? _value.senderImage
            : senderImage // ignore: cast_nullable_to_non_nullable
                  as String?,
        type: null == type
            ? _value.type
            : type // ignore: cast_nullable_to_non_nullable
                  as String,
        content: freezed == content
            ? _value.content
            : content // ignore: cast_nullable_to_non_nullable
                  as String?,
        replyToId: freezed == replyToId
            ? _value.replyToId
            : replyToId // ignore: cast_nullable_to_non_nullable
                  as String?,
        editedAt: freezed == editedAt
            ? _value.editedAt
            : editedAt // ignore: cast_nullable_to_non_nullable
                  as String?,
        deletedAt: freezed == deletedAt
            ? _value.deletedAt
            : deletedAt // ignore: cast_nullable_to_non_nullable
                  as String?,
        attachments: null == attachments
            ? _value._attachments
            : attachments // ignore: cast_nullable_to_non_nullable
                  as List<MessageAttachment>,
        receipts: null == receipts
            ? _value._receipts
            : receipts // ignore: cast_nullable_to_non_nullable
                  as List<MessageReceipt>,
        reactions: null == reactions
            ? _value._reactions
            : reactions // ignore: cast_nullable_to_non_nullable
                  as List<MessageReaction>,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$MessageModelImpl implements _MessageModel {
  const _$MessageModelImpl({
    required this.id,
    required this.conversationId,
    this.senderId,
    this.senderName,
    this.senderImage,
    this.type = 'TEXT',
    this.content,
    this.replyToId,
    this.editedAt,
    this.deletedAt,
    List<MessageAttachment> attachments = const [],
    List<MessageReceipt> receipts = const [],
    List<MessageReaction> reactions = const [],
    required this.createdAt,
  }) : _attachments = attachments,
       _receipts = receipts,
       _reactions = reactions;

  factory _$MessageModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$MessageModelImplFromJson(json);

  @override
  final String id;
  @override
  final String conversationId;
  @override
  final String? senderId;
  @override
  final String? senderName;
  @override
  final String? senderImage;
  @override
  @JsonKey()
  final String type;
  @override
  final String? content;
  @override
  final String? replyToId;
  @override
  final String? editedAt;
  @override
  final String? deletedAt;
  final List<MessageAttachment> _attachments;
  @override
  @JsonKey()
  List<MessageAttachment> get attachments {
    if (_attachments is EqualUnmodifiableListView) return _attachments;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_attachments);
  }

  final List<MessageReceipt> _receipts;
  @override
  @JsonKey()
  List<MessageReceipt> get receipts {
    if (_receipts is EqualUnmodifiableListView) return _receipts;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_receipts);
  }

  final List<MessageReaction> _reactions;
  @override
  @JsonKey()
  List<MessageReaction> get reactions {
    if (_reactions is EqualUnmodifiableListView) return _reactions;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_reactions);
  }

  @override
  final String createdAt;

  @override
  String toString() {
    return 'MessageModel(id: $id, conversationId: $conversationId, senderId: $senderId, senderName: $senderName, senderImage: $senderImage, type: $type, content: $content, replyToId: $replyToId, editedAt: $editedAt, deletedAt: $deletedAt, attachments: $attachments, receipts: $receipts, reactions: $reactions, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MessageModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.conversationId, conversationId) ||
                other.conversationId == conversationId) &&
            (identical(other.senderId, senderId) ||
                other.senderId == senderId) &&
            (identical(other.senderName, senderName) ||
                other.senderName == senderName) &&
            (identical(other.senderImage, senderImage) ||
                other.senderImage == senderImage) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.content, content) || other.content == content) &&
            (identical(other.replyToId, replyToId) ||
                other.replyToId == replyToId) &&
            (identical(other.editedAt, editedAt) ||
                other.editedAt == editedAt) &&
            (identical(other.deletedAt, deletedAt) ||
                other.deletedAt == deletedAt) &&
            const DeepCollectionEquality().equals(
              other._attachments,
              _attachments,
            ) &&
            const DeepCollectionEquality().equals(other._receipts, _receipts) &&
            const DeepCollectionEquality().equals(
              other._reactions,
              _reactions,
            ) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    conversationId,
    senderId,
    senderName,
    senderImage,
    type,
    content,
    replyToId,
    editedAt,
    deletedAt,
    const DeepCollectionEquality().hash(_attachments),
    const DeepCollectionEquality().hash(_receipts),
    const DeepCollectionEquality().hash(_reactions),
    createdAt,
  );

  /// Create a copy of MessageModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MessageModelImplCopyWith<_$MessageModelImpl> get copyWith =>
      __$$MessageModelImplCopyWithImpl<_$MessageModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$MessageModelImplToJson(this);
  }
}

abstract class _MessageModel implements MessageModel {
  const factory _MessageModel({
    required String id,
    required String conversationId,
    String? senderId,
    String? senderName,
    String? senderImage,
    String type,
    String? content,
    String? replyToId,
    String? editedAt,
    String? deletedAt,
    List<MessageAttachment> attachments,
    List<MessageReceipt> receipts,
    List<MessageReaction> reactions,
    required String createdAt,
  }) = _$MessageModelImpl;

  factory _MessageModel.fromJson(Map<String, dynamic> json) =
      _$MessageModelImpl.fromJson;

  @override
  String get id;
  @override
  String get conversationId;
  @override
  String? get senderId;
  @override
  String? get senderName;
  @override
  String? get senderImage;
  @override
  String get type;
  @override
  String? get content;
  @override
  String? get replyToId;
  @override
  String? get editedAt;
  @override
  String? get deletedAt;
  @override
  List<MessageAttachment> get attachments;
  @override
  List<MessageReceipt> get receipts;
  @override
  List<MessageReaction> get reactions;
  @override
  String get createdAt;

  /// Create a copy of MessageModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MessageModelImplCopyWith<_$MessageModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
