import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/domain/auth_controller.dart';
import '../data/rider_profile_repository.dart';

/// Drives the "finish your profile" nudge on Profile's Rider Details tile (mirrors web's
/// `ProfileCompletionBanner`). `autoDispose`, so it re-checks every time Profile is opened.
final profileCompletionReminderProvider = FutureProvider.autoDispose<bool>((ref) async {
  final role = ref.watch(authControllerProvider).user?.role;
  if (role != 'RENTER') return false;
  return ref.watch(riderProfileRepositoryProvider).needsCompletionReminder();
});
