import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'sos_model.dart';

final sosRepositoryProvider = Provider<SosRepository>((ref) {
  return SosRepository(ref.watch(dioProvider));
});

class SosRepository {
  SosRepository(this._dio);

  final Dio _dio;

  /// `city` mirrors the web client's behavior: non-admin callers get a
  /// `400 CITY_REQUIRED` without one (privacy — see `.docs/API.md`). Fixes a
  /// pre-existing bug where this was always called with no city at all.
  Future<List<SOSAlert>> getActive({String? city}) {
    return apiGuard(() async {
      final res = await _dio.get(
        '/api/sos/alerts',
        queryParameters: city != null && city.isNotEmpty ? {'city': city} : null,
      );
      return (res.data['alerts'] as List).map((e) => SOSAlert.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  Future<List<SOSHistoryEntry>> getHistory() {
    return apiGuard(() async {
      final res = await _dio.get('/api/sos/alerts/history');
      return (res.data['alerts'] as List).map((e) => SOSHistoryEntry.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  Future<SOSAlert> create({
    required String type,
    String? description,
    required double latitude,
    required double longitude,
    required String city,
  }) {
    return apiGuard(() async {
      final res = await _dio.post(
        '/api/sos/alerts',
        data: {
          'type': type,
          if (description != null && description.isNotEmpty) 'description': description,
          'latitude': latitude,
          'longitude': longitude,
          'city': city,
        },
      );
      return SOSAlert.fromJson(res.data['alert'] as Map<String, dynamic>);
    });
  }

  Future<SOSAlertDetail> getAlertDetail(String alertId) {
    return apiGuard(() async {
      final res = await _dio.get('/api/sos/alerts/$alertId');
      return SOSAlertDetail.fromJson(res.data as Map<String, dynamic>);
    });
  }

  Future<void> resolve(String id) {
    return apiGuard(() => _dio.post('/api/sos/alerts/$id/resolve'));
  }

  /// Helper taps "I'm Coming."
  Future<SOSOffer> offerHelp(String alertId, {double? latitude, double? longitude, String? message}) {
    return apiGuard(() async {
      final res = await _dio.post(
        '/api/sos/alerts/$alertId/offer',
        data: {
          if (latitude != null) 'latitude': latitude,
          if (longitude != null) 'longitude': longitude,
          if (message != null && message.isNotEmpty) 'message': message,
        },
      );
      return SOSOffer.fromJson(res.data['offer'] as Map<String, dynamic>);
    });
  }

  Future<void> withdrawOffer(String alertId, String offerId) {
    return apiGuard(() => _dio.post('/api/sos/alerts/$alertId/offers/$offerId/withdraw'));
  }

  Future<List<SOSOffer>> listOffers(String alertId) {
    return apiGuard(() async {
      final res = await _dio.get('/api/sos/alerts/$alertId/offers');
      return (res.data['offers'] as List).map((e) => SOSOffer.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  Future<void> acceptOffer(String alertId, String offerId) {
    return apiGuard(() => _dio.post('/api/sos/alerts/$alertId/offers/$offerId/accept'));
  }

  Future<void> rejectOffer(String alertId, String offerId) {
    return apiGuard(() => _dio.post('/api/sos/alerts/$alertId/offers/$offerId/reject'));
  }

  Future<void> updateSessionStatus(String sessionId, String status, {String? cancelReason}) {
    return apiGuard(() => _dio.post(
          '/api/sos/sessions/$sessionId/status',
          data: {'status': status, if (cancelReason != null) 'cancelReason': cancelReason},
        ));
  }

  Future<void> submitRating(String sessionId, int rating, {String? comment}) {
    return apiGuard(() => _dio.post(
          '/api/sos/sessions/$sessionId/rating',
          data: {'rating': rating, if (comment != null && comment.isNotEmpty) 'comment': comment},
        ));
  }

  Future<List<SOSPartner>> getNearbyPartners(String city, {String? type}) {
    return apiGuard(() async {
      final res = await _dio.get(
        '/api/sos/partners',
        queryParameters: {'city': city, if (type != null) 'type': type},
      );
      return (res.data['partners'] as List).map((e) => SOSPartner.fromJson(e as Map<String, dynamic>)).toList();
    });
  }
}
