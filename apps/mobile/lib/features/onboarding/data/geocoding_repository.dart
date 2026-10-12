import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

/// Identifies the app to Nominatim, as its usage policy requires
/// (https://operations.osmfoundation.org/policies/nominatim/) — a generic HTTP-library user agent
/// can be refused outright.
const nominatimUserAgent = 'BIKIE-Mobile/1.0 (com.bikie.mobile; +https://bikie.app)';

/// A dedicated client, deliberately NOT the app's `dioProvider`: that one carries the user's
/// bearer token and the BIKIE API base URL, neither of which may ever be sent to a third party.
Dio buildNominatimDio() => Dio(BaseOptions(
      baseUrl: 'https://nominatim.openstreetmap.org',
      headers: {'User-Agent': nominatimUserAgent},
      connectTimeout: const Duration(seconds: 8),
      receiveTimeout: const Duration(seconds: 8),
    ));

final geocodingRepositoryProvider = Provider<GeocodingRepository>((ref) {
  return GeocodingRepository(buildNominatimDio());
});

/// Address parts a map pin resolves to. Any may be null — OSM coverage varies.
class ReverseGeocodeResult {
  const ReverseGeocodeResult({this.city, this.area, this.pincode, this.road});

  final String? city;
  final String? area;
  final String? pincode;
  final String? road;
}

/// OpenStreetMap Nominatim lookups for Service Provider location setup. Called at most once per
/// deliberate user action (confirming a pin, or once to find a fallback map centre) — never per map
/// movement, per Nominatim's one-request-per-second policy. Failures return null: geocoding is a
/// convenience, never a reason to block onboarding.
class GeocodingRepository {
  GeocodingRepository(this._dio);

  final Dio _dio;

  Future<ReverseGeocodeResult?> reverse(LatLng point) async {
    try {
      final res = await _dio.get('/reverse', queryParameters: {
        'format': 'json',
        'lat': point.latitude,
        'lon': point.longitude,
        'zoom': 18,
        'addressdetails': 1,
        'accept-language': 'en',
      });
      final address = (res.data as Map<String, dynamic>?)?['address'];
      if (address is! Map<String, dynamic>) return null;
      String? pick(List<String> keys) {
        for (final key in keys) {
          final value = address[key];
          if (value != null && value.toString().trim().isNotEmpty) return value.toString().trim();
        }
        return null;
      }

      return ReverseGeocodeResult(
        city: pick(['city', 'town', 'village', 'county']),
        area: pick(['suburb', 'neighbourhood', 'residential']),
        pincode: pick(['postcode']),
        road: pick(['road']),
      );
    } catch (_) {
      return null;
    }
  }

  /// Rough centre of a typed city (India-restricted), used only to open the map near the right
  /// place when GPS isn't available — never saved as the provider's location.
  Future<LatLng?> searchCity(String city) async {
    final query = city.trim();
    if (query.isEmpty) return null;
    try {
      final res = await _dio.get('/search', queryParameters: {
        'format': 'json',
        'q': query,
        'countrycodes': 'in',
        'limit': 1,
        'accept-language': 'en',
      });
      final results = res.data;
      if (results is! List || results.isEmpty) return null;
      final first = results.first as Map<String, dynamic>;
      final lat = double.tryParse('${first['lat']}');
      final lon = double.tryParse('${first['lon']}');
      return lat == null || lon == null ? null : LatLng(lat, lon);
    } catch (_) {
      return null;
    }
  }
}
