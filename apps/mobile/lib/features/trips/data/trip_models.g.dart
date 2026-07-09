// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'trip_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TripDestinationRefImpl _$$TripDestinationRefImplFromJson(
  Map<String, dynamic> json,
) => _$TripDestinationRefImpl(
  name: json['name'] as String,
  slug: json['slug'] as String,
);

Map<String, dynamic> _$$TripDestinationRefImplToJson(
  _$TripDestinationRefImpl instance,
) => <String, dynamic>{'name': instance.name, 'slug': instance.slug};

_$TripOrganizerImpl _$$TripOrganizerImplFromJson(Map<String, dynamic> json) =>
    _$TripOrganizerImpl(
      name: json['name'] as String,
      image: json['image'] as String?,
    );

Map<String, dynamic> _$$TripOrganizerImplToJson(_$TripOrganizerImpl instance) =>
    <String, dynamic>{'name': instance.name, 'image': instance.image};

_$TripSummaryImpl _$$TripSummaryImplFromJson(Map<String, dynamic> json) =>
    _$TripSummaryImpl(
      id: json['id'] as String,
      slug: json['slug'] as String,
      title: json['title'] as String,
      imageUrl: json['imageUrl'] as String,
      type: json['type'] as String,
      difficulty: json['difficulty'] as String,
      price: json['price'] as num,
      seatsTotal: (json['seatsTotal'] as num).toInt(),
      seatsLeft: (json['seatsLeft'] as num).toInt(),
      startDate: json['startDate'] as String,
      endDate: json['endDate'] as String,
      status: json['status'] as String,
      destination: json['destination'] == null
          ? null
          : TripDestinationRef.fromJson(
              json['destination'] as Map<String, dynamic>,
            ),
    );

Map<String, dynamic> _$$TripSummaryImplToJson(_$TripSummaryImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'slug': instance.slug,
      'title': instance.title,
      'imageUrl': instance.imageUrl,
      'type': instance.type,
      'difficulty': instance.difficulty,
      'price': instance.price,
      'seatsTotal': instance.seatsTotal,
      'seatsLeft': instance.seatsLeft,
      'startDate': instance.startDate,
      'endDate': instance.endDate,
      'status': instance.status,
      'destination': instance.destination,
    };

_$TripDetailImpl _$$TripDetailImplFromJson(
  Map<String, dynamic> json,
) => _$TripDetailImpl(
  id: json['id'] as String,
  slug: json['slug'] as String,
  title: json['title'] as String,
  imageUrl: json['imageUrl'] as String,
  type: json['type'] as String,
  difficulty: json['difficulty'] as String,
  price: json['price'] as num,
  seatsTotal: (json['seatsTotal'] as num).toInt(),
  seatsLeft: (json['seatsLeft'] as num).toInt(),
  startDate: json['startDate'] as String,
  endDate: json['endDate'] as String,
  status: json['status'] as String,
  destination: json['destination'] == null
      ? null
      : TripDestinationRef.fromJson(
          json['destination'] as Map<String, dynamic>,
        ),
  description: json['description'] as String,
  gallery: (json['gallery'] as List<dynamic>).map((e) => e as String).toList(),
  organizer: TripOrganizer.fromJson(json['organizer'] as Map<String, dynamic>),
);

Map<String, dynamic> _$$TripDetailImplToJson(_$TripDetailImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'slug': instance.slug,
      'title': instance.title,
      'imageUrl': instance.imageUrl,
      'type': instance.type,
      'difficulty': instance.difficulty,
      'price': instance.price,
      'seatsTotal': instance.seatsTotal,
      'seatsLeft': instance.seatsLeft,
      'startDate': instance.startDate,
      'endDate': instance.endDate,
      'status': instance.status,
      'destination': instance.destination,
      'description': instance.description,
      'gallery': instance.gallery,
      'organizer': instance.organizer,
    };
