import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/sos/data/sos_model.dart';

void main() {
  group('describeSosLocation (ADR-038)', () {
    test('prefers the reverse-geocoded formattedAddress', () {
      expect(
        describeSosLocation(
          formattedAddress: 'City Park, Malviya Nagar, Jaipur, Rajasthan, India',
          placeName: 'City Park',
          area: 'Malviya Nagar',
          city: 'Jaipur',
        ),
        'City Park, Malviya Nagar, Jaipur, Rajasthan, India',
      );
    });

    test('falls back to placeName/area/city when formattedAddress is missing', () {
      expect(
        describeSosLocation(placeName: 'City Park', area: 'Malviya Nagar', city: 'Jaipur'),
        'City Park, Malviya Nagar, Jaipur',
      );
    });

    test('falls back to bare city when nothing was geocoded', () {
      expect(describeSosLocation(city: 'Jaipur'), 'Jaipur');
    });

    test('skips blank placeName/area rather than joining empty segments', () {
      expect(describeSosLocation(placeName: '', area: null, city: 'Jaipur'), 'Jaipur');
    });
  });
}
