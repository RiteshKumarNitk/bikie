// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'testimonial_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TestimonialModelImpl _$$TestimonialModelImplFromJson(
  Map<String, dynamic> json,
) => _$TestimonialModelImpl(
  id: json['id'] as String,
  authorName: json['authorName'] as String,
  authorAvatarUrl: json['authorAvatarUrl'] as String?,
  authorLocation: json['authorLocation'] as String?,
  rating: json['rating'] as num,
  quote: json['quote'] as String,
);

Map<String, dynamic> _$$TestimonialModelImplToJson(
  _$TestimonialModelImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'authorName': instance.authorName,
  'authorAvatarUrl': instance.authorAvatarUrl,
  'authorLocation': instance.authorLocation,
  'rating': instance.rating,
  'quote': instance.quote,
};
