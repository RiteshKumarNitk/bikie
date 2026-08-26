import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/async_value_view.dart';
import '../../auth/domain/auth_controller.dart';
import '../../auth/domain/auth_state.dart';
import '../data/trip_models.dart';
import '../data/trip_repository.dart';
import '../domain/trip_providers.dart';

class TripDetailScreen extends ConsumerWidget {
  const TripDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(tripDetailProvider(slug));

    return Scaffold(
      body: AsyncValueView(
        value: detail,
        onRetry: () => ref.invalidate(tripDetailProvider(slug)),
        data: (trip) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(tripDetailProvider(slug)),
          child: CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 240,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(trip.title),
                  background: Image.network(trip.imageUrl, fit: BoxFit.cover),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          Chip(label: Text(trip.type.replaceAll('_', ' '))),
                          Chip(label: Text(trip.difficulty)),
                          Chip(
                            label: Text(
                              trip.seatsLeft > 0 ? '${trip.seatsLeft}/${trip.seatsTotal} seats left' : 'Fully booked',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if ((trip.destinationName != null && trip.destinationName!.isNotEmpty) || trip.destination != null) ...[
                        _InfoRow(icon: Icons.place_outlined, label: trip.destinationName ?? trip.destination!.name),
                        const SizedBox(height: 8),
                      ],
                      _InfoRow(
                        icon: Icons.calendar_today_outlined,
                        label: '${_formatDate(trip.startDate)} → ${_formatDate(trip.endDate)}',
                      ),
                      if (trip.meetingPoint != null && trip.meetingPoint!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        _InfoRow(icon: Icons.pin_drop_outlined, label: trip.meetingPoint!),
                      ],
                      if (trip.meetingLat != null && trip.meetingLng != null) ...[
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: SizedBox(
                            height: 160,
                            child: FlutterMap(
                              options: MapOptions(
                                initialCenter: LatLng(trip.meetingLat!, trip.meetingLng!),
                                initialZoom: 14,
                              ),
                              children: [
                                TileLayer(
                                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                  userAgentPackageName: 'com.bikie.mobile',
                                ),
                                MarkerLayer(markers: [
                                  Marker(
                                    point: LatLng(trip.meetingLat!, trip.meetingLng!),
                                    width: 40,
                                    height: 40,
                                    child: const Icon(Icons.location_pin, color: Colors.red, size: 40),
                                  ),
                                ]),
                                const SimpleAttributionWidget(source: Text('OpenStreetMap contributors')),
                              ],
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      Text(trip.description, style: Theme.of(context).textTheme.bodyMedium),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundImage: trip.organizer.image != null ? NetworkImage(trip.organizer.image!) : null,
                            child: trip.organizer.image == null ? Text(trip.organizer.name[0]) : null,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text('Organized by ${trip.organizer.name}', style: Theme.of(context).textTheme.bodyMedium),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Text('Price', style: Theme.of(context).textTheme.bodyMedium),
                          const Spacer(),
                          Text(
                            trip.price > 0 ? '₹${trip.price.toStringAsFixed(0)}' : 'Free',
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                        ],
                      ),
                      const Divider(height: 40),
                      _RideActionsSection(trip: trip),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _formatDate(String iso) => iso.split('T').first;

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
        const SizedBox(width: 8),
        Expanded(child: Text(label, style: Theme.of(context).textTheme.bodyMedium)),
      ],
    );
  }
}

/// Mirrors the web's `RideActionsPanel.tsx`: branches on session + organizer
/// vs. rider, entirely against the existing Rides API — no new endpoints.
class _RideActionsSection extends ConsumerWidget {
  const _RideActionsSection({required this.trip});

  final TripDetail trip;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);

    if (authState.status != AuthStatus.authenticated) {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: () => context.push('/login'),
          child: const Text('Sign in to request a spot'),
        ),
      );
    }

    final isOrganizer = authState.user!.id == trip.organizer.id;
    return isOrganizer ? _OrganizerPanel(trip: trip) : _RiderPanel(trip: trip);
  }
}

