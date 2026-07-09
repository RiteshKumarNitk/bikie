import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/testimonial_model.dart';
import '../data/testimonial_repository.dart';

final testimonialsProvider = FutureProvider.autoDispose<List<TestimonialModel>>((ref) {
  return ref.watch(testimonialRepositoryProvider).getAll();
});
