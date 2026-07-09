import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'wishlist_model.dart';

final wishlistRepositoryProvider = Provider<WishlistRepository>((ref) {
  return WishlistRepository(ref.watch(dioProvider));
});

class WishlistRepository {
  WishlistRepository(this._dio);

  final Dio _dio;

  Future<List<WishlistItem>> getAll() {
    return apiGuard(() async {
      final res = await _dio.get('/api/wishlist');
      return (res.data['items'] as List).map((e) => WishlistItem.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  Future<void> add(String bikeId) {
    return apiGuard(() => _dio.post('/api/wishlist/$bikeId'));
  }

  Future<void> remove(String bikeId) {
    return apiGuard(() => _dio.delete('/api/wishlist/$bikeId'));
  }
}