class _GroupChatLink extends ConsumerWidget {
  const _GroupChatLink({required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conversationId = ref.watch(rideGroupConversationProvider(slug));
    return conversationId.when(
      data: (id) {
        if (id == null) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.only(top: 12),
          child: SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => context.push('/trips/$slug/room'),
              icon: const Icon(Icons.forum_outlined),
              label: const Text('Open Ride Room'),
            ),
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}

class _RiderPanel extends ConsumerStatefulWidget {
  const _RiderPanel({required this.trip});

  final TripDetail trip;

  @override
  ConsumerState<_RiderPanel> createState() => _RiderPanelState();
}

class _RiderPanelState extends ConsumerState<_RiderPanel> {
  final _messageController = TextEditingController();
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  String get _slug => widget.trip.slug;

  Future<void> _requestToJoin() async {
    setState(() {
      _isSubmitting = true;
      _error = null;
    });
    try {
      await ref.read(tripRepositoryProvider).requestToJoin(_slug, message: _messageController.text);
      ref.invalidate(myRequestStatusProvider(_slug));
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _cancelRequest() async {
    setState(() => _isSubmitting = true);
    try {
      await ref.read(tripRepositoryProvider).leaveRide(_slug);
      ref.invalidate(myRequestStatusProvider(_slug));
      ref.invalidate(tripDetailProvider(_slug));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final requestAsync = ref.watch(myRequestStatusProvider(_slug));

    return requestAsync.when(
      loading: () => const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator())),
      error: (error, _) => Text(
        error is ApiException ? error.message : "Couldn't load your request status.",
        style: TextStyle(color: Theme.of(context).colorScheme.error),
      ),
      data: (request) {
        if (request?.status == 'APPROVED') {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
const _StatusBanner(
                icon: Icons.celebration_outlined,
                color: AppColors.success,
                text: "You're approved for this ride 🎉",
              ),
              _GroupChatLink(slug: _slug),
              TextButton(
                onPressed: _isSubmitting ? null : _cancelRequest,
                child: const Text('Leave this ride'),
              ),
            ],
          );
        }

        if (request?.status == 'PENDING') {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _StatusBanner(
                icon: Icons.hourglass_top_outlined,
                color: AppTheme.accentTextOf(context),
                text: 'Request sent — waiting on the organizer to approve.',
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: _isSubmitting ? null : _cancelRequest,
                child: const Text('Cancel request'),
              ),
            ],
          );
        }

        final wasRejected = request?.status == 'REJECTED';
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (wasRejected) ...[
              Text(
                "Your previous request wasn't approved. You can send a new one.",
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 12),
            ],
            TextField(
              controller: _messageController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Message to the organizer (optional)',
                hintText: 'Experience, bike, anything they should know…',
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: (_isSubmitting || widget.trip.seatsLeft <= 0) ? null : _requestToJoin,
              child: Text(widget.trip.seatsLeft > 0 ? 'Request to Join' : 'Fully Booked'),
            ),
          ],
        );
      },
    );
  }
}

class _OrganizerPanel extends ConsumerStatefulWidget {
  const _OrganizerPanel({required this.trip});

  final TripDetail trip;

  @override
  ConsumerState<_OrganizerPanel> createState() => _OrganizerPanelState();
}

class _OrganizerPanelState extends ConsumerState<_OrganizerPanel> {
  bool _cancelling = false;

  Future<void> _cancelRide() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel this ride?'),
        content: const Text(
          'This cancels the ride for everyone, locks the Ride Room chat, and notifies every '
          "approved member and pending requester. This can't be undone.",
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Back')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Yes, cancel ride', style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _cancelling = true);
    try {
      await ref.read(tripRepositoryProvider).cancelTrip(widget.trip.slug);
      ref.invalidate(tripDetailProvider(widget.trip.slug));
      if (mounted) context.pop();
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final trip = widget.trip;
    final requestsAsync = ref.watch(rideRequestsForProvider(trip.slug));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        OutlinedButton(
          onPressed: _cancelling ? null : _cancelRide,
          style: OutlinedButton.styleFrom(
            foregroundColor: Theme.of(context).colorScheme.error,
            side: BorderSide(color: Theme.of(context).colorScheme.error.withValues(alpha: 0.4)),
          ),
          child: Text(_cancelling ? 'Cancelling…' : 'Cancel Ride'),
        ),
        const SizedBox(height: 8),
        _GroupChatLink(slug: trip.slug),
        const SizedBox(height: 16),
        Text('Join Requests', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        requestsAsync.when(
          loading: () => const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator())),
          error: (error, _) => Text(
            error is ApiException ? error.message : "Couldn't load requests.",
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
          data: (requests) {
            if (requests.isEmpty) {
              return Text('No pending requests yet.', style: Theme.of(context).textTheme.bodySmall);
            }
            return Column(
              children: requests
                  .map((r) => _RequestCard(
                        request: r,
                        onDecided: () {
                          ref.invalidate(rideRequestsForProvider(trip.slug));
                          ref.invalidate(tripDetailProvider(trip.slug));
                        },
                      ))
                  .toList(),
            );
          },
        ),
      ],
    );
  }
}

class _RequestCard extends ConsumerStatefulWidget {
  const _RequestCard({required this.request, required this.onDecided});

  final RideJoinRequest request;
  final VoidCallback onDecided;

  @override
  ConsumerState<_RequestCard> createState() => _RequestCardState();
}

class _RequestCardState extends ConsumerState<_RequestCard> {
  bool _isDeciding = false;

  Future<void> _decide(bool approve) async {
    setState(() => _isDeciding = true);
    try {
      final repo = ref.read(tripRepositoryProvider);
      if (approve) {
        await repo.approveRequest(widget.request.tripSlug, widget.request.id);
      } else {
        await repo.rejectRequest(widget.request.tripSlug, widget.request.id);
      }
      widget.onDecided();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _isDeciding = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final rider = widget.request.rider;
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundImage: rider.image != null ? NetworkImage(rider.image!) : null,
                  child: rider.image == null ? Text(rider.name[0]) : null,
                ),
                const SizedBox(width: 10),
                Expanded(child: Text(rider.name, style: Theme.of(context).textTheme.titleSmall)),
              ],
            ),
            if (widget.request.message != null && widget.request.message!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(widget.request.message!, style: Theme.of(context).textTheme.bodySmall),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isDeciding ? null : () => _decide(true),
                    child: const Text('Approve'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isDeciding ? null : () => _decide(false),
                    child: const Text('Reject'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({required this.icon, required this.color, required this.text});

  final IconData icon;
  final Color color;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: TextStyle(color: color, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }
}
