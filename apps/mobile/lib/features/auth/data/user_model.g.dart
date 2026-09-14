// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$UserModelImpl _$$UserModelImplFromJson(Map<String, dynamic> json) =>
    _$UserModelImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      phone: json['phone'] as String?,
      phoneNumber: json['phoneNumber'] as String?,
      image: json['image'] as String?,
      partnerStatus: json['partnerStatus'] as String?,
      // Server-authoritative and mutually exclusive (ADR-053) — the mobile UI routes an entire
      // Rider-vs-Service-Provider experience off this one field, so a response that omits it is
      // a broken auth contract, never a reason to guess. A missing/blank value here used to
      // silently fall back to 'RIDER', which could show a Service Provider account the Rider UI
      // with no error at all if the field were ever dropped upstream. Fail loudly instead: this
      // getter throws, caught by `apiGuard`/`AuthController.bootstrap`'s broad catch and surfaced
      // as a normal sign-in failure rather than a silent misroute.
      accountType: _requireAccountType(json['accountType']),
    );

String _requireAccountType(Object? value) {
  if (value == 'RIDER' || value == 'SERVICE_PROVIDER') return value as String;
  throw StateError(
    'Auth contract violation: server response is missing a valid accountType '
    '(got: ${value == null ? 'null' : '"$value"'}). Refusing to default to RIDER.',
  );
}

Map<String, dynamic> _$$UserModelImplToJson(_$UserModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'email': instance.email,
      'role': instance.role,
      'phone': instance.phone,
      'phoneNumber': instance.phoneNumber,
      'image': instance.image,
      'partnerStatus': instance.partnerStatus,
      'accountType': instance.accountType,
    };
