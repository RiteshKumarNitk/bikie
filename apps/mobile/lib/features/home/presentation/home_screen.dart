import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../nearby_riders/domain/nearby_riders_providers.dart';
import '../../nearby_riders/domain/rider_findability_service.dart';
import '../../nearby_riders/domain/rider_location_permission.dart';
import '../../sos/data/sos_model.dart';
import '../../sos/domain/sos_providers.dart';
import '../../sos/presentation/send_sos_sheet.dart';

/// Rider Home — an emergency-first screen whose one job is starting an SOS. The single big
/// button opens the existing `SendSosSheet` unchanged (Red/Amber choice, category, GPS capture,
/// dispatch report all live there), so this screen owns no SOS logic of its own.
///
/// The marketplace content that used to follow the SOS cards moved to where it already had a
/// home: featured bikes → Bikes tab, destinations → Profile, profile-completion reminder →
/// Profile's "Rider Details" tile. SOS history and nearby alerts — previously reachable only
/// from a push notification — are this screen's app-bar actions.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _openSos(BuildContext context, WidgetRef ref) async {
    await showSendSosSheet(context);
    // Picks up an alert that was just sent so the "active" banner appears right away.
    ref.invalidate(mySosAlertsProvider);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('BIKIE', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1)),
        actions: [
          IconButton(
            icon: const Icon(Icons.crisis_alert_outlined),
            tooltip: 'Nearby SOS alerts',
            onPressed: () => context.push('/sos'),
          ),
          IconButton(
            icon: const Icon(Icons.history_outlined),
            tooltip: 'SOS history',
            onPressed: () => context.push('/sos/history'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(mySosAlertsProvider);
          ref.invalidate(sharingEnabledProvider);
        },
        child: LayoutBuilder(
          builder: (context, constraints) {
            // Sized from the space actually available, so it stays dominant on a large phone
            // yet leaves room for the status rows on a small one or in landscape.
            final shortestSide = constraints.maxWidth < constraints.maxHeight ? constraints.maxWidth : constraints.maxHeight;
            final buttonSize = (shortestSide * 0.6).clamp(152.0, 260.0);

            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight - 32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const _MyActiveSosAlertBanner(),
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      child: _SosHero(size: buttonSize, onPressed: () => _openSos(context, ref)),
                    ),
                    const _LocationSharingRow(),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

// Same brand red as `send_sos_sheet.dart`'s Red Alert (web `PanicAlertCards.tsx` #e8000d).
const _sosRed = Color(0xFFE8000D);

class _SosHero extends StatelessWidget {
  const _SosHero({required this.size, required this.onPressed});

  final double size;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Column(
      children: [
        Text(
          'Need help on the road?',
          textAlign: TextAlign.center,
          style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        Text(
          'Tap SOS to alert nearby riders, service providers and your emergency contacts.',
          textAlign: TextAlign.center,
          style: textTheme.bodyMedium,
        ),
        const SizedBox(height: 28),
        Semantics(
          button: true,
          label: 'Send SOS alert',
          excludeSemantics: true,
          child: Container(
            // Static halo — deliberately not a pulsing animation (no continuous repaint).
            padding: EdgeInsets.all(size * 0.07),
            decoration: BoxDecoration(shape: BoxShape.circle, color: _sosRed.withValues(alpha: 0.14)),
            child: SizedBox.square(
              dimension: size,
              child: Material(
                color: _sosRed,
                shape: const CircleBorder(),
                elevation: 6,
                shadowColor: _sosRed.withValues(alpha: 0.6),
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: onPressed,
                  child: Padding(
                    padding: EdgeInsets.all(size * 0.12),
                    child: FittedBox(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            'SOS',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 64,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 4,
                              height: 1,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'TAP FOR HELP',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.9),
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          "You'll choose Emergency or Assistance next.",
          textAlign: TextAlign.center,
          style: textTheme.bodySmall,
        ),
      ],
    );
  }
}

/// A rider's own open SOS alert, if any, surfaced directly on Home — the confirmation sheet's
/// one-time "View Alert" button is easy to dismiss without noticing, so this is the reliable
/// way back to a live alert.
class _MyActiveSosAlertBanner extends ConsumerWidget {
  const _MyActiveSosAlertBanner();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final alerts = ref.watch(mySosAlertsProvider).valueOrNull ?? const [];
    if (alerts.isEmpty) return const SizedBox.shrink();

    final alert = alerts.first;
    final isEmergency = alert.severity == 'EMERGENCY';
    final color = isEmergency ? Theme.of(context).colorScheme.error : const Color(0xFFFFAA00);

    return Material(
      color: color.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => context.push('/sos/${alert.id}'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Icon(Icons.sos, color: color),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Your SOS alert is active',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold, color: color),
                    ),
                    Text(
                      alert.assignedHelperId != null
                          ? '${sosTypeLabels[alert.type] ?? alert.type} · Helper assigned'
                          : '${sosTypeLabels[alert.type] ?? alert.type} · Searching for help nearby',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }
}

/// Compact form of Home's `rider_location.sharingEnabled` switch — kept on Home because SOS's
/// nearby-rider dispatch tier depends on it, framed around what it buys the rider in an
/// emergency. The persisted preference (`sharingEnabledProvider`) is the only source of truth for
/// whether this reads on/off — `RiderFindabilityService` (restored on every login and app resume,
/// via `AuthController`/`RiderFindabilityGate`) is what keeps that preference actually true in
/// practice by refreshing the location fix in the background, instead of this row's toggle being
/// the only thing that ever pushes one.
class _LocationSharingRow extends ConsumerStatefulWidget {
  const _LocationSharingRow();

  @override
  ConsumerState<_LocationSharingRow> createState() => _LocationSharingRowState();
}

class _LocationSharingRowState extends ConsumerState<_LocationSharingRow> {
  bool _busy = false;

  Future<void> _toggle(bool value) async {
    setState(() => _busy = true);
    try {
      final service = ref.read(riderFindabilityServiceProvider);
      if (value) {
        final permission = await service.enable();
        if (mounted && permission != RiderLocationPermissionState.granted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location permission is required to turn this on.')),
          );
        }
      } else {
        await service.disable();
      }
      ref.invalidate(sharingEnabledProvider);
      ref.invalidate(riderLocationPermissionStateProvider);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Persisted preference says on, but Android's permission has since been revoked (e.g. turned
  /// off from Settings while the app wasn't running) — a persisted `true` must never be read as
  /// license to bypass that. Tapping here fixes the permission specifically; it never re-asks the
  /// Rider to turn the BIKIE setting back on, since it's already on.
  Future<void> _fixPermission() async {
    setState(() => _busy = true);
    try {
      final permissionService = ref.read(riderLocationPermissionServiceProvider);
      final current = await permissionService.check();
      if (current == RiderLocationPermissionState.blocked) {
        await permissionService.openSystemSettings();
      } else {
        await ref.read(riderFindabilityServiceProvider).enable();
      }
      ref.invalidate(riderLocationPermissionStateProvider);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final enabled = ref.watch(sharingEnabledProvider).valueOrNull ?? false;
    final permission = ref.watch(riderLocationPermissionStateProvider).valueOrNull;
    final needsPermission = enabled && permission != null && permission != RiderLocationPermissionState.granted;
    final accent = needsPermission ? Theme.of(context).colorScheme.error : Theme.of(context).colorScheme.primary;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 8, 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: accent.withValues(alpha: 0.08),
        border: Border.all(color: accent.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Icon(
            needsPermission
                ? Icons.location_disabled_outlined
                : (enabled ? Icons.location_on : Icons.location_off_outlined),
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Be findable in an emergency',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 2),
                Text(
                  needsPermission
                      ? "On, but location permission was turned off — tap Fix to restore it."
                      : (enabled
                          ? 'On — nearby riders are alerted if you send an SOS, and you if they do.'
                          : "Off — nearby riders won't be alerted if you send an SOS."),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 56,
            child: Center(
              child: _busy
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : (needsPermission
                      ? TextButton(onPressed: _fixPermission, child: const Text('Fix'))
                      : Switch(value: enabled, onChanged: _toggle)),
            ),
          ),
        ],
      ),
    );
  }
}
