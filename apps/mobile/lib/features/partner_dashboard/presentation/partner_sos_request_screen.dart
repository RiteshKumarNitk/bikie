import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/empty_state.dart';
import '../../auth/domain/auth_controller.dart';
import '../../sos/data/sos_model.dart';
import '../../sos/data/sos_repository.dart';
import '../../sos/domain/sos_providers.dart';
import '../domain/partner_dashboard_providers.dart';

enum PartnerRequestState { needsResponse, waitingForRider, confirmed, unavailable }

/// Pure state derivation (ADR-044) — extracted so it's unit-testable without pumping the widget
/// tree. Never a separate source of truth: every input here is data `sos_detail_screen.dart`
/// already reads for the identical alert, just interpreted from the partner's point of view.
PartnerRequestState derivePartnerRequestState({
  required SOSAlert alert,
  required SOSSessionDetail? session,
  required SOSOffer? myOffer,
  required String? currentUserId,
}) {
  if (session != null && session.helper.id == currentUserId) {
    return PartnerRequestState.confirmed;
  }
  if (alert.assignedHelperId != null && alert.assignedHelperId != currentUserId) {
    return PartnerRequestState.unavailable;
  }
  if (alert.status != 'ACTIVE') {
    return PartnerRequestState.unavailable;
  }
  if (myOffer != null) {
    return PartnerRequestState.waitingForRider;
  }
  return PartnerRequestState.needsResponse;
}

const _statusChecklist = [
  ('ACTIVE', 'On the Way'),
  ('HELPER_ARRIVED', 'Arrived'),
  ('ASSISTANCE_IN_PROGRESS', 'Assistance Started'),
  ('COMPLETED', 'Completed'),
];

/// The partner-facing view of a single SOS request (ADR-044) — a purpose-built read on top of
/// the exact same offer/accept/session data `sos_detail_screen.dart` already polls; there is no
/// separate partner backend flow. State is derived from that data, not tracked separately, so it
/// can never drift from what `sos_detail_screen.dart` (still used by riders/nearby-rider helpers)
/// shows for the same alert.
class PartnerSosRequestScreen extends ConsumerStatefulWidget {
  const PartnerSosRequestScreen({super.key, required this.alertId});

  final String alertId;

  @override
  ConsumerState<PartnerSosRequestScreen> createState() => _PartnerSosRequestScreenState();
}

class _PartnerSosRequestScreenState extends ConsumerState<PartnerSosRequestScreen> {
  bool _busy = false;
  double? _distanceMeters;

  @override
  void initState() {
    super.initState();
    final location = ref.read(partnerLocationProvider);
    if (location != null) {
      final alert = ref.read(sosAlertDetailProvider(widget.alertId)).valueOrNull?.alert;
      if (alert != null) _computeDistance(location, alert);
    }
  }

