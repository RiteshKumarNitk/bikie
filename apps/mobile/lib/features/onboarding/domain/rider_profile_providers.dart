import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/domain/auth_controller.dart';
import '../data/rider_profile_repository.dart';

/// Drives the dismissible Home banner reminding a rider to finish onboarding, mirroring web's
/// `ProfileCompletionBanner`. `autoDispose` + a fresh fetch on every Home mount means dismissing
/// it only hides it for that view — it reappears next time Home loads, same as web.
final profileCompletionReminderProvider = FutureProvider.autoDispose<bool>((ref) async {
  final role = ref.watch(authControllerProvider).user?.role;
  if (role != 'RENTER') return false;
  return ref.watch(riderProfileRepositoryProvider).needsCompletionReminder();
});
