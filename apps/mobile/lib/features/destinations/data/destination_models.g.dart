// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'destination_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$DestinationSummaryImpl _$$DestinationSummaryImplFromJson(
  Map<String, dynamic> json,
) => _$DestinationSummaryImpl(
  id: json['id'] as String,
  slug: json['slug'] as String,
  name: json['name'] as String,
  state: json['state'] as String,
  imageUrl: json['imageUrl'] as String,
  bikeCount: (json['bikeCount'] as num).toInt(),
);

Map<String, dynamic> _$$DestinationSummaryImplToJson(
  _$DestinationSummaryImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'slug': instance.slug,
  'name': instance.name,
  'state': instance.state,
  'imageUrl': instance.imageUrl,
  'bikeCount': instance.bikeCount,
};

_$DestinationDetailImpl _$$DestinationDetailImplFromJson(
  Map<String, dynamic> json,
) => _$DestinationDetailImpl(
  id: json['id'] as String,
  slug: json['slug'] as String,
  name: json['name'] as String,
  state: json['state'] as String,
  imageUrl: json['imageUrl'] as String,
  bikeCount: (json['bikeCount'] as num).toInt(),
  description: json['description'] as String?,
  bikes: (json['bikes'] as List<dynamic>)
      .map((e) => BikeSummary.fromJson(e as Map<String, dynamic>))
      .toList(),
);

Map<String, dynamic> _$$DestinationDetailImplToJson(
  _$DestinationDetailImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'slug': instance.slug,
  'name': instance.name,
  'state': instance.state,
  'imageUrl': instance.imageUrl,
  'bikeCount': instance.bikeCount,
  'description': instance.description,
  'bikes': instance.bikes,
};
