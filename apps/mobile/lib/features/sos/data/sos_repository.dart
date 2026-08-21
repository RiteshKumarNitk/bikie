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

  /// ADR-042: a GPS radius around the caller, not a same-city text match — mirrors the web
  /// client. Non-admin callers get a `400 LOCATION_REQUIRED` without `lat`/`lng` (privacy —
  /// see `.docs/API.md`).
  Future<List<SOSAlert>> getActive({double? latitude, double? longitude}) {
    return apiGuard(() async {
      final res = await _dio.get(
        '/api/sos/alerts',
        queryParameters: latitude != null && longitude != null ? {'lat': latitude, 'lng': longitude} : null,
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

  /// Returns the full response envelope (alert + dispatch summary + profile warning), not just
  /// the created alert — the caller needs `dispatch` to report real delivery results (ADR-030),
  /// not a fixed "sent via SMS/WhatsApp/email" success message.
  Future<SOSCreateResult> create({
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
      return SOSCreateResult.fromJson(res.data as Map<String, dynamic>);
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

  /// §28 — the reporter (or admin) cancels an SOS while it's being dispatched. Stops dispatch,
  /// expires offers, notifies responders, records the SOS_CANCELLED timeline event.
  Future<void> cancelAlert(String alertId, {String? reason}) {
    return apiGuard(() => _dio.post(
          '/api/sos/alerts/$alertId/cancel',
          data: {if (reason != null && reason.isNotEmpty) 'reason': reason},
        ));
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

  /// A responder declines without ever offering (ADR-045) — persisted, not a local UI-only
  /// dismissal.
  Future<void> declineAlert(String alertId, {String? message}) {
    return apiGuard(() => _dio.post(
          '/api/sos/alerts/$alertId/decline',
          data: {if (message != null && message.isNotEmpty) 'message': message},
        ));
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

  /// Radius-based off the alert's own coordinates — not the alert's free-text `city`, which could
  /// mismatch a genuinely nearby partner's own free-text `city` on spelling/casing/boundary and
  /// hide them for no real reason (mirrors web's identical fix to `GET /api/sos/partners`).
  Future<List<SOSPartner>> getNearbyPartners(double latitude, double longitude, {String? type}) {
    return apiGuard(() async {
      final res = await _dio.get(
        '/api/sos/partners',
        queryParameters: {'lat': latitude, 'lng': longitude, if (type != null) 'type': type},
      );
      return (res.data['partners'] as List).map((e) => SOSPartner.fromJson(e as Map<String, dynamic>)).toList();
    });
  }
}
