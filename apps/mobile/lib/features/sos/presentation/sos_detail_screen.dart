import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/empty_state.dart';
import '../../auth/domain/auth_controller.dart';
import '../../messaging/presentation/conversation_thread_body.dart';
import '../data/sos_model.dart';
import '../data/sos_repository.dart';
import '../domain/sos_providers.dart';

const _timelineLabels = {
  'SOS_CREATED': 'SOS Created',
  'RADIUS_EXPANDED': 'Search radius expanded',
  'ESCALATED_SERVICE_PROVIDERS': 'Escalated to service providers',
  'ESCALATED_ADMIN': 'Escalated to admins',
  'HELPER_OFFERED': 'Helper offered to assist',
  'HELPER_WITHDRAWN': 'Helper withdrew offer',
  'HELPER_ACCEPTED': 'Helper accepted',
  'HELPER_REJECTED': 'Offer declined',
  'NAVIGATION_STARTED': 'Navigation started',
  'HELPER_ARRIVED': 'Helper arrived',
  'ASSISTANCE_STARTED': 'Assistance started',
  'ASSISTANCE_COMPLETED': 'Assistance completed',
  'SOS_RESOLVED': 'SOS resolved',
  'SOS_CANCELLED': 'Cancelled',
  'RATING_SUBMITTED': 'Rating submitted',
};

class SosDetailScreen extends ConsumerStatefulWidget {
  const SosDetailScreen({super.key, required this.alertId});

  final String alertId;

  @override
  ConsumerState<SosDetailScreen> createState() => _SosDetailScreenState();
}

class _SosDetailScreenState extends ConsumerState<SosDetailScreen> {
  bool _busy = false;
  String? _myOfferId;
  List<SOSPartner>? _partners;
  int _ratingValue = 5;
  final _ratingCommentController = TextEditingController();

