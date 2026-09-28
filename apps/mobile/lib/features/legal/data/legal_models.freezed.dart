// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'legal_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

CurrentLegalDocument _$CurrentLegalDocumentFromJson(Map<String, dynamic> json) {
  return _CurrentLegalDocument.fromJson(json);
}

/// @nodoc
mixin _$CurrentLegalDocument {
  String get documentId => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get versionId => throw _privateConstructorUsedError;
  int get version => throw _privateConstructorUsedError;
  String get content => throw _privateConstructorUsedError;
  String get publishedAt => throw _privateConstructorUsedError;

  /// Serializes this CurrentLegalDocument to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CurrentLegalDocument
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CurrentLegalDocumentCopyWith<CurrentLegalDocument> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CurrentLegalDocumentCopyWith<$Res> {
  factory $CurrentLegalDocumentCopyWith(
    CurrentLegalDocument value,
    $Res Function(CurrentLegalDocument) then,
  ) = _$CurrentLegalDocumentCopyWithImpl<$Res, CurrentLegalDocument>;
  @useResult
  $Res call({
    String documentId,
    String type,
    String title,
    String versionId,
    int version,
    String content,
    String publishedAt,
  });
}

/// @nodoc
class _$CurrentLegalDocumentCopyWithImpl<
  $Res,
  $Val extends CurrentLegalDocument
>
    implements $CurrentLegalDocumentCopyWith<$Res> {
  _$CurrentLegalDocumentCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CurrentLegalDocument
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? documentId = null,
    Object? type = null,
    Object? title = null,
    Object? versionId = null,
    Object? version = null,
    Object? content = null,
    Object? publishedAt = null,
  }) {
    return _then(
      _value.copyWith(
            documentId: null == documentId
                ? _value.documentId
                : documentId // ignore: cast_nullable_to_non_nullable
                      as String,
            type: null == type
                ? _value.type
                : type // ignore: cast_nullable_to_non_nullable
                      as String,
            title: null == title
                ? _value.title
                : title // ignore: cast_nullable_to_non_nullable
                      as String,
            versionId: null == versionId
                ? _value.versionId
                : versionId // ignore: cast_nullable_to_non_nullable
                      as String,
            version: null == version
                ? _value.version
                : version // ignore: cast_nullable_to_non_nullable
                      as int,
            content: null == content
                ? _value.content
                : content // ignore: cast_nullable_to_non_nullable
                      as String,
            publishedAt: null == publishedAt
                ? _value.publishedAt
                : publishedAt // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$CurrentLegalDocumentImplCopyWith<$Res>
    implements $CurrentLegalDocumentCopyWith<$Res> {
  factory _$$CurrentLegalDocumentImplCopyWith(
    _$CurrentLegalDocumentImpl value,
    $Res Function(_$CurrentLegalDocumentImpl) then,
  ) = __$$CurrentLegalDocumentImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String documentId,
    String type,
    String title,
    String versionId,
    int version,
    String content,
    String publishedAt,
  });
}

/// @nodoc
class __$$CurrentLegalDocumentImplCopyWithImpl<$Res>
    extends _$CurrentLegalDocumentCopyWithImpl<$Res, _$CurrentLegalDocumentImpl>
    implements _$$CurrentLegalDocumentImplCopyWith<$Res> {
  __$$CurrentLegalDocumentImplCopyWithImpl(
    _$CurrentLegalDocumentImpl _value,
    $Res Function(_$CurrentLegalDocumentImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of CurrentLegalDocument
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? documentId = null,
    Object? type = null,
    Object? title = null,
    Object? versionId = null,
    Object? version = null,
    Object? content = null,
    Object? publishedAt = null,
  }) {
    return _then(
      _$CurrentLegalDocumentImpl(
        documentId: null == documentId
            ? _value.documentId
            : documentId // ignore: cast_nullable_to_non_nullable
                  as String,
        type: null == type
            ? _value.type
            : type // ignore: cast_nullable_to_non_nullable
                  as String,
        title: null == title
            ? _value.title
            : title // ignore: cast_nullable_to_non_nullable
                  as String,
        versionId: null == versionId
            ? _value.versionId
            : versionId // ignore: cast_nullable_to_non_nullable
                  as String,
        version: null == version
            ? _value.version
            : version // ignore: cast_nullable_to_non_nullable
                  as int,
        content: null == content
            ? _value.content
            : content // ignore: cast_nullable_to_non_nullable
                  as String,
        publishedAt: null == publishedAt
            ? _value.publishedAt
            : publishedAt // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$CurrentLegalDocumentImpl implements _CurrentLegalDocument {
  const _$CurrentLegalDocumentImpl({
    required this.documentId,
    required this.type,
    required this.title,
    required this.versionId,
    required this.version,
    required this.content,
    required this.publishedAt,
  });

  factory _$CurrentLegalDocumentImpl.fromJson(Map<String, dynamic> json) =>
      _$$CurrentLegalDocumentImplFromJson(json);

  @override
  final String documentId;
  @override
  final String type;
  @override
  final String title;
  @override
  final String versionId;
  @override
  final int version;
  @override
  final String content;
  @override
  final String publishedAt;

  @override
  String toString() {
    return 'CurrentLegalDocument(documentId: $documentId, type: $type, title: $title, versionId: $versionId, version: $version, content: $content, publishedAt: $publishedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CurrentLegalDocumentImpl &&
            (identical(other.documentId, documentId) ||
                other.documentId == documentId) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.versionId, versionId) ||
                other.versionId == versionId) &&
            (identical(other.version, version) || other.version == version) &&
            (identical(other.content, content) || other.content == content) &&
            (identical(other.publishedAt, publishedAt) ||
                other.publishedAt == publishedAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    documentId,
    type,
    title,
    versionId,
    version,
    content,
    publishedAt,
  );

  /// Create a copy of CurrentLegalDocument
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CurrentLegalDocumentImplCopyWith<_$CurrentLegalDocumentImpl>
  get copyWith =>
      __$$CurrentLegalDocumentImplCopyWithImpl<_$CurrentLegalDocumentImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$CurrentLegalDocumentImplToJson(this);
  }
}

abstract class _CurrentLegalDocument implements CurrentLegalDocument {
  const factory _CurrentLegalDocument({
    required final String documentId,
    required final String type,
    required final String title,
    required final String versionId,
    required final int version,
    required final String content,
    required final String publishedAt,
  }) = _$CurrentLegalDocumentImpl;

  factory _CurrentLegalDocument.fromJson(Map<String, dynamic> json) =
      _$CurrentLegalDocumentImpl.fromJson;

  @override
  String get documentId;
  @override
  String get type;
  @override
  String get title;
  @override
  String get versionId;
  @override
  int get version;
  @override
  String get content;
  @override
  String get publishedAt;

  /// Create a copy of CurrentLegalDocument
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CurrentLegalDocumentImplCopyWith<_$CurrentLegalDocumentImpl>
  get copyWith => throw _privateConstructorUsedError;
}

CurrentLegalDocuments _$CurrentLegalDocumentsFromJson(
  Map<String, dynamic> json,
) {
  return _CurrentLegalDocuments.fromJson(json);
}

/// @nodoc
mixin _$CurrentLegalDocuments {
  List<CurrentLegalDocument> get documents =>
      throw _privateConstructorUsedError;
  List<String> get versionIds => throw _privateConstructorUsedError;

  /// Serializes this CurrentLegalDocuments to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CurrentLegalDocuments
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CurrentLegalDocumentsCopyWith<CurrentLegalDocuments> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CurrentLegalDocumentsCopyWith<$Res> {
  factory $CurrentLegalDocumentsCopyWith(
    CurrentLegalDocuments value,
    $Res Function(CurrentLegalDocuments) then,
  ) = _$CurrentLegalDocumentsCopyWithImpl<$Res, CurrentLegalDocuments>;
  @useResult
  $Res call({List<CurrentLegalDocument> documents, List<String> versionIds});
}

/// @nodoc
class _$CurrentLegalDocumentsCopyWithImpl<
  $Res,
  $Val extends CurrentLegalDocuments
>
    implements $CurrentLegalDocumentsCopyWith<$Res> {
  _$CurrentLegalDocumentsCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CurrentLegalDocuments
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? documents = null, Object? versionIds = null}) {
    return _then(
      _value.copyWith(
            documents: null == documents
                ? _value.documents
                : documents // ignore: cast_nullable_to_non_nullable
                      as List<CurrentLegalDocument>,
            versionIds: null == versionIds
                ? _value.versionIds
                : versionIds // ignore: cast_nullable_to_non_nullable
                      as List<String>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$CurrentLegalDocumentsImplCopyWith<$Res>
    implements $CurrentLegalDocumentsCopyWith<$Res> {
  factory _$$CurrentLegalDocumentsImplCopyWith(
    _$CurrentLegalDocumentsImpl value,
    $Res Function(_$CurrentLegalDocumentsImpl) then,
  ) = __$$CurrentLegalDocumentsImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({List<CurrentLegalDocument> documents, List<String> versionIds});
}

/// @nodoc
class __$$CurrentLegalDocumentsImplCopyWithImpl<$Res>
    extends
        _$CurrentLegalDocumentsCopyWithImpl<$Res, _$CurrentLegalDocumentsImpl>
    implements _$$CurrentLegalDocumentsImplCopyWith<$Res> {
  __$$CurrentLegalDocumentsImplCopyWithImpl(
    _$CurrentLegalDocumentsImpl _value,
    $Res Function(_$CurrentLegalDocumentsImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of CurrentLegalDocuments
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? documents = null, Object? versionIds = null}) {
    return _then(
      _$CurrentLegalDocumentsImpl(
        documents: null == documents
            ? _value._documents
            : documents // ignore: cast_nullable_to_non_nullable
                  as List<CurrentLegalDocument>,
        versionIds: null == versionIds
            ? _value._versionIds
            : versionIds // ignore: cast_nullable_to_non_nullable
                  as List<String>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$CurrentLegalDocumentsImpl implements _CurrentLegalDocuments {
  const _$CurrentLegalDocumentsImpl({
    required final List<CurrentLegalDocument> documents,
    required final List<String> versionIds,
  }) : _documents = documents,
       _versionIds = versionIds;

  factory _$CurrentLegalDocumentsImpl.fromJson(Map<String, dynamic> json) =>
      _$$CurrentLegalDocumentsImplFromJson(json);

  final List<CurrentLegalDocument> _documents;
  @override
  List<CurrentLegalDocument> get documents {
    if (_documents is EqualUnmodifiableListView) return _documents;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_documents);
  }

  final List<String> _versionIds;
  @override
  List<String> get versionIds {
    if (_versionIds is EqualUnmodifiableListView) return _versionIds;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_versionIds);
  }

  @override
  String toString() {
    return 'CurrentLegalDocuments(documents: $documents, versionIds: $versionIds)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CurrentLegalDocumentsImpl &&
            const DeepCollectionEquality().equals(
              other._documents,
              _documents,
            ) &&
            const DeepCollectionEquality().equals(
              other._versionIds,
              _versionIds,
            ));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    const DeepCollectionEquality().hash(_documents),
    const DeepCollectionEquality().hash(_versionIds),
  );

  /// Create a copy of CurrentLegalDocuments
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CurrentLegalDocumentsImplCopyWith<_$CurrentLegalDocumentsImpl>
  get copyWith =>
      __$$CurrentLegalDocumentsImplCopyWithImpl<_$CurrentLegalDocumentsImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$CurrentLegalDocumentsImplToJson(this);
  }
}

abstract class _CurrentLegalDocuments implements CurrentLegalDocuments {
  const factory _CurrentLegalDocuments({
    required final List<CurrentLegalDocument> documents,
    required final List<String> versionIds,
  }) = _$CurrentLegalDocumentsImpl;

  factory _CurrentLegalDocuments.fromJson(Map<String, dynamic> json) =
      _$CurrentLegalDocumentsImpl.fromJson;

  @override
  List<CurrentLegalDocument> get documents;
  @override
  List<String> get versionIds;

  /// Create a copy of CurrentLegalDocuments
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CurrentLegalDocumentsImplCopyWith<_$CurrentLegalDocumentsImpl>
  get copyWith => throw _privateConstructorUsedError;
}
