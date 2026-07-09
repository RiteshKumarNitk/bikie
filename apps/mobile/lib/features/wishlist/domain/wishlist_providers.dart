import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/wishlist_model.dart';
import '../data/wishlist_repository.dart';

final wishlistProvider = AsyncNotifierProvider.autoDispose<WishlistNotifier, List<WishlistItem>>(
  WishlistNotifier.new,
);

class WishlistNotifier extends AutoDisposeAsyncNotifier<List<WishlistItem>> {
  @override
  Future<List<WishlistItem>> build() {
    return ref.watch(wishlistRepositoryProvider).getAll();
  }

  bool isWishlisted(String bikeId) {
    return state.valueOrNull?.any((item) => item.bike.id == bikeId) ?? false;
  }

  Future<void> toggle(String bikeId) async {
    final repository = ref.read(wishlistRepositoryProvider);
    final wishlisted = isWishlisted(bikeId);
    if (wishlisted) {
      await repository.remove(bikeId);
    } else {
      await repository.add(bikeId);
    }
    ref.invalidateSelf();
    await future;
  }
}
