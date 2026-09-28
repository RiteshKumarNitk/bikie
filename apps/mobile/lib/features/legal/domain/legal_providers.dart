import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/legal_models.dart';
import '../data/legal_repository.dart';

/// The currently published legal documents. `autoDispose`, so each visit to signup fetches the
/// live versions (a stale copy would be rejected server-side as outdated).
final currentLegalDocumentsProvider = FutureProvider.autoDispose<CurrentLegalDocuments>((ref) {
  return ref.watch(legalRepositoryProvider).getCurrent();
});
