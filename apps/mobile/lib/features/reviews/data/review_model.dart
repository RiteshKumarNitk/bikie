import 'package:freezed_annotation/freezed_annotation.dart';

part 'review_model.freezed.dart';
part 'review_model.g.dart';

@freezed
class ReviewAuthor with _$ReviewAuthor {
  const factory ReviewAuthor({required String name, String? image}) = _ReviewAuthor;

  factory ReviewAuthor.fromJson(Map<String, dynamic> json) => _$ReviewAuthorFromJson(json);
}

@freezed
class ReviewBikeRef with _$ReviewBikeRef {
  const factory ReviewBikeRef({required String slug, required String name}) = _ReviewBikeRef;

  factory ReviewBikeRef.fromJson(Map<String, dynamic> json) => _$ReviewBikeRefFromJson(json);
}

/// Mirrors `packages/types/src/review.ts` `ReviewDTO`.
@freezed
class ReviewModel with _$ReviewModel {
  const factory ReviewModel({
    required String id,
    required num rating,
    required String comment,
    required String createdAt,
    required ReviewAuthor author,
    ReviewBikeRef? bike,
  }) = _ReviewModel;

  factory ReviewModel.fromJson(Map<String, dynamic> json) => _$ReviewModelFromJson(json);
}
