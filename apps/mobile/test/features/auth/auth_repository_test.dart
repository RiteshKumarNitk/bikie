import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/storage/secure_storage.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';
import 'package:mobile/features/auth/data/user_model.dart';
import 'package:mocktail/mocktail.dart';

class _MockDio extends Mock implements Dio {}

class _MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  setUpAll(() {
    registerFallbackValue(RequestOptions(path: '/api/auth/sign-in/email'));
  });

  late _MockDio dio;
  late _MockFlutterSecureStorage flutterStorage;
  late SecureStorage storage;
  late AuthRepository repository;

  setUp(() {
    dio = _MockDio();
    flutterStorage = _MockFlutterSecureStorage();
    storage = SecureStorage(flutterStorage);
    repository = AuthRepository(dio, storage);

    // Default stubs so any call not explicitly asserted on doesn't throw.
    when(() => flutterStorage.write(key: any(named: 'key'), value: any(named: 'value')))
        .thenAnswer((_) async {});
    when(() => flutterStorage.delete(key: any(named: 'key'))).thenAnswer((_) async {});
  });

  Map<String, dynamic> buildUserJson() => {
        'id': 'user-1',
        'name': 'Rider One',
        'email': 'rider@bikie.app',
        'role': 'RENTER',
      };

  group('AuthRepository.signIn', () {
    test('posts credentials to /api/auth/sign-in/email and persists the bearer token', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/auth/sign-in/email'),
          statusCode: 200,
          headers: Headers.fromMap({
            'set-auth-token': ['secret-token-123'],
          }),
          data: {'user': buildUserJson()},
        ),
      );

      final user = await repository.signIn(email: 'rider@bikie.app', password: 'Rider@12345');

      expect(user, isA<UserModel>());
      expect(user.email, 'rider@bikie.app');
      expect(user.role, 'RENTER');

      verify(() => dio.post('/api/auth/sign-in/email', data: {'email': 'rider@bikie.app', 'password': 'Rider@12345'}))
          .called(1);
      verify(() => flutterStorage.write(key: 'bikie_auth_token', value: 'secret-token-123')).called(1);
    });

    test('does not attempt to persist a token when the response has no set-auth-token header', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/auth/sign-in/email'),
          statusCode: 200,
          data: {'user': buildUserJson()},
        ),
      );

      await repository.signIn(email: 'rider@bikie.app', password: 'Rider@12345');

      verifyNever(() => flutterStorage.write(key: any(named: 'key'), value: any(named: 'value')));
    });

    test('wraps invalid credentials (401) into a typed ApiException and does not store a token', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/api/auth/sign-in/email'),
          response: Response(
            requestOptions: RequestOptions(path: '/api/auth/sign-in/email'),
            statusCode: 401,
            data: {'error': 'Invalid email or password'},
          ),
          type: DioExceptionType.badResponse,
        ),
      );

      expect(
        () => repository.signIn(email: 'rider@bikie.app', password: 'wrong-password'),
        throwsA(
          isA<ApiException>()
              .having((e) => e.statusCode, 'statusCode', 401)
              .having((e) => e.isUnauthorized, 'isUnauthorized', true),
        ),
      );
      verifyNever(() => flutterStorage.write(key: any(named: 'key'), value: any(named: 'value')));
    });
  });

  group('AuthRepository.signUp', () {
    test('posts registration data to /api/auth/sign-up/email and persists the bearer token', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/auth/sign-up/email'),
          statusCode: 200,
          headers: Headers.fromMap({
            'set-auth-token': ['new-user-token'],
          }),
          data: {'user': buildUserJson()},
        ),
      );

      final user = await repository.signUp(name: 'Rider One', email: 'rider@bikie.app', password: 'Rider@12345');

      expect(user.name, 'Rider One');
      verify(
        () => dio.post(
          '/api/auth/sign-up/email',
          data: {'name': 'Rider One', 'email': 'rider@bikie.app', 'password': 'Rider@12345'},
        ),
      ).called(1);
      verify(() => flutterStorage.write(key: 'bikie_auth_token', value: 'new-user-token')).called(1);
    });

    test('wraps a validation error (400) into a typed ApiException with field errors', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/api/auth/sign-up/email'),
          response: Response(
            requestOptions: RequestOptions(path: '/api/auth/sign-up/email'),
            statusCode: 400,
            data: {
              'error': {
                'fieldErrors': {
                  'email': ['Email already in use']
                },
                'formErrors': [],
              },
            },
          ),
          type: DioExceptionType.badResponse,
        ),
      );

      expect(
        () => repository.signUp(name: 'Rider One', email: 'taken@bikie.app', password: 'Rider@12345'),
        throwsA(
          isA<ApiException>()
              .having((e) => e.isValidation, 'isValidation', true)
              .having((e) => e.fieldErrors?['email'], 'fieldErrors[email]', ['Email already in use']),
        ),
      );
    });
  });

  group('AuthRepository.getSession', () {
    test('returns null without calling the API when no token is stored', () async {
      when(() => flutterStorage.read(key: any(named: 'key'))).thenAnswer((_) async => null);

      final user = await repository.getSession();

      expect(user, isNull);
      verifyNever(() => dio.get(any()));
    });

    test('fetches the session and parses the user when a token is stored', () async {
      when(() => flutterStorage.read(key: any(named: 'key'))).thenAnswer((_) async => 'stored-token');
      when(() => dio.get(any())).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/auth/get-session'),
          statusCode: 200,
          data: {'user': buildUserJson()},
        ),
      );

      final user = await repository.getSession();

      expect(user, isNotNull);
      expect(user!.id, 'user-1');
      verify(() => dio.get('/api/auth/get-session')).called(1);
    });
  });

  group('AuthRepository.signOut', () {
    test('posts to /api/auth/sign-out and deletes the stored token even if the request throws', () async {
      when(() => dio.post(any())).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/api/auth/sign-out'),
          type: DioExceptionType.connectionError,
        ),
      );

      await expectLater(repository.signOut(), throwsA(isA<ApiException>()));

      verify(() => flutterStorage.delete(key: 'bikie_auth_token')).called(1);
    });
  });
}
