import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/membership_model.dart';
import '../data/membership_repository.dart';

final activeMembershipProvider = FutureProvider.autoDispose<UserMembership?>((ref) {
  return ref.watch(membershipRepositoryProvider).getActive();
});

/// See `MembershipRepository.getPendingSubscription`'s doc comment — distinct from
/// [activeMembershipProvider], never implies activation by itself.
final pendingSubscriptionProvider = FutureProvider.autoDispose<UserMembership?>((ref) {
  return ref.watch(membershipRepositoryProvider).getPendingSubscription();
});

final membershipPlansProvider = FutureProvider.autoDispose<List<MembershipPlan>>((ref) {
  return ref.watch(membershipRepositoryProvider).getPlans();
});
