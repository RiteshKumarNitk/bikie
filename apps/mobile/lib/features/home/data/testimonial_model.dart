import 'package:freezed_annotation/freezed_annotation.dart';

part 'testimonial_model.freezed.dart';
part 'testimonial_model.g.dart';

/// Mirrors `packages/types/src/testimonial.ts` `TestimonialDTO`.
@freezed
class TestimonialModel with _$TestimonialModel {
  const factory TestimonialModel({
    required String id,
    required String authorName,
    String? authorAvatarUrl,
    String? authorLocation,
    required num rating,
    required String quote,
  }) = _TestimonialModel;

  factory TestimonialModel.fromJson(Map<String, dynamic> json) => _$TestimonialModelFromJson(json);
}
