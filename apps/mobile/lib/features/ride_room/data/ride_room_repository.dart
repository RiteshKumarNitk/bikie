import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'ride_room_models.dart';

final rideRoomRepositoryProvider = Provider<RideRoomRepository>((ref) {
  return RideRoomRepository(ref.watch(dioProvider));
});

class RideRoomRepository {
  RideRoomRepository(this._dio);

  final Dio _dio;

  Future<RideRoom> getRoom(String slug) {
    return apiGuard(() async {
      final res = await _dio.get('/api/trips/$slug/room');
      return RideRoom.fromJson(res.data['room'] as Map<String, dynamic>);
    });
  }

  Future<List<Announcement>> getAnnouncements(String slug) {
    return apiGuard(() async {
      final res = await _dio.get('/api/trips/$slug/room/announcements');
      return (res.data['announcements'] as List)
          .map((e) => Announcement.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  Future<Announcement> postAnnouncement(String slug, String content) {
    return apiGuard(() async {
      final res = await _dio.post('/api/trips/$slug/room/announcements', data: {'content': content});
      return Announcement.fromJson(res.data['announcement'] as Map<String, dynamic>);
    });
  }

  Future<void> deleteAnnouncement(String slug, String id) {
    return apiGuard(() async {
      await _dio.delete('/api/trips/$slug/room/announcements/$id');
    });
  }

  Future<void> updateMeetingPoint(String slug, {String? meetingPoint, double? meetingLat, double? meetingLng}) {
    return apiGuard(() async {
      await _dio.patch(
        '/api/trips/$slug/room/meeting-point',
        data: {
          if (meetingPoint != null) 'meetingPoint': meetingPoint,
          if (meetingLat != null) 'meetingLat': meetingLat,
          if (meetingLng != null) 'meetingLng': meetingLng,
        },
      );
    });
  }

  Future<void> updateEmergencyContacts(String slug, List<EmergencyContact> contacts) {
    return apiGuard(() async {
      await _dio.patch(
        '/api/trips/$slug/room/emergency-contacts',
        data: {'contacts': contacts.map((c) => c.toJson()).toList()},
      );
    });
  }

  Future<List<MediaItem>> getMedia(String slug, {String? type}) {
    return apiGuard(() async {
      final res = await _dio.get(
        '/api/trips/$slug/room/media',
        queryParameters: type != null ? {'type': type} : null,
      );
      return (res.data['media'] as List).map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
    });
  }
}
