import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/network/api_exception.dart';
import '../../../membership/domain/membership_providers.dart';
import '../../../nearby_riders/domain/nearby_riders_providers.dart';
import '../../../nearby_riders/domain/rider_findability_service.dart';
import '../../../nearby_riders/domain/rider_location_permission.dart';

/// The "🟢 FINDABLE / ⚫ NOT FINDABLE" toggle — Rider's exact counterpart to
/// `PartnerAvailabilityBanner`: same persistent-in-`AppShell` placement (every Rider tab, not just
/// Home), same locked-state-when-no-membership pattern, same row layout/switch/spinner. The two
/// states `PartnerAvailabilityBanner` doesn't have — "needs location permission" and the
/// loading-before-first-fetch guard — are Rider-specific (SOS discoverability depends on a live
/// GPS fix in a way Service Provider availability never did) and are folded into this same banner
/// rather than a second, separate toggle anywhere else.
class RiderFindabilityBanner extends ConsumerStatefulWidget {
  const RiderFindabilityBanner({super.key});

  @override
  ConsumerState<RiderFindabilityBanner> createState() => _RiderFindabilityBannerState();
}

class _RiderFindabilityBannerState extends ConsumerState<RiderFindabilityBanner> {
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
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Persisted preference says on, but Android's/iOS's permission has since been revoked (e.g.
  /// turned off from Settings while the app wasn't running) — a persisted `true` must never be
  /// read as license to bypass that. Tapping here fixes the permission specifically; it never
  /// re-asks the Rider to turn the BIKIE setting back on, since it's already on.
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
    final membershipAsync = ref.watch(activeMembershipProvider);
    // Fail open while loading/on error rather than flashing a locked state that then flips —
    // mirrors PartnerAvailabilityBanner exactly; the backend's own membership gate on
    // PUT /api/rider-location/consent is the actual enforcement regardless of what this shows.
    final membershipActive = membershipAsync.maybeWhen(data: (m) => m != null, orElse: () => true);

    if (!membershipActive) {
      return Material(
        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05),
        child: InkWell(
          onTap: () => context.push('/membership'),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                const Text('🔒', style: TextStyle(fontSize: 14)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'NOT FINDABLE',
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        'Activate ₹149/year membership to be findable',
                        style: Theme.of(context).textTheme.labelSmall,
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, size: 18),
              ],
            ),
          ),
        ),
      );
    }

    final sharingAsync = ref.watch(sharingEnabledProvider);
    final enabled = sharingAsync.valueOrNull ?? false;
    // Never render a resolved on/off state from the loading/false default — mirrors
    // PartnerAvailabilityBanner's identical `availableAsync.isLoading` guard.
    final isLoading = sharingAsync.isLoading && !sharingAsync.hasValue;
    final permission = ref.watch(riderLocationPermissionStateProvider).valueOrNull;
    final needsPermission = enabled && permission != null && permission != RiderLocationPermissionState.granted;

    final Color color;
    if (needsPermission) {
      color = Theme.of(context).colorScheme.error;
    } else if (enabled) {
      color = const Color(0xFF22C55E);
    } else {
      color = Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5);
    }

    return Material(
      color: color.withValues(alpha: 0.1),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: [
            Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isLoading ? 'CHECKING…' : (needsPermission ? 'FINDABLE' : (enabled ? 'FINDABLE' : 'NOT FINDABLE')),
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.bold, color: color),
                  ),
                  Text(
                    isLoading
                        ? 'Checking your saved setting…'
                        : (needsPermission
                            ? 'Location permission is off — tap Fix to restore it.'
                            : (enabled
                                ? 'Nearby Riders are alerted if you send an SOS, and you if they do.'
                                : "You won't be alerted or alert others for nearby SOS.")),
                    style: Theme.of(context).textTheme.labelSmall,
                  ),
                ],
              ),
            ),
            if (_busy || isLoading)
              const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
            else if (needsPermission)
              TextButton(onPressed: _fixPermission, child: const Text('Fix'))
            else
              Switch(value: enabled, onChanged: _toggle),
          ],
        ),
      ),
    );
  }
}
