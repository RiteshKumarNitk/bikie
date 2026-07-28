import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../../core/widgets/empty_state.dart';
import '../../messaging/domain/message_providers.dart';
import '../../messaging/presentation/conversation_thread_body.dart';
import '../data/ride_room_models.dart';
import '../data/ride_room_repository.dart';
import '../domain/ride_room_providers.dart';

/// `/trips/[slug]/room` — the collaboration hub for an approved ride
/// (Organizer + Approved Riders + Admin only, enforced server-side by
/// `assertRideRoomAccess`). Composes the *existing* group chat (no second
/// messaging stack) with Ride Room-specific panels: meeting point,
/// emergency contacts, members, announcements, shared media. Web has no
/// shipped UI for this yet (`.docs/TASKS.md` 8.5b: Planned) — this is a
/// mobile-first design against the already-complete backend contract.
class RideRoomScreen extends ConsumerWidget {
  const RideRoomScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roomAsync = ref.watch(rideRoomProvider(slug));

    return DefaultTabController(
      length: 5,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Ride Room'),
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: 'Chat'),
              Tab(text: 'Info'),
              Tab(text: 'Members'),
              Tab(text: 'Announcements'),
              Tab(text: 'Media'),
            ],
          ),
        ),
        body: AsyncValueView(
          value: roomAsync,
          onRetry: () => ref.invalidate(rideRoomProvider(slug)),
          data: (room) {
            if (room.isLocked) {
              return const EmptyState(
                icon: Icons.lock_outline,
                title: 'This Ride Room is locked',
                message: 'A moderator has locked this conversation.',
              );
            }
            return TabBarView(
              children: [
                ConversationThreadBody(conversationId: room.conversationId, fast: true),
                _InfoTab(slug: slug, room: room),
                _MembersTab(conversationId: room.conversationId),
                _AnnouncementsTab(slug: slug, room: room),
                _MediaTab(slug: slug),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _InfoTab extends ConsumerWidget {
  const _InfoTab({required this.slug, required this.room});

  final String slug;
  final RideRoom room;

  Future<void> _editMeetingPoint(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController(text: room.meetingPoint ?? '');
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Meeting point'),
        content: TextField(
          controller: controller,
          maxLength: 300,
          decoration: const InputDecoration(hintText: 'e.g. Toll Plaza, Outer Ring Road'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, controller.text.trim()), child: const Text('Save')),
        ],
      ),
    );
    if (result == null) return;
    try {
      await ref.read(rideRoomRepositoryProvider).updateMeetingPoint(slug, meetingPoint: result);
      ref.invalidate(rideRoomProvider(slug));
    } on ApiException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _editEmergencyContacts(BuildContext context, WidgetRef ref) async {
    final updated = await showModalBottomSheet<List<EmergencyContact>>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _EmergencyContactsSheet(initial: room.emergencyContacts),
    );
    if (updated == null) return;
    try {
      await ref.read(rideRoomRepositoryProvider).updateEmergencyContacts(slug, updated);
      ref.invalidate(rideRoomProvider(slug));
    } on ApiException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Expanded(child: Text('Meeting point', style: Theme.of(context).textTheme.titleMedium)),
            if (room.canManage)
              TextButton(onPressed: () => _editMeetingPoint(context, ref), child: const Text('Edit')),
          ],
        ),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Icon(Icons.pin_drop_outlined, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    (room.meetingPoint == null || room.meetingPoint!.isEmpty)
                        ? 'No meeting point set yet.'
                        : room.meetingPoint!,
                  ),
                ),
                if (room.meetingLat != null && room.meetingLng != null)
                  IconButton(
                    tooltip: 'Open in Maps',
                    icon: const Icon(Icons.map_outlined),
                    onPressed: () => launchUrl(
                      Uri.parse('https://www.google.com/maps?q=${room.meetingLat},${room.meetingLng}'),
                      mode: LaunchMode.externalApplication,
                    ),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(child: Text('Emergency contacts', style: Theme.of(context).textTheme.titleMedium)),
            if (room.canManage)
              TextButton(onPressed: () => _editEmergencyContacts(context, ref), child: const Text('Edit')),
          ],
        ),
        const SizedBox(height: 8),
        if (room.emergencyContacts.isEmpty)
          const Card(
            child: Padding(padding: EdgeInsets.all(14), child: Text('No emergency contacts added yet.')),
          )
        else
          ...room.emergencyContacts.map(
            (c) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: const Icon(Icons.emergency_outlined),
                title: Text(c.name),
                subtitle: Text('${c.relation} · ${c.phone}'),
                trailing: IconButton(
                  icon: const Icon(Icons.call_outlined),
                  onPressed: () => launchUrl(Uri.parse('tel:${c.phone}')),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _EmergencyContactsSheet extends StatefulWidget {
  const _EmergencyContactsSheet({required this.initial});

  final List<EmergencyContact> initial;

  @override
  State<_EmergencyContactsSheet> createState() => _EmergencyContactsSheetState();
}

class _EmergencyContactsSheetState extends State<_EmergencyContactsSheet> {
  late final List<Map<String, TextEditingController>> _rows = widget.initial
      .map(
        (c) => {
          'name': TextEditingController(text: c.name),
          'phone': TextEditingController(text: c.phone),
          'relation': TextEditingController(text: c.relation),
        },
      )
      .toList();

  void _addRow() {
    if (_rows.length >= 10) return;
    setState(() => _rows.add({
          'name': TextEditingController(),
          'phone': TextEditingController(),
          'relation': TextEditingController(),
        }));
  }

  void _save() {
    final contacts = _rows
        .map((r) => EmergencyContact(
              name: r['name']!.text.trim(),
              phone: r['phone']!.text.trim(),
              relation: r['relation']!.text.trim(),
            ))
        .where((c) => c.name.isNotEmpty && c.phone.isNotEmpty && c.relation.isNotEmpty)
        .toList();
    Navigator.pop(context, contacts);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Emergency contacts', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            for (var i = 0; i < _rows.length; i++) ...[
              Row(
                children: [
                  Expanded(
                    child: Column(
                      children: [
                        TextField(controller: _rows[i]['name'], decoration: const InputDecoration(labelText: 'Name')),
                        const SizedBox(height: 8),
                        TextField(controller: _rows[i]['phone'], decoration: const InputDecoration(labelText: 'Phone')),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _rows[i]['relation'],
                          decoration: const InputDecoration(labelText: 'Relation'),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.remove_circle_outline),
                    onPressed: () => setState(() => _rows.removeAt(i)),
                  ),
                ],
              ),
              const Divider(height: 24),
            ],
            if (_rows.length < 10)
              OutlinedButton.icon(
                onPressed: _addRow,
                icon: const Icon(Icons.add),
                label: const Text('Add contact'),
              ),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _save, child: const Text('Save')),
          ],
        ),
      ),
    );
  }
}

