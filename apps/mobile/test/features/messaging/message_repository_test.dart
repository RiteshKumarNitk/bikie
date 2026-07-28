import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/features/messaging/data/message_models.dart';
import 'package:mobile/features/messaging/data/message_repository.dart';
import 'package:mocktail/mocktail.dart';

class _MockDio extends Mock implements Dio {}

void main() {
  setUpAll(() {
    registerFallbackValue(RequestOptions(path: '/api/conversations'));
  });

  late _MockDio dio;
  late MessageRepository repository;

  setUp(() {
    dio = _MockDio();
    repository = MessageRepository(dio);
  });

  Response<T> okResponse<T>(String path, T data) =>
      Response<T>(requestOptions: RequestOptions(path: path), statusCode: 200, data: data);

  Map<String, dynamic> buildMessageJson({
    String id = 'msg-1',
    String? senderId = 'user-1',
    String? content = 'Hello',
    String type = 'TEXT',
  }) =>
      {
        'id': id,
        'conversationId': 'conv-1',
        'senderId': senderId,
        'senderName': senderId == null ? null : 'Rider One',
        'senderImage': null,
        'type': type,
        'content': content,
        'replyToId': null,
        'editedAt': null,
        'deletedAt': null,
        'attachments': <Map<String, dynamic>>[],
        'receipts': <Map<String, dynamic>>[],
        'reactions': <Map<String, dynamic>>[],
        'createdAt': '2026-07-20T10:00:00.000Z',
      };

  group('MessageModel.fromJson', () {
    test('parses a SYSTEM message with a null senderId/content-independent shape', () {
      final json = buildMessageJson(senderId: null, content: 'Ride location updated.', type: 'SYSTEM');
      final message = MessageModel.fromJson(json);

      expect(message.senderId, isNull);
      expect(message.type, 'SYSTEM');
      expect(message.content, 'Ride location updated.');
    });

    test('parses a deleted message whose content has been nulled (true erasure)', () {
      final json = buildMessageJson(content: null)..['deletedAt'] = '2026-07-20T11:00:00.000Z';
      final message = MessageModel.fromJson(json);

      expect(message.content, isNull);
      expect(message.deletedAt, isNotNull);
    });

    test('parses reactions and receipts', () {
      final json = buildMessageJson();
      json['reactions'] = [
        {'emoji': '👍', 'userId': 'user-2', 'createdAt': '2026-07-20T10:01:00.000Z'},
      ];
      json['receipts'] = [
        {'userId': 'user-2', 'deliveredAt': '2026-07-20T10:01:00.000Z', 'readAt': null},
      ];

      final message = MessageModel.fromJson(json);

      expect(message.reactions, hasLength(1));
      expect(message.reactions.first.emoji, '👍');
      expect(message.receipts.single.readAt, isNull);
      expect(message.receipts.single.deliveredAt, isNotNull);
    });
  });

  group('ConversationParticipant.fromJson', () {
    test('parses without an email field (the API deliberately never sends one)', () {
      final participant = ConversationParticipant.fromJson({'id': 'u1', 'name': 'Asha', 'role': 'RENTER'});

      expect(participant.id, 'u1');
      expect(participant.name, 'Asha');
    });
  });

  group('MessageRepository.sendMessage', () {
    test('includes replyToId only when provided', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => okResponse('/api/conversations/conv-1/messages', {'message': buildMessageJson()}),
      );

      await repository.sendMessage('conv-1', content: 'Hi', replyToId: 'msg-0');

      final captured = verify(() => dio.post('/api/conversations/conv-1/messages', data: captureAny(named: 'data')))
          .captured
          .single as Map<String, dynamic>;
      expect(captured['content'], 'Hi');
      expect(captured['replyToId'], 'msg-0');
    });

    test('omits content when blank', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => okResponse('/api/conversations/conv-1/messages', {'message': buildMessageJson()}),
      );

      await repository.sendMessage('conv-1', content: '');

      final captured = verify(() => dio.post('/api/conversations/conv-1/messages', data: captureAny(named: 'data')))
          .captured
          .single as Map<String, dynamic>;
      expect(captured.containsKey('content'), isFalse);
      expect(captured.containsKey('replyToId'), isFalse);
    });
  });

  group('MessageRepository edit/delete/react', () {
    test('editMessage PATCHes /api/messages/:id', () async {
      when(() => dio.patch(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => okResponse('/api/messages/msg-1', {'message': buildMessageJson(content: 'Edited')}),
      );

      final message = await repository.editMessage('msg-1', 'Edited');

      expect(message.content, 'Edited');
      verify(() => dio.patch('/api/messages/msg-1', data: {'content': 'Edited'})).called(1);
    });

    test('editMessage surfaces FORBIDDEN as a typed ApiException', () async {
      when(() => dio.patch(any(), data: any(named: 'data'))).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/api/messages/msg-1'),
          response: Response(
            requestOptions: RequestOptions(path: '/api/messages/msg-1'),
            statusCode: 403,
            data: {'error': 'FORBIDDEN'},
          ),
          type: DioExceptionType.badResponse,
        ),
      );

      expect(
        () => repository.editMessage('msg-1', 'x'),
        throwsA(isA<ApiException>().having((e) => e.isForbidden, 'isForbidden', true)),
      );
    });

    test('reactToMessage posts the emoji', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => okResponse('/api/messages/msg-1/react', {'ok': true}),
      );

      await repository.reactToMessage('msg-1', '👍');

      verify(() => dio.post('/api/messages/msg-1/react', data: {'emoji': '👍'})).called(1);
    });

    test('removeReaction sends the emoji as a query parameter', () async {
      when(() => dio.delete(any(), queryParameters: any(named: 'queryParameters'))).thenAnswer(
        (_) async => okResponse('/api/messages/msg-1/react', {'ok': true}),
      );

      await repository.removeReaction('msg-1', '👍');

      verify(() => dio.delete('/api/messages/msg-1/react', queryParameters: {'emoji': '👍'})).called(1);
    });
  });

  group('MessageRepository.setTyping / markRead', () {
    test('setTyping posts isTyping', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => okResponse('/api/conversations/conv-1/typing', {'success': true}),
      );

      await repository.setTyping('conv-1', true);

      verify(() => dio.post('/api/conversations/conv-1/typing', data: {'isTyping': true})).called(1);
    });

    test('markRead posts upToMessageId', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => okResponse('/api/conversations/conv-1/read', {'success': true}),
      );

      await repository.markRead('conv-1', 'msg-9');

      verify(() => dio.post('/api/conversations/conv-1/read', data: {'upToMessageId': 'msg-9'})).called(1);
    });
  });
}
