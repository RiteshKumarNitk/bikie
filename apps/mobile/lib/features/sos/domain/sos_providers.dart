import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/sos_model.dart';
import '../data/sos_repository.dart';

final activeSosAlertsProvider = FutureProvider.autoDispose<List<SOSAlert>>((ref) {
  return ref.watch(sosRepositoryProvider).getActive();
});

final sosHistoryProvider = FutureProvider.autoDispose<List<SOSAlert>>((ref) {
  return ref.watch(sosRepositoryProvider).getHistory();
});
