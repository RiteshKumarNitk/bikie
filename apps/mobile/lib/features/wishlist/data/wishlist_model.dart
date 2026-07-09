import 'package:freezed_annotation/freezed_annotation.dart';

import '../../bikes/data/bike_models.dart';

part 'wishlist_model.freezed.dart';
part 'wishlist_model.g.dart';

/// Mirrors `packages/types/src/wishlist.ts` `WishlistItemDTO`.
@freezed
class WishlistItem with _$WishlistItem {
  const factory WishlistItem({
    required String id,
    required String createdAt,
    required BikeSummary bike,
  }) = _WishlistItem;

  factory WishlistItem.fromJson(Map<String, dynamic> json) => _$WishlistItemFromJson(json);
}
