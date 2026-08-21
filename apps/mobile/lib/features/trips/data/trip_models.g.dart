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
      id: json['id'] as String,
      name: json['name'] as String,
      image: json['image'] as String?,
    );

Map<String, dynamic> _$$TripOrganizerImplToJson(_$TripOrganizerImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'image': instance.image,
    };

_$TripMemberImpl _$$TripMemberImplFromJson(Map<String, dynamic> json) =>
    _$TripMemberImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      image: json['image'] as String?,
    );

Map<String, dynamic> _$$TripMemberImplToJson(_$TripMemberImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'image': instance.image,
    };

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
      destinationName: json['destinationName'] as String?,
      unreadMessages: (json['unreadMessages'] as num?)?.toInt(),
      pendingRequests: (json['pendingRequests'] as num?)?.toInt(),
      membersCount: (json['membersCount'] as num?)?.toInt(),
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
      'destinationName': instance.destinationName,
      'unreadMessages': instance.unreadMessages,
      'pendingRequests': instance.pendingRequests,
      'membersCount': instance.membersCount,
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
  destinationName: json['destinationName'] as String?,
  description: json['description'] as String,
  gallery: (json['gallery'] as List<dynamic>).map((e) => e as String).toList(),
  meetingPoint: json['meetingPoint'] as String?,
  meetingLat: (json['meetingLat'] as num?)?.toDouble(),
  meetingLng: (json['meetingLng'] as num?)?.toDouble(),
  organizer: TripOrganizer.fromJson(json['organizer'] as Map<String, dynamic>),
  members: (json['members'] as List<dynamic>?)
      ?.map((e) => TripMember.fromJson(e as Map<String, dynamic>))
      .toList(),
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
      'destinationName': instance.destinationName,
      'description': instance.description,
      'gallery': instance.gallery,
      'meetingPoint': instance.meetingPoint,
      'meetingLat': instance.meetingLat,
      'meetingLng': instance.meetingLng,
      'organizer': instance.organizer,
      'members': instance.members,
    };

_$RideRequestRiderImpl _$$RideRequestRiderImplFromJson(
  Map<String, dynamic> json,
) => _$RideRequestRiderImpl(
  id: json['id'] as String,
  name: json['name'] as String,
  image: json['image'] as String?,
  completedRides: (json['completedRides'] as num?)?.toInt(),
  rating: json['rating'] as num?,
  bike: json['bike'] as String?,
);

Map<String, dynamic> _$$RideRequestRiderImplToJson(
  _$RideRequestRiderImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'image': instance.image,
  'completedRides': instance.completedRides,
  'rating': instance.rating,
  'bike': instance.bike,
};

_$RideJoinRequestImpl _$$RideJoinRequestImplFromJson(
  Map<String, dynamic> json,
) => _$RideJoinRequestImpl(
  id: json['id'] as String,
  tripId: json['tripId'] as String,
  tripSlug: json['tripSlug'] as String,
  tripTitle: json['tripTitle'] as String,
  message: json['message'] as String?,
  createdAt: json['createdAt'] as String,
  rider: RideRequestRider.fromJson(json['rider'] as Map<String, dynamic>),
);

Map<String, dynamic> _$$RideJoinRequestImplToJson(
  _$RideJoinRequestImpl instance,
) => <String, dynamic>{
  'id': instance.id,
  'tripId': instance.tripId,
  'tripSlug': instance.tripSlug,
  'tripTitle': instance.tripTitle,
  'message': instance.message,
  'createdAt': instance.createdAt,
  'rider': instance.rider,
};

_$MyRideRequestStatusImpl _$$MyRideRequestStatusImplFromJson(
  Map<String, dynamic> json,
) => _$MyRideRequestStatusImpl(
  status: json['status'] as String,
  message: json['message'] as String?,
);

Map<String, dynamic> _$$MyRideRequestStatusImplToJson(
  _$MyRideRequestStatusImpl instance,
) => <String, dynamic>{'status': instance.status, 'message': instance.message};

_$RideStatsImpl _$$RideStatsImplFromJson(Map<String, dynamic> json) =>
    _$RideStatsImpl(
      ridesOrganized: (json['ridesOrganized'] as num).toInt(),
      requestsSent: (json['requestsSent'] as num).toInt(),
      requestsApproved: (json['requestsApproved'] as num).toInt(),
      ridesCancelled: (json['ridesCancelled'] as num).toInt(),
      approvalRate: (json['approvalRate'] as num?)?.toInt(),
    );

Map<String, dynamic> _$$RideStatsImplToJson(_$RideStatsImpl instance) =>
    <String, dynamic>{
      'ridesOrganized': instance.ridesOrganized,
      'requestsSent': instance.requestsSent,
      'requestsApproved': instance.requestsApproved,
      'ridesCancelled': instance.ridesCancelled,
      'approvalRate': instance.approvalRate,
    };

_$MyRidesImpl _$$MyRidesImplFromJson(Map<String, dynamic> json) =>
    _$MyRidesImpl(
      organized: (json['organized'] as List<dynamic>)
          .map((e) => TripSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
      joined: (json['joined'] as List<dynamic>)
          .map((e) => TripSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
      requested: (json['requested'] as List<dynamic>)
          .map((e) => TripSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
      stats: RideStats.fromJson(json['stats'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$MyRidesImplToJson(_$MyRidesImpl instance) =>
    <String, dynamic>{
      'organized': instance.organized,
      'joined': instance.joined,
      'requested': instance.requested,
      'stats': instance.stats,
    };
