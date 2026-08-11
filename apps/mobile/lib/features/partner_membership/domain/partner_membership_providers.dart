import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/partner_membership_model.dart';
import '../data/partner_membership_repository.dart';

final activePartnerMembershipProvider = FutureProvider.autoDispose<PartnerMembership?>((ref) {
  return ref.watch(partnerMembershipRepositoryProvider).getActive();
});

final partnerMembershipPlansProvider = FutureProvider.autoDispose<List<PartnerMembershipPlan>>((ref) {
  return ref.watch(partnerMembershipRepositoryProvider).getPlans();
});
