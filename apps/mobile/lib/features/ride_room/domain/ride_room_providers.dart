import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/ride_room_models.dart';
import '../data/ride_room_repository.dart';

final rideRoomProvider = FutureProvider.autoDispose.family<RideRoom, String>((ref, slug) {
  return ref.watch(rideRoomRepositoryProvider).getRoom(slug);
});

final rideRoomAnnouncementsProvider = FutureProvider.autoDispose.family<List<Announcement>, String>((ref, slug) {
  return ref.watch(rideRoomRepositoryProvider).getAnnouncements(slug);
});

final rideRoomMediaProvider = FutureProvider.autoDispose.family<List<MediaItem>, String>((ref, slug) {
  return ref.watch(rideRoomRepositoryProvider).getMedia(slug);
});
