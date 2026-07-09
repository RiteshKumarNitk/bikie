import 'package:freezed_annotation/freezed_annotation.dart';

part 'booking_model.freezed.dart';
part 'booking_model.g.dart';

@freezed
class BookingBikeRef with _$BookingBikeRef {
  const factory BookingBikeRef({
    required String slug,
    required String name,
    required String imageUrl,
    required String brand,
  }) = _BookingBikeRef;

  factory BookingBikeRef.fromJson(Map<String, dynamic> json) => _$BookingBikeRefFromJson(json);
}

/// Mirrors `packages/types/src/booking.ts` `BookingDTO`.
@freezed
class BookingModel with _$BookingModel {
  const factory BookingModel({
    required String id,
    required String status,
    required String startDate,
    required String endDate,
    required num totalPrice,
    required String pickupCity,
    required String createdAt,
    required BookingBikeRef bike,
    required bool hasReview,
  }) = _BookingModel;

  factory BookingModel.fromJson(Map<String, dynamic> json) => _$BookingModelFromJson(json);
}
