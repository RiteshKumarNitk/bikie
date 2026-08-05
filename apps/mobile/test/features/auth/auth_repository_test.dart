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

  group('AuthRepository.sendOtp', () {
    test('posts phoneNumber to the MSG91-backed otp/mobile/send endpoint (ADR-034)', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/otp/mobile/send'),
          statusCode: 200,
          data: {'success': true},
        ),
      );

      await repository.sendOtp('+919876543210');

      verify(
        () => dio.post('/api/otp/mobile/send', data: {'phoneNumber': '+919876543210'}),
      ).called(1);
    });
  });

  group('AuthRepository.updateUser', () {
    setUp(() {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => Response(requestOptions: RequestOptions(path: '/api/auth/update-user'), statusCode: 200, data: {}),
      );
    });

    test('posts only the non-null/non-empty fields to /api/auth/update-user', () async {
      await repository.updateUser(name: 'Priya Verma', image: 'https://res.cloudinary.com/demo/priya.jpg');

      verify(
        () => dio.post('/api/auth/update-user', data: {
          'name': 'Priya Verma',
          'image': 'https://res.cloudinary.com/demo/priya.jpg',
        }),
      ).called(1);
    });

    test('omits image when only name is provided', () async {
      await repository.updateUser(name: 'Priya Verma');

      verify(() => dio.post('/api/auth/update-user', data: {'name': 'Priya Verma'})).called(1);
    });

    test('makes no request at all when both name and image are absent', () async {
      await repository.updateUser();

      verifyNever(() => dio.post(any(), data: any(named: 'data')));
    });
  });

  group('AuthRepository.verifyOtp', () {
    test('persists the token from the JSON body (not a header) and parses the user', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/auth/phone-number/verify'),
          statusCode: 200,
          data: {'status': true, 'token': 'otp-session-token', 'user': buildUserJson()},
        ),
      );

      final user = await repository.verifyOtp(phoneNumber: '+919876543210', code: '123456');

      expect(user.id, 'user-1');
      verify(
        () => dio.post(
          '/api/auth/phone-number/verify',
          data: {'phoneNumber': '+919876543210', 'code': '123456'},
        ),
      ).called(1);
      verify(() => flutterStorage.write(key: 'bikie_auth_token', value: 'otp-session-token')).called(1);
    });

    test('wraps an invalid/expired code into a typed ApiException and does not store a token', () async {
      when(() => dio.post(any(), data: any(named: 'data'))).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/api/auth/phone-number/verify'),
          response: Response(
            requestOptions: RequestOptions(path: '/api/auth/phone-number/verify'),
            statusCode: 400,
            data: {'error': 'INVALID_OTP'},
          ),
          type: DioExceptionType.badResponse,
        ),
      );

      expect(
        () => repository.verifyOtp(phoneNumber: '+919876543210', code: '000000'),
        throwsA(isA<ApiException>().having((e) => e.isValidation, 'isValidation', true)),
      );
      verifyNever(() => flutterStorage.write(key: any(named: 'key'), value: any(named: 'value')));
    });
  });

  group('AuthRepository.phoneExists', () {
    test('parses exists/hasRealName from the query response', () async {
      when(() => dio.get(any(), queryParameters: any(named: 'queryParameters'))).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/auth-helpers/phone-exists'),
          statusCode: 200,
          data: {'exists': true, 'hasRealName': false},
        ),
      );

      final result = await repository.phoneExists('+919876543210');

      expect(result.exists, isTrue);
      expect(result.hasRealName, isFalse);
      verify(
        () => dio.get('/api/auth-helpers/phone-exists', queryParameters: {'phone': '+919876543210'}),
      ).called(1);
    });
  });

  group('AuthRepository.completePhoneSignup', () {
    test('PATCHes the chosen role and returns becamePartner', () async {
      when(() => dio.patch(any(), data: any(named: 'data'))).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/user/complete-phone-signup'),
          statusCode: 200,
          data: {'success': true, 'becamePartner': true},
        ),
      );

      final becamePartner = await repository.completePhoneSignup(role: 'PARTNER');

      expect(becamePartner, isTrue);
      verify(() => dio.patch('/api/user/complete-phone-signup', data: {'role': 'PARTNER'})).called(1);
    });
  });

  group('AuthRepository.fetchDevOtp', () {
    test('returns the code on success', () async {
      when(() => dio.get(any(), queryParameters: any(named: 'queryParameters'))).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/api/dev/otp'),
          statusCode: 200,
          data: {'code': '654321'},
        ),
      );

      final code = await repository.fetchDevOtp('+919876543210');

      expect(code, '654321');
    });

    test('silently returns null when the dev endpoint is unavailable (e.g. SHOW_OTP_TOAST=false)', () async {
      when(() => dio.get(any(), queryParameters: any(named: 'queryParameters'))).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: '/api/dev/otp'),
          response: Response(
            requestOptions: RequestOptions(path: '/api/dev/otp'),
            statusCode: 404,
          ),
          type: DioExceptionType.badResponse,
        ),
      );

      final code = await repository.fetchDevOtp('+919876543210');

      expect(code, isNull);
    });
  });
}
