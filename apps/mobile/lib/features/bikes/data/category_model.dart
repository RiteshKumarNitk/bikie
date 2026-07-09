import 'package:freezed_annotation/freezed_annotation.dart';

part 'category_model.freezed.dart';
part 'category_model.g.dart';

/// Mirrors `packages/types/src/category.ts` `CategoryDTO`.
@freezed
class CategoryModel with _$CategoryModel {
  const factory CategoryModel({
    required String id,
    required String slug,
    required String name,
    required String type,
    String? iconUrl,
    required String imageUrl,
  }) = _CategoryModel;

  factory CategoryModel.fromJson(Map<String, dynamic> json) => _$CategoryModelFromJson(json);
}
