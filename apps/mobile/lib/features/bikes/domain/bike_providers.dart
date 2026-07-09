import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/bike_models.dart';
import '../data/bike_repository.dart';
import '../data/category_model.dart';

final featuredBikesProvider = FutureProvider.autoDispose<List<BikeSummary>>((ref) {
  return ref.watch(bikeRepositoryProvider).getFeatured();
});

final categoriesProvider = FutureProvider.autoDispose<List<CategoryModel>>((ref) {
  return ref.watch(bikeRepositoryProvider).getCategories();
});

final bikeSearchParamsProvider = StateProvider.autoDispose<BikeSearchParams>((ref) {
  return const BikeSearchParams();
});

final bikeSearchResultProvider = FutureProvider.autoDispose<BikeSearchResult>((ref) {
  final params = ref.watch(bikeSearchParamsProvider);
  return ref.watch(bikeRepositoryProvider).search(params);
});

final bikeDetailProvider = FutureProvider.autoDispose.family<BikeDetail, String>((ref, slug) {
  return ref.watch(bikeRepositoryProvider).getBySlug(slug);
});