  @override
  void dispose() {
    _ratingCommentController.dispose();
    super.dispose();
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _refresh() => ref.read(sosAlertDetailProvider(widget.alertId).notifier).refresh(widget.alertId);

  Future<void> _handleOffer() async {
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
      final offer = await ref.read(sosRepositoryProvider).offerHelp(
            widget.alertId,
            latitude: position?.latitude,
            longitude: position?.longitude,
          );
      if (mounted) setState(() => _myOfferId = offer.id);
    } on ApiException catch (e) {
      _showError(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _handleWithdraw() async {
    if (_myOfferId == null) return;
    setState(() => _busy = true);
    try {
      await ref.read(sosRepositoryProvider).withdrawOffer(widget.alertId, _myOfferId!);
      if (mounted) setState(() => _myOfferId = null);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _handleAccept(String offerId) async {
    setState(() => _busy = true);
    try {
      await ref.read(sosRepositoryProvider).acceptOffer(widget.alertId, offerId);
      await _refresh();
    } on ApiException catch (e) {
      _showError(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _handleReject(String offerId) async {
    setState(() => _busy = true);
    try {
      await ref.read(sosRepositoryProvider).rejectOffer(widget.alertId, offerId);
      await ref.read(sosOffersProvider(widget.alertId).notifier).refresh(widget.alertId);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _handleCancel() async {
    if (!mounted) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel SOS?'),
        content: const Text('All offers will expire and responders will be notified that the request is no longer available.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep SOS')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Cancel SOS')),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _busy = true);
    try {
      await ref.read(sosRepositoryProvider).cancelAlert(widget.alertId);
      await _refresh();
    } on ApiException catch (e) {
      _showError(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _handleStatus(SOSSessionDetail session, String status) async {
    setState(() => _busy = true);
    try {
      await ref.read(sosRepositoryProvider).updateSessionStatus(session.id, status);
      await _refresh();
    } on ApiException catch (e) {
      _showError(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _handleRate(SOSSessionDetail session) async {
    setState(() => _busy = true);
    try {
      await ref.read(sosRepositoryProvider).submitRating(
            session.id,
            _ratingValue,
            comment: _ratingCommentController.text.trim(),
          );
      await _refresh();
    } on ApiException catch (e) {
      _showError(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _loadPartners(num latitude, num longitude, String type) async {
    final partners =
        await ref.read(sosRepositoryProvider).getNearbyPartners(latitude.toDouble(), longitude.toDouble(), type: type);
    if (mounted) setState(() => _partners = partners);
  }

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(sosAlertDetailProvider(widget.alertId));
    final me = ref.watch(authControllerProvider).user;

    return Scaffold(
      appBar: AppBar(title: const Text('SOS Alert')),
      body: detailAsync.when(
        data: (detail) {
          final alert = detail.alert;
          final session = detail.session;
          final isReporter = alert.userId == me?.id;
          final isAdmin = me?.role == 'ADMIN';
          final isAssignedHelper = alert.assignedHelperId == me?.id;
          final isOpen = alert.assignedHelperId == null;
          final canOffer = isOpen && !isReporter && !isAdmin && _myOfferId == null;

          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              children: [
                _AlertHeader(alert: alert),
                const SizedBox(height: 12),
                if (canOffer)
                  FilledButton.icon(
                    onPressed: _busy ? null : _handleOffer,
                    icon: const Icon(Icons.sports_motorsports_outlined),
                    label: Text(_busy ? 'Sending…' : "I'm Coming"),
                  ),
                if (isOpen && _myOfferId != null)
                  OutlinedButton(
                    onPressed: _busy ? null : _handleWithdraw,
                    child: const Text('Cannot Help — Withdraw Offer'),
                  ),
                if (alert.status == 'ACTIVE' && (isReporter || isAdmin))
                  OutlinedButton.icon(
                    onPressed: _busy ? null : _handleCancel,
                    icon: const Icon(Icons.cancel_outlined),
                    style: OutlinedButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.error),
                    label: const Text('Cancel SOS'),
                  ),
                if (isOpen && (isReporter || isAdmin)) ...[
                  const SizedBox(height: 16),
                  _OffersSection(
                    alertId: widget.alertId,
                    busy: _busy,
                    onAccept: _handleAccept,
                    onReject: _handleReject,
                  ),
                ],
                if (session != null && (isAssignedHelper || isReporter || isAdmin)) ...[
                  const SizedBox(height: 16),
                  _SessionPanel(
                    alert: alert,
                    session: session,
                    isAssignedHelper: isAssignedHelper,
                    isReporter: isReporter,
                    busy: _busy,
                    partners: _partners,
                    ratingValue: _ratingValue,
                    ratingController: _ratingCommentController,
                    onRatingChanged: (v) => setState(() => _ratingValue = v),
                    onStatus: (status) => _handleStatus(session, status),
                    onRate: () => _handleRate(session),
                    onLoadPartners: _loadPartners,
                  ),
                  if (session.conversationId != null) ...[
                    const SizedBox(height: 16),
                    Text('Chat', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 420,
                      child: Card(
                        clipBehavior: Clip.antiAlias,
                        child: ConversationThreadBody(conversationId: session.conversationId!, fast: true),
                      ),
                    ),
                  ],
                ],
                const SizedBox(height: 16),
                Text('Timeline', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                _TimelineList(events: detail.timeline),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => EmptyState(
          icon: Icons.error_outline,
          title: "Couldn't load this alert",
          message: error is ApiException ? error.message : null,
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(sosAlertDetailProvider(widget.alertId)),
        ),
      ),
    );
  }
}

class _AlertHeader extends StatelessWidget {
  const _AlertHeader({required this.alert});

  final SOSAlert alert;

  @override
  Widget build(BuildContext context) {
    final isEmergency = alert.severity == 'EMERGENCY';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Chip(
                  label: Text(isEmergency ? '🔴 Emergency' : '🟠 Assistance'),
                  backgroundColor:
                      isEmergency ? Colors.red.withValues(alpha: 0.15) : Colors.orange.withValues(alpha: 0.15),
                ),
                const SizedBox(width: 8),
                Expanded(child: Text(sosTypeLabels[alert.type] ?? alert.type)),
              ],
            ),
            const SizedBox(height: 8),
            Text(alert.userName, style: Theme.of(context).textTheme.titleMedium),
            Text(
              describeSosLocation(
                formattedAddress: alert.formattedAddress,
                placeName: alert.placeName,
                area: alert.area,
                city: alert.city,
              ),
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (alert.description != null) ...[
              const SizedBox(height: 4),
              Text(alert.description!),
            ],
            if (alert.latitude != null && alert.longitude != null) ...[
              const SizedBox(height: 8),
              OutlinedButton.icon(
                icon: const Icon(Icons.map_outlined, size: 18),
                label: const Text('View on map'),
                onPressed: () => launchUrl(
                  Uri.parse('https://www.google.com/maps?q=${alert.latitude},${alert.longitude}'),
                  mode: LaunchMode.externalApplication,
                ),
              ),
            ],
            const SizedBox(height: 4),
            Text(
              alert.assignedHelperId != null
                  ? 'Status: ${alert.status} · Helper assigned'
                  : 'Status: ${alert.status} · ${alert.escalationTier.replaceAll('_', ' ').toLowerCase()} · ${alert.currentRadiusMeters ~/ 1000}km',
              style: Theme.of(context).textTheme.labelSmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _OffersSection extends ConsumerWidget {
  const _OffersSection({required this.alertId, required this.busy, required this.onAccept, required this.onReject});

  final String alertId;
  final bool busy;
  final void Function(String offerId) onAccept;
  final void Function(String offerId) onReject;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offersAsync = ref.watch(sosOffersProvider(alertId));
    return offersAsync.when(
      data: (offers) {
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Offers to help (${offers.length})', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                if (offers.isEmpty) const Text('No one has offered yet.'),
                ...offers.map((o) => Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(o.responderName, style: const TextStyle(fontWeight: FontWeight.w600)),
                                Text(
                                  [
                                    if (o.distanceMeters != null) '~${(o.distanceMeters! / 1000).toStringAsFixed(1)}km',
                                    if (o.etaMinutes != null) 'ETA ~${o.etaMinutes} min',
                                    if (o.responderPhone != null) o.responderPhone!,
                                  ].join(' · '),
                                  style: Theme.of(context).textTheme.labelSmall,
                                ),
                              ],
                            ),
                          ),
                          if (o.status == 'OFFERED') ...[
                            TextButton(onPressed: busy ? null : () => onAccept(o.id), child: const Text('Accept')),
                            TextButton(onPressed: busy ? null : () => onReject(o.id), child: const Text('Reject')),
                          ] else
                            Text(o.status, style: Theme.of(context).textTheme.labelSmall),
                        ],
                      ),
                    )),
              ],
            ),
          ),
        );
      },
      loading: () => const Padding(padding: EdgeInsets.all(16), child: LinearProgressIndicator()),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}

class _SessionPanel extends StatelessWidget {
  const _SessionPanel({
    required this.alert,
    required this.session,
    required this.isAssignedHelper,
    required this.isReporter,
    required this.busy,
    required this.partners,
    required this.ratingValue,
    required this.ratingController,
    required this.onRatingChanged,
    required this.onStatus,
    required this.onRate,
    required this.onLoadPartners,
  });

  final SOSAlert alert;
  final SOSSessionDetail session;
  final bool isAssignedHelper;
  final bool isReporter;
  final bool busy;
  final List<SOSPartner>? partners;
  final int ratingValue;
  final TextEditingController ratingController;
  final ValueChanged<int> onRatingChanged;
  final ValueChanged<String> onStatus;
  final VoidCallback onRate;
  final Future<void> Function(num latitude, num longitude, String type) onLoadPartners;

  @override
  Widget build(BuildContext context) {
    final other = isAssignedHelper ? session.rider : session.helper;
    final canRate = session.status == 'COMPLETED' && isReporter && session.rating == null;
    // This panel only renders for a privileged viewer (assigned helper/reporter/admin, gated by
    // the caller) — the same audience ADR-045 redaction never withholds coordinates from.
    final lat = alert.latitude!;
    final lng = alert.longitude!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    isAssignedHelper ? 'Rider: ${other.name}' : 'Helper: ${other.name}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                Chip(label: Text(session.status), visualDensity: VisualDensity.compact),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (other.phone != null)
                  OutlinedButton.icon(
                    icon: const Icon(Icons.call_outlined, size: 18),
                    label: Text('Call ${isAssignedHelper ? "Rider" : "Helper"}'),
                    onPressed: () => launchUrl(Uri.parse('tel:${other.phone}')),
                  ),
                OutlinedButton.icon(
                  icon: const Icon(Icons.navigation_outlined, size: 18),
                  label: const Text('Navigate'),
                  onPressed: () => launchUrl(
                    Uri.parse(
                      'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng',
                    ),
                    mode: LaunchMode.externalApplication,
                  ),
                ),
                if (isAssignedHelper) ...[
                  OutlinedButton.icon(
                    icon: const Icon(Icons.build_outlined, size: 18),
                    label: const Text('Share Mechanic'),
                    onPressed: () => onLoadPartners(lat, lng, 'MECHANIC'),
                  ),
                  OutlinedButton.icon(
                    icon: const Icon(Icons.local_gas_station_outlined, size: 18),
                    label: const Text('Share Fuel Contact'),
                    onPressed: () => onLoadPartners(lat, lng, 'FUEL_DELIVERY'),
                  ),
                ],
              ],
            ),
            if (partners != null) ...[
              const SizedBox(height: 8),
              if (partners!.isEmpty)
                const Text('No matching partners found nearby.', style: TextStyle(fontSize: 12))
              else ...[
                if (partners!.any((p) => p.latitude != null && p.longitude != null))
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: SizedBox(
                        height: 160,
                        child: FlutterMap(
                          options: MapOptions(
                            initialCenter: LatLng(lat.toDouble(), lng.toDouble()),
                            initialZoom: 12,
                          ),
                          children: [
                            TileLayer(
                              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                              userAgentPackageName: 'com.bikie.mobile',
                            ),
                            MarkerLayer(markers: [
                              Marker(
                                point: LatLng(lat.toDouble(), lng.toDouble()),
                                width: 36,
                                height: 36,
                                child: const Icon(Icons.sos, color: Colors.red, size: 30),
                              ),
                              for (final p in partners!)
                                if (p.latitude != null && p.longitude != null)
                                  Marker(
                                    point: LatLng(p.latitude!, p.longitude!),
                                    width: 36,
                                    height: 36,
                                    child: const Icon(Icons.location_pin, color: Colors.blue, size: 36),
                                  ),
                            ]),
                            const SimpleAttributionWidget(source: Text('OpenStreetMap contributors')),
                          ],
                        ),
                      ),
                    ),
                  ),
                ...partners!.map(
                  (p) => Text(
                    '${p.businessName} — ${p.userPhone ?? p.contactPerson1Mobile ?? "no phone on file"}',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ],
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              children: [
                if (isAssignedHelper && session.status == 'ACTIVE')
                  FilledButton(onPressed: busy ? null : () => onStatus('HELPER_ARRIVED'), child: const Text('Mark Arrived')),
                if (isAssignedHelper && session.status == 'HELPER_ARRIVED')
                  FilledButton(
                    onPressed: busy ? null : () => onStatus('ASSISTANCE_IN_PROGRESS'),
                    child: const Text('Start Assistance'),
                  ),
                if (isReporter && session.status == 'ASSISTANCE_IN_PROGRESS')
                  FilledButton(onPressed: busy ? null : () => onStatus('COMPLETED'), child: const Text('Mark Complete')),
                if (session.status != 'COMPLETED' && session.status != 'CANCELLED')
                  OutlinedButton(onPressed: busy ? null : () => onStatus('CANCELLED'), child: const Text('Cancel')),
              ],
            ),
            if (canRate) ...[
              const Divider(height: 24),
              Text('Rate your helper', style: Theme.of(context).textTheme.titleSmall),
              Row(
                children: List.generate(
                  5,
                  (i) => IconButton(
                    icon: Icon(i < ratingValue ? Icons.star : Icons.star_border, color: Colors.amber),
                    onPressed: () => onRatingChanged(i + 1),
                  ),
                ),
              ),
              TextField(
                controller: ratingController,
                decoration: const InputDecoration(labelText: 'Optional comment'),
                maxLines: 2,
              ),
              const SizedBox(height: 8),
              FilledButton(onPressed: busy ? null : onRate, child: const Text('Submit Rating')),
            ],
          ],
        ),
      ),
    );
  }
}

class _TimelineList extends StatelessWidget {
  const _TimelineList({required this.events});

  final List<SOSTimelineEvent> events;

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) {
      return const Text('No timeline events yet.', style: TextStyle(fontSize: 12));
    }
    return Column(
      children: events
          .map(
            (e) => ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.circle, size: 10),
              title: Text(_timelineLabels[e.type] ?? e.type),
              subtitle: Text(
                [if (e.actorName != null) e.actorName!, e.createdAt].join(' · '),
                style: const TextStyle(fontSize: 11),
              ),
            ),
          )
          .toList(),
    );
  }
}
