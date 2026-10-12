// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'legal_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CurrentLegalDocumentImpl _$$CurrentLegalDocumentImplFromJson(
  Map<String, dynamic> json,
) => _$CurrentLegalDocumentImpl(
  documentId: json['documentId'] as String,
  type: json['type'] as String,
  title: json['title'] as String,
  versionId: json['versionId'] as String,
  version: (json['version'] as num).toInt(),
  content: json['content'] as String,
  publishedAt: json['publishedAt'] as String,
);

Map<String, dynamic> _$$CurrentLegalDocumentImplToJson(
  _$CurrentLegalDocumentImpl instance,
) => <String, dynamic>{
  'documentId': instance.documentId,
  'type': instance.type,
  'title': instance.title,
  'versionId': instance.versionId,
  'version': instance.version,
  'content': instance.content,
  'publishedAt': instance.publishedAt,
};

_$CurrentLegalDocumentsImpl _$$CurrentLegalDocumentsImplFromJson(
  Map<String, dynamic> json,
) => _$CurrentLegalDocumentsImpl(
  documents: (json['documents'] as List<dynamic>)
      .map((e) => CurrentLegalDocument.fromJson(e as Map<String, dynamic>))
      .toList(),
  versionIds: (json['versionIds'] as List<dynamic>)
      .map((e) => e as String)
      .toList(),
);

Map<String, dynamic> _$$CurrentLegalDocumentsImplToJson(
  _$CurrentLegalDocumentsImpl instance,
) => <String, dynamic>{
  'documents': instance.documents,
  'versionIds': instance.versionIds,
};
