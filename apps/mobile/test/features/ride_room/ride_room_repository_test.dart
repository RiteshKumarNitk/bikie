import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/ride_room/data/ride_room_models.dart';
import 'package:mobile/features/ride_room/data/ride_room_repository.dart';
import 'package:mocktail/mocktail.dart';

class _MockDio extends Mock implements Dio {}

void main() {
  setUpAll(() {
    registerFallbackValue(RequestOptions(path: '/api/trips/himalayan-run/room'));
  });

  late _MockDio dio;
  late RideRoomRepository repository;

  setUp(() {
    dio = _MockDio();
    repository = RideRoomRepository(dio);
  });

  Response<T> okResponse<T>(String path, T data) =>
      Response<T>(requestOptions: RequestOptions(path: path), statusCode: 200, data: data);

  group('RideRoom.canManage', () {
    test('is true for ORGANIZER and ADMIN, false for MEMBER', () {
      Map<String, dynamic> roomJson(String role) => {
            'tripId': 'trip-1',
            'conversationId': 'conv-1',
            'role': role,
            'isLocked': false,
            'meetingPoint': null,
            'meetingLat': null,
            'meetingLng': null,
            'emergencyContacts': <Map<String, dynamic>>[],
          };

      expect(RideRoom.fromJson(roomJson('ORGANIZER')).canManage, isTrue);
      expect(RideRoom.fromJson(roomJson('ADMIN')).canManage, isTrue);
      expect(RideRoom.fromJson(roomJson('MEMBER')).canManage, isFalse);
    });
  });

  group('RideRoomRepository.getRoom', () {
    test('parses the room envelope including emergency contacts', () async {
      when(() => dio.get(any())).thenAnswer(
        (_) async => okResponse('/api/trips/himalayan-run/room', {
          'room': {
            'tripId': 'trip-1',
            'conversationId': 'conv-1',
            'role': 'MEMBER',
            'isLocked': false,
            'meetingPoint': 'Toll Plaza',
            'meetingLat': 12.9,
            'meetingLng': 77.6,
            'emergencyContacts': [
              {'name': 'Priya', 'phone': '9999999999', 'relation': 'Spouse'},
            ],
          },
        }),
      );

      final room = await repository.getRoom('himalayan-run');

      expect(room.conversationId, 'conv-1');
      expect(room.meetingPoint, 'Toll Plaza');
      expect(room.emergencyContacts.single.name, 'Priya');
    });
  });

  group('RideRoomRepository announcements', () {
    test('postAnnouncement posts content and parses the created announcement', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => okResponse('/api/trips/himalayan-run/room/announcements', {
          'announcement': {
            'id': 'ann-1',
            'tripId': 'trip-1',
            'authorId': 'user-1',
            'authorName': 'Organizer',
            'content': 'Meet at 6am sharp',
            'pinnedAt': null,
            'createdAt': '2026-07-20T00:00:00.000Z',
          },
        }),
      );

      final announcement = await repository.postAnnouncement('himalayan-run', 'Meet at 6am sharp');

      expect(announcement.content, 'Meet at 6am sharp');
      verify(
        () => dio.post(
          '/api/trips/himalayan-run/room/announcements',
          data: {'content': 'Meet at 6am sharp'},
        ),
      ).called(1);
    });

    test('deleteAnnouncement calls DELETE on the announcement id', () async {
      when(() => dio.delete(any())).thenAnswer(
        (_) async => okResponse('/api/trips/himalayan-run/room/announcements/ann-1', {'success': true}),
      );

      await repository.deleteAnnouncement('himalayan-run', 'ann-1');

      verify(() => dio.delete('/api/trips/himalayan-run/room/announcements/ann-1')).called(1);
    });
  });

  group('RideRoomRepository.updateMeetingPoint', () {
    test('only sends the fields that were provided', () async {
      when(() => dio.patch(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => okResponse('/api/trips/himalayan-run/room/meeting-point', {'success': true}),
      );

      await repository.updateMeetingPoint('himalayan-run', meetingPoint: 'Toll Plaza');

      final captured = verify(
        () => dio.patch('/api/trips/himalayan-run/room/meeting-point', data: captureAny(named: 'data')),
      ).captured.single as Map<String, dynamic>;
      expect(captured['meetingPoint'], 'Toll Plaza');
      expect(captured.containsKey('meetingLat'), isFalse);
      expect(captured.containsKey('meetingLng'), isFalse);
    });
  });

  group('RideRoomRepository.updateEmergencyContacts', () {
    test('serializes the contact list', () async {
      when(() => dio.patch(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => okResponse('/api/trips/himalayan-run/room/emergency-contacts', {'success': true}),
      );

      await repository.updateEmergencyContacts(
        'himalayan-run',
        [const EmergencyContact(name: 'Priya', phone: '9999999999', relation: 'Spouse')],
      );

      final captured = verify(
        () => dio.patch('/api/trips/himalayan-run/room/emergency-contacts', data: captureAny(named: 'data')),
      ).captured.single as Map<String, dynamic>;
      expect((captured['contacts'] as List).single, {'name': 'Priya', 'phone': '9999999999', 'relation': 'Spouse'});
    });
  });

  group('RideRoomRepository.getMedia', () {
    test('forwards an optional type filter and parses media items', () async {
      when(() => dio.get(any(), queryParameters: any(named: 'queryParameters'))).thenAnswer(
        (_) async => okResponse('/api/trips/himalayan-run/room/media', {
          'media': [
            {
              'id': 'm1',
              'type': 'IMAGE',
              'fileName': 'sunrise.jpg',
              'mimeType': 'image/jpeg',
              'sizeBytes': 204800,
              'width': 1080,
              'height': 720,
              'createdAt': '2026-07-20T00:00:00.000Z',
            },
          ],
        }),
      );

      final media = await repository.getMedia('himalayan-run', type: 'IMAGE');

      expect(media.single.fileName, 'sunrise.jpg');
      verify(() => dio.get('/api/trips/himalayan-run/room/media', queryParameters: {'type': 'IMAGE'})).called(1);
    });
  });
}
