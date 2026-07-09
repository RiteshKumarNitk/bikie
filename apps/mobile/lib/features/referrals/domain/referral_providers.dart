import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/referral_model.dart';
import '../data/referral_repository.dart';

final myReferralInfoProvider = FutureProvider.autoDispose<ReferralInfo>((ref) {
  return ref.watch(referralRepositoryProvider).getMine();
});
