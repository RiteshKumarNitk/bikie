import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/membership_model.dart';
import '../data/membership_repository.dart';

final activeMembershipProvider = FutureProvider.autoDispose<UserMembership?>((ref) {
  return ref.watch(membershipRepositoryProvider).getActive();
});

final membershipPlansProvider = FutureProvider.autoDispose<List<MembershipPlan>>((ref) {
  return ref.watch(membershipRepositoryProvider).getPlans();
});