class _MembersTab extends ConsumerWidget {
  const _MembersTab({required this.conversationId});

  final String conversationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Sourced from the room's group Conversation's real participant list
    // (`GET /api/conversations`) rather than `TripDetailDTO.members`, which
    // `TripService.getBySlug` never actually populates server-side.
    final conversations = ref.watch(conversationsProvider);

    return AsyncValueView(
      value: conversations,
      onRetry: () => ref.invalidate(conversationsProvider),
      data: (list) {
        final match = list.where((c) => c.id == conversationId).toList();
        final participants = match.isEmpty ? const [] : match.first.participants;
        if (participants.isEmpty) {
          return const EmptyState(icon: Icons.people_outline, title: 'No members yet');
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: participants.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final p = participants[index];
            return Card(
              child: ListTile(
                leading: CircleAvatar(child: Text(p.name.isNotEmpty ? p.name[0].toUpperCase() : '?')),
                title: Text(p.name),
                subtitle: Text(p.role),
              ),
            );
          },
        );
      },
    );
  }
}

class _AnnouncementsTab extends ConsumerWidget {
  const _AnnouncementsTab({required this.slug, required this.room});

  final String slug;
  final RideRoom room;

  Future<void> _post(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController();
    final content = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('New announcement'),
        content: TextField(controller: controller, maxLines: 4, maxLength: 1000, autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, controller.text.trim()), child: const Text('Post')),
        ],
      ),
    );
    if (content == null || content.isEmpty) return;
    try {
      await ref.read(rideRoomRepositoryProvider).postAnnouncement(slug, content);
      ref.invalidate(rideRoomAnnouncementsProvider(slug));
    } on ApiException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _delete(BuildContext context, WidgetRef ref, String id) async {
    try {
      await ref.read(rideRoomRepositoryProvider).deleteAnnouncement(slug, id);
      ref.invalidate(rideRoomAnnouncementsProvider(slug));
    } on ApiException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final announcements = ref.watch(rideRoomAnnouncementsProvider(slug));

    return Scaffold(
      floatingActionButton: room.canManage
          ? FloatingActionButton(onPressed: () => _post(context, ref), child: const Icon(Icons.campaign_outlined))
          : null,
      body: AsyncValueView(
        value: announcements,
        onRetry: () => ref.invalidate(rideRoomAnnouncementsProvider(slug)),
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(icon: Icons.campaign_outlined, title: 'No announcements yet');
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(rideRoomAnnouncementsProvider(slug)),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final a = list[index];
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(child: Text(a.authorName, style: Theme.of(context).textTheme.titleSmall)),
                            if (room.canManage)
                              IconButton(
                                icon: Icon(Icons.delete_outline, size: 18, color: Theme.of(context).colorScheme.error),
                                onPressed: () => _delete(context, ref, a.id),
                              ),
                          ],
                        ),
                        Text(a.content),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _MediaTab extends ConsumerWidget {
  const _MediaTab({required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final media = ref.watch(rideRoomMediaProvider(slug));

    return AsyncValueView(
      value: media,
      onRetry: () => ref.invalidate(rideRoomMediaProvider(slug)),
      data: (list) {
        if (list.isEmpty) {
          return const EmptyState(
            icon: Icons.perm_media_outlined,
            title: 'No shared media yet',
            message: 'Images and files shared in the group chat will show up here.',
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: list.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final m = list[index];
            return Card(
              child: ListTile(
                leading: Icon(m.type == 'IMAGE' ? Icons.image_outlined : Icons.insert_drive_file_outlined),
                title: Text(m.fileName),
                subtitle: Text('${(m.sizeBytes / 1024).toStringAsFixed(0)} KB'),
              ),
            );
          },
        );
      },
    );
  }
}
