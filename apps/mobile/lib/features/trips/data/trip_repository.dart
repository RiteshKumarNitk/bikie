import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'trip_models.dart';

final tripRepositoryProvider = Provider<TripRepository>((ref) {
  return TripRepository(ref.watch(dioProvider));
});

class TripRepository {
  TripRepository(this._dio);

  final Dio _dio;

  Future<List<TripSummary>> getAll({String? tab}) {
    return apiGuard(() async {
      final res = await _dio.get('/api/trips', queryParameters: tab != null ? {'tab': tab} : null);
      return (res.data['trips'] as List).map((e) => TripSummary.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  Future<TripDetail> getBySlug(String slug) {
    return apiGuard(() async {
      final res = await _dio.get('/api/trips/$slug');
      return TripDetail.fromJson(res.data['trip'] as Map<String, dynamic>);
    });
  }

  /// `POST /api/trips` — membership-gated ride creation. See
  /// `packages/validation/src/trip.schema.ts` `createTripSchema` for the
  /// exact field constraints mirrored here.
  Future<TripSummary> create({
    required String title,
    required String description,
    required String type,
    String difficulty = 'MODERATE',
    num price = 0,
    required int seatsTotal,
    String? meetingPoint,
    required DateTime startDate,
    required DateTime endDate,
    String? destinationId,
    String? imageUrl,
  }) {
    return apiGuard(() async {
      final res = await _dio.post(
        '/api/trips',
        data: {
          'title': title,
          'description': description,
          'type': type,
          'difficulty': difficulty,
          'price': price,
          'seatsTotal': seatsTotal,
          if (meetingPoint != null && meetingPoint.trim().isNotEmpty) 'meetingPoint': meetingPoint.trim(),
          'startDate': startDate.toUtc().toIso8601String(),
          'endDate': endDate.toUtc().toIso8601String(),
          if (destinationId != null) 'destinationId': destinationId,
          if (imageUrl != null && imageUrl.trim().isNotEmpty) 'imageUrl': imageUrl.trim(),
        },
      );
      return TripSummary.fromJson(res.data['trip'] as Map<String, dynamic>);
    });
  }

  /// `GET /api/trips/mine` — organized/joined/requested rides + reputation stats.
  Future<MyRides> getMine() {
    return apiGuard(() async {
      final res = await _dio.get('/api/trips/mine');
      return MyRides.fromJson(res.data as Map<String, dynamic>);
    });
  }

  /// `GET /api/trips/[slug]/requests` — organizer-only pending-request queue for one ride.
  Future<List<RideJoinRequest>> getPendingRequestsFor(String slug) {
    return apiGuard(() async {
      final res = await _dio.get('/api/trips/$slug/requests');
      return (res.data['requests'] as List).map((e) => RideJoinRequest.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  /// `GET /api/requests/pending` — aggregated pending requests across every ride
  /// the caller organizes (the "Requests" inbox, mirrors `/dashboard/requests`).
  Future<List<RideJoinRequest>> getAllPendingRequests() {
    return apiGuard(() async {
      final res = await _dio.get('/api/requests/pending');
      return (res.data['requests'] as List).map((e) => RideJoinRequest.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  Future<void> requestToJoin(String slug, {String? message}) {
    return apiGuard(() async {
      await _dio.post(
        '/api/trips/$slug/requests',
        data: {if (message != null && message.trim().isNotEmpty) 'message': message.trim()},
      );
    });
  }

  Future<MyRideRequestStatus?> getMyRequestStatus(String slug) {
    return apiGuard(() async {
      final res = await _dio.get('/api/trips/$slug/requests/mine');
      final request = res.data['request'];
      return request == null ? null : MyRideRequestStatus.fromJson(request as Map<String, dynamic>);
    });
  }

  Future<void> approveRequest(String slug, String participantId) {
    return apiGuard(() async {
      await _dio.post('/api/trips/$slug/requests/$participantId/approve');
    });
  }

  Future<void> rejectRequest(String slug, String participantId) {
    return apiGuard(() async {
      await _dio.post('/api/trips/$slug/requests/$participantId/reject');
    });
  }

  Future<void> leaveRide(String slug) {
    return apiGuard(() async {
      await _dio.post('/api/trips/$slug/leave');
    });
  }

  /// `GET /api/trips/[slug]/group` — the ride's group-chat conversation id.
  /// Returns `null` if no one has been approved yet (`404 NOT_STARTED`),
  /// rather than surfacing that as an error — it's an expected pre-chat state.
  Future<String?> getGroupConversationId(String slug) async {
    try {
      final res = await _dio.get('/api/trips/$slug/group');
      return res.data['conversationId'] as String?;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      throw ApiException.fromResponseData(e.response?.statusCode ?? 500, e.response?.data);
    }
  }
}
