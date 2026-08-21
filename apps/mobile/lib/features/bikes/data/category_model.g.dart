// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'category_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CategoryModelImpl _$$CategoryModelImplFromJson(Map<String, dynamic> json) =>
    _$CategoryModelImpl(
      id: json['id'] as String,
      slug: json['slug'] as String,
      name: json['name'] as String,
      type: json['type'] as String,
      iconUrl: json['iconUrl'] as String?,
      imageUrl: json['imageUrl'] as String,
    );

Map<String, dynamic> _$$CategoryModelImplToJson(_$CategoryModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'slug': instance.slug,
      'name': instance.name,
      'type': instance.type,
      'iconUrl': instance.iconUrl,
      'imageUrl': instance.imageUrl,
    };
