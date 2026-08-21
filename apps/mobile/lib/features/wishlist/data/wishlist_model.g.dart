// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'wishlist_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$WishlistItemImpl _$$WishlistItemImplFromJson(Map<String, dynamic> json) =>
    _$WishlistItemImpl(
      id: json['id'] as String,
      createdAt: json['createdAt'] as String,
      bike: BikeSummary.fromJson(json['bike'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$WishlistItemImplToJson(_$WishlistItemImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'createdAt': instance.createdAt,
      'bike': instance.bike,
    };
