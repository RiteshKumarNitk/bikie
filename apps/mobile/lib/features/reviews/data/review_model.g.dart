// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'review_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ReviewAuthorImpl _$$ReviewAuthorImplFromJson(Map<String, dynamic> json) =>
    _$ReviewAuthorImpl(
      name: json['name'] as String,
      image: json['image'] as String?,
    );

Map<String, dynamic> _$$ReviewAuthorImplToJson(_$ReviewAuthorImpl instance) =>
    <String, dynamic>{'name': instance.name, 'image': instance.image};

_$ReviewBikeRefImpl _$$ReviewBikeRefImplFromJson(Map<String, dynamic> json) =>
    _$ReviewBikeRefImpl(
      slug: json['slug'] as String,
      name: json['name'] as String,
    );

Map<String, dynamic> _$$ReviewBikeRefImplToJson(_$ReviewBikeRefImpl instance) =>
    <String, dynamic>{'slug': instance.slug, 'name': instance.name};

_$ReviewModelImpl _$$ReviewModelImplFromJson(Map<String, dynamic> json) =>
    _$ReviewModelImpl(
      id: json['id'] as String,
      rating: json['rating'] as num,
      comment: json['comment'] as String,
      createdAt: json['createdAt'] as String,
      author: ReviewAuthor.fromJson(json['author'] as Map<String, dynamic>),
      bike: json['bike'] == null
          ? null
          : ReviewBikeRef.fromJson(json['bike'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$ReviewModelImplToJson(_$ReviewModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'rating': instance.rating,
      'comment': instance.comment,
      'createdAt': instance.createdAt,
      'author': instance.author,
      'bike': instance.bike,
    };
