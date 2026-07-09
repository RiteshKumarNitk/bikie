import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/destination_models.dart';
import '../data/destination_repository.dart';

final popularDestinationsProvider = FutureProvider.autoDispose<List<DestinationSummary>>((ref) {
  return ref.watch(destinationRepositoryProvider).getPopular();
});

final allDestinationsProvider = FutureProvider.autoDispose<List<DestinationSummary>>((ref) {
  return ref.watch(destinationRepositoryProvider).getAll();
});

final destinationDetailProvider = FutureProvider.autoDispose.family<DestinationDetail, String>((ref, slug) {
  return ref.watch(destinationRepositoryProvider).getBySlug(slug);
});
