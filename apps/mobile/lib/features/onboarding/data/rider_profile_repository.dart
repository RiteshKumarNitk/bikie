import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'rider_profile_model.dart';

final riderProfileRepositoryProvider = Provider<RiderProfileRepository>((ref) {
  return RiderProfileRepository(ref.watch(dioProvider));
});

/// `GET/PUT /api/rider-profile`, `POST /api/rider-profile/skip` — the same rider-profile API
/// the web `/onboarding` form and Settings "Rider Details" section both already use.
class RiderProfileRepository {
  RiderProfileRepository(this._dio);

  final Dio _dio;

  Future<void> save(RiderProfileInput input) {
    return apiGuard(() => _dio.put('/api/rider-profile', data: _toRequestJson(input)));
  }

  /// The existing profile, if any — `null` for someone who's never saved one. Field names on
  /// `RiderProfileDTO` (the `profile` key of this same response) match `RiderProfileInput`
  /// one-for-one, so its generated `fromJson` doubles as the response parser; the DTO's extra
  /// per-contact `id` field is simply ignored by `EmergencyContactInput.fromJson`. Used to
  /// prefill the form when this screen is reopened later from Profile > Rider Details, rather
  /// than showing a blank form every time as if nothing had ever been saved.
  Future<RiderProfileInput?> getMine() {
    return apiGuard(() async {
      final res = await _dio.get('/api/rider-profile');
      final profile = res.data['profile'];
      return profile == null ? null : RiderProfileInput.fromJson(profile as Map<String, dynamic>);
    });
  }

  Future<void> skip() {
    return apiGuard(() => _dio.post('/api/rider-profile/skip'));
  }

  /// `showCompletionReminder` on the same `GET /api/rider-profile` response the web Home banner
  /// reads (`RiderProfileService.needsCompletionReminder`) — true only for someone who skipped
  /// onboarding and never substantively filled the profile in since.
  Future<bool> needsCompletionReminder() {
    return apiGuard(() async {
      final res = await _dio.get('/api/rider-profile');
      return res.data['showCompletionReminder'] as bool? ?? false;
    });
  }

  /// `POST /api/upload` — the general-purpose Cloudinary upload endpoint (also used on web for
  /// bike/trip covers, chat attachments, etc.), used here for the onboarding rider photo.
  /// `TripRepository.uploadCoverImage` is the same four lines for the ride cover image — kept as
  /// two small copies rather than a shared upload repository, since each caller's file is scoped
  /// to its own feature and there's nothing else to share.
  Future<String> uploadPhoto(File file) {
    return apiGuard(() async {
      final data = FormData.fromMap({'file': await MultipartFile.fromFile(file.path)});
      final res = await _dio.post('/api/upload', data: data);
      return res.data['url'] as String;
    });
  }

  /// Every field on the wire is optional (`emptyToUndefined` server-side, see
  /// `rider-profile.schema.ts`) — but three enum fields (`governmentIdType`/`riderFrequency`/
  /// `ridingClubType`) are plain `.optional()` **without** that preprocessing, so they reject a
  /// literal `null` rather than treating it like an omitted key. Building the map by hand
  /// (rather than freezed's generated `toJson()`, which would include every null field) mirrors
  /// exactly what the web form's `handleSubmit` does: omit anything blank instead of sending it.
  Map<String, dynamic> _toRequestJson(RiderProfileInput input) {
    final contacts = input.emergencyContacts
        .where((c) => c.name.trim().isNotEmpty && c.phone.trim().isNotEmpty)
        .map((c) => {
              'name': c.name.trim(),
              'phone': c.phone.trim(),
              if (c.email != null && c.email!.trim().isNotEmpty) 'email': c.email!.trim(),
              if (c.relation != null && c.relation!.trim().isNotEmpty) 'relation': c.relation!.trim(),
            })
        .toList();

    return {
      if (_notBlank(input.drivingLicenceNumber)) 'drivingLicenceNumber': input.drivingLicenceNumber,
      if (_notBlank(input.drivingLicenceExpiry)) 'drivingLicenceExpiry': input.drivingLicenceExpiry,
      if (_notBlank(input.addressLine)) 'addressLine': input.addressLine,
      if (_notBlank(input.area)) 'area': input.area,
      if (_notBlank(input.district)) 'district': input.district,
      if (_notBlank(input.pincode)) 'pincode': input.pincode,
      if (_notBlank(input.country)) 'country': input.country,
      if (_notBlank(input.fatherName)) 'fatherName': input.fatherName,
      if (_notBlank(input.motherName)) 'motherName': input.motherName,
      if (_notBlank(input.dateOfBirth)) 'dateOfBirth': input.dateOfBirth,
      if (_notBlank(input.gender)) 'gender': input.gender,
      if (_notBlank(input.bloodGroup)) 'bloodGroup': input.bloodGroup,
      if (_notBlank(input.medicalHistory)) 'medicalHistory': input.medicalHistory,
      if (_notBlank(input.allergies)) 'allergies': input.allergies,
      if (_notBlank(input.vehicleType)) 'vehicleType': input.vehicleType,
      if (_notBlank(input.vehicleBrand)) 'vehicleBrand': input.vehicleBrand,
      if (_notBlank(input.vehicleModel)) 'vehicleModel': input.vehicleModel,
      if (_notBlank(input.vehicleRegistrationNumber)) 'vehicleRegistrationNumber': input.vehicleRegistrationNumber,
      if (_notBlank(input.governmentIdType)) 'governmentIdType': input.governmentIdType,
      if (_notBlank(input.governmentIdNumber)) 'governmentIdNumber': input.governmentIdNumber,
      if (_notBlank(input.riderFrequency)) 'riderFrequency': input.riderFrequency,
      if (_notBlank(input.ridingClubType)) 'ridingClubType': input.ridingClubType,
      if (input.ridingClubType == 'CLUB_MEMBER' && _notBlank(input.clubName)) 'clubName': input.clubName,
      if (contacts.isNotEmpty) 'emergencyContacts': contacts,
    };
  }

  bool _notBlank(String? value) => value != null && value.trim().isNotEmpty;
}