  void _computeDistance(({double latitude, double longitude}) location, SOSAlert alert) {
    _distanceMeters = Geolocator.distanceBetween(
      location.latitude,
      location.longitude,
      alert.latitude.toDouble(),
      alert.longitude.toDouble(),
    );
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _refresh() async {
    await ref.read(sosAlertDetailProvider(widget.alertId).notifier).refresh(widget.alertId);
    await ref.read(sosOffersProvider(widget.alertId).notifier).refresh(widget.alertId);
  }

  Future<void> _handleAccept() async {
    setState(() => _busy = true);
    try {
      Position? position;
      try {
        var permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
        }
        if (permission != LocationPermission.denied && permission != LocationPermission.deniedForever) {
          position = await Geolocator.getCurrentPosition();
        }
      } catch (_) {
        // Offer without a location fix — distance/ETA just come back null.
      }
      await ref.read(sosRepositoryProvider).offerHelp(
            widget.alertId,
            latitude: position?.latitude,
            longitude: position?.longitude,
          );
      await _refresh();
    } on ApiException catch (e) {
      _showError(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _handleWithdraw(String offerId) async {
    setState(() => _busy = true);
    try {
      await ref.read(sosRepositoryProvider).withdrawOffer(widget.alertId, offerId);
      await _refresh();
    } on ApiException catch (e) {
      _showError(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _handleStatus(String sessionId, String status) async {
    setState(() => _busy = true);
    try {
      await ref.read(sosRepositoryProvider).updateSessionStatus(sessionId, status);
      await _refresh();
    } on ApiException catch (e) {
      _showError(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _viewLocation(SOSAlert alert) {
    launchUrl(
      Uri.parse('https://www.google.com/maps?q=${alert.latitude},${alert.longitude}'),
      mode: LaunchMode.externalApplication,
    );
  }

  void _navigate(SOSAlert alert) {
    launchUrl(
      Uri.parse('https://www.google.com/maps/dir/?api=1&destination=${alert.latitude},${alert.longitude}'),
      mode: LaunchMode.externalApplication,
    );
  }

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(sosAlertDetailProvider(widget.alertId));
    final offersAsync = ref.watch(sosOffersProvider(widget.alertId));
    final me = ref.watch(authControllerProvider).user;

    return Scaffold(
      appBar: AppBar(title: const Text('Assistance Request')),
      body: detailAsync.when(
        data: (detail) {
          final alert = detail.alert;
          final session = detail.session;
          final myOffer = offersAsync.valueOrNull
              ?.where((o) => o.responderId == me?.id && o.status == 'OFFERED')
              .firstOrNull;

          final requestState = derivePartnerRequestState(
            alert: alert,
            session: session,
            myOffer: myOffer,
            currentUserId: me?.id,
          );

          return RefreshIndicator(
            onRefresh: _refresh,
            child: switch (requestState) {
              PartnerRequestState.needsResponse => _NeedsResponseView(
                  alert: alert,
                  distanceMeters: _distanceMeters,
                  busy: _busy,
                  onAccept: _handleAccept,
                  onDecline: () => context.pop(),
                  onViewLocation: () => _viewLocation(alert),
                ),
              PartnerRequestState.waitingForRider => _WaitingForRiderView(
                  alert: alert,
                  offer: myOffer!,
                  busy: _busy,
                  onCancel: () => _handleWithdraw(myOffer.id),
                ),
              PartnerRequestState.confirmed => _ConfirmedView(
                  alert: alert,
                  session: session!,
                  busy: _busy,
                  onNavigate: () => _navigate(alert),
                  onStatus: (status) => _handleStatus(session.id, status),
                ),
              PartnerRequestState.unavailable => ListView(
                  padding: const EdgeInsets.all(16),
                  children: const [
                    EmptyState(
                      icon: Icons.check_circle_outline,
                      title: 'No longer available',
                      message: 'Another responder already has this request, or it has been closed.',
                    ),
                  ],
                ),
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => EmptyState(
          icon: Icons.error_outline,
          title: "Couldn't load this request",
          message: error is ApiException ? error.message : null,
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(sosAlertDetailProvider(widget.alertId)),
        ),
      ),
    );
  }
}

String _formatDistance(num meters) =>
    meters < 1000 ? '${meters.round()} m away' : '${(meters / 1000).toStringAsFixed(1)} km away';

class _NeedsResponseView extends StatelessWidget {
  const _NeedsResponseView({
    required this.alert,
    required this.distanceMeters,
    required this.busy,
    required this.onAccept,
    required this.onDecline,
    required this.onViewLocation,
  });

  final SOSAlert alert;
  final double? distanceMeters;
  final bool busy;
  final VoidCallback onAccept;
  final VoidCallback onDecline;
  final VoidCallback onViewLocation;

  @override
  Widget build(BuildContext context) {
    final isHighPriority = alert.severity == 'EMERGENCY';
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (isHighPriority)
                      Chip(
                        label: const Text('🔴 HIGH PRIORITY'),
                        backgroundColor: Colors.red.withValues(alpha: 0.15),
                      ),
                    const Spacer(),
                    if (distanceMeters != null)
                      Text(_formatDistance(distanceMeters!), style: Theme.of(context).textTheme.labelLarge),
                  ],
                ),
                const SizedBox(height: 8),
                Text(sosTypeLabels[alert.type] ?? alert.type, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 4),
                Text(
                  describeSosLocation(
                    formattedAddress: alert.formattedAddress,
                    placeName: alert.placeName,
                    area: alert.area,
                    city: alert.city,
                  ),
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 12),
                Text(alert.userName, style: Theme.of(context).textTheme.titleMedium),
                if (alert.riderVehicleType != null || alert.riderVehicleBrand != null)
                  Text(
                    [alert.riderVehicleBrand, alert.riderVehicleModel, alert.riderVehicleType]
                        .where((p) => p != null && p.isNotEmpty)
                        .join(' · '),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                if (alert.description != null) ...[
                  const SizedBox(height: 8),
                  Text(alert.description!),
                ],
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  icon: const Icon(Icons.map_outlined, size: 18),
                  label: const Text('View Location'),
                  onPressed: onViewLocation,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(onPressed: busy ? null : onDecline, child: const Text('DECLINE')),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton(
                onPressed: busy ? null : onAccept,
                child: Text(busy ? 'Sending…' : 'ACCEPT'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _WaitingForRiderView extends StatelessWidget {
  const _WaitingForRiderView({required this.alert, required this.offer, required this.busy, required this.onCancel});

  final SOSAlert alert;
  final SOSOffer offer;
  final bool busy;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Waiting for Rider Confirmation', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                const LinearProgressIndicator(),
                const SizedBox(height: 16),
                Text(alert.userName, style: Theme.of(context).textTheme.titleMedium),
                Text(sosTypeLabels[alert.type] ?? alert.type),
                if (offer.distanceMeters != null)
                  Text(_formatDistance(offer.distanceMeters!), style: Theme.of(context).textTheme.labelMedium),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        OutlinedButton(
          onPressed: busy ? null : onCancel,
          child: Text(busy ? 'Cancelling…' : 'Cancel Response'),
        ),
      ],
    );
  }
}

class _ConfirmedView extends StatelessWidget {
  const _ConfirmedView({
    required this.alert,
    required this.session,
    required this.busy,
    required this.onNavigate,
    required this.onStatus,
  });

  final SOSAlert alert;
  final SOSSessionDetail session;
  final bool busy;
  final VoidCallback onNavigate;
  final ValueChanged<String> onStatus;

  @override
  Widget build(BuildContext context) {
    final rider = session.rider;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('🟢 Assistance Confirmed', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                Text('Rider: ${rider.name}', style: Theme.of(context).textTheme.titleMedium),
                Text(sosTypeLabels[alert.type] ?? alert.type),
                Text(
                  describeSosLocation(
                    formattedAddress: alert.formattedAddress,
                    placeName: alert.placeName,
                    area: alert.area,
                    city: alert.city,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            FilledButton.icon(
              icon: const Icon(Icons.navigation_outlined, size: 18),
              label: const Text('Navigate'),
              onPressed: onNavigate,
            ),
            if (rider.phone != null)
              OutlinedButton.icon(
                icon: const Icon(Icons.call_outlined, size: 18),
                label: const Text('Call Rider'),
                onPressed: () => launchUrl(Uri.parse('tel:${rider.phone}')),
              ),
            if (session.conversationId != null)
              OutlinedButton.icon(
                icon: const Icon(Icons.chat_outlined, size: 18),
                label: const Text('Chat'),
                onPressed: () => context.push('/messages/${session.conversationId}'),
              ),
            if (session.status == 'ACTIVE')
              OutlinedButton.icon(
                icon: const Icon(Icons.check_circle_outline, size: 18),
                label: const Text("I've Arrived"),
                onPressed: busy ? null : () => onStatus('HELPER_ARRIVED'),
              ),
            if (session.status == 'HELPER_ARRIVED')
              FilledButton.icon(
                icon: const Icon(Icons.build_outlined, size: 18),
                label: const Text('Start Assistance'),
                onPressed: busy ? null : () => onStatus('ASSISTANCE_IN_PROGRESS'),
              ),
          ],
        ),
        const SizedBox(height: 20),
        Text('Status', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        _StatusChecklist(currentStatus: session.status),
      ],
    );
  }
}

class _StatusChecklist extends StatelessWidget {
  const _StatusChecklist({required this.currentStatus});

  final String currentStatus;

  @override
  Widget build(BuildContext context) {
    final currentIndex = _statusChecklist.indexWhere((s) => s.$1 == currentStatus);
    return Column(
      children: [
        const ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          leading: Icon(Icons.check_circle, size: 18, color: Colors.green),
          title: Text('Request Accepted'),
        ),
        const ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          leading: Icon(Icons.check_circle, size: 18, color: Colors.green),
          title: Text('Rider Confirmed'),
        ),
        for (var i = 0; i < _statusChecklist.length; i++)
          ListTile(
            dense: true,
            contentPadding: EdgeInsets.zero,
            leading: Icon(
              i < currentIndex || currentStatus == 'COMPLETED'
                  ? Icons.check_circle
                  : i == currentIndex
                      ? Icons.radio_button_checked
                      : Icons.radio_button_unchecked,
              size: 18,
              color: i <= currentIndex ? (i == currentIndex ? Theme.of(context).colorScheme.primary : Colors.green) : null,
            ),
            title: Text(_statusChecklist[i].$2),
          ),
      ],
    );
  }
}
