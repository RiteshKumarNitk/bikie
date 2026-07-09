import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/review_model.dart';
import '../data/review_repository.dart';

final bikeReviewsProvider = FutureProvider.autoDispose.family<List<ReviewModel>, String>((ref, slug) {
  return ref.watch(reviewRepositoryProvider).getForBike(slug);
});

final myReviewsProvider = FutureProvider.autoDispose<List<ReviewModel>>((ref) {
  return ref.watch(reviewRepositoryProvider).getMine();
});
