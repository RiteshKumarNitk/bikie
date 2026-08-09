import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/empty_state.dart';
import '../data/nearby_riders_repository.dart';
import '../domain/nearby_riders_providers.dart';

class NearbyRidersScreen extends ConsumerStatefulWidget {
  const NearbyRidersScreen({super.key});

  @override
  ConsumerState<NearbyRidersScreen> createState() => _NearbyRidersScreenState();
}

class _NearbyRidersScreenState extends ConsumerState<NearbyRidersScreen> {
  bool _busy = false;

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _toggleSharing(bool enabled) async {
    setState(() => _busy = true);
    try {
      await ref.read(nearbyRidersRepositoryProvider).setSharingEnabled(enabled);
      if (enabled) await _pushLocation(silent: true);
      ref.invalidate(sharingEnabledProvider);
    } on ApiException catch (e) {
      _showMessage(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// ADR-045 — independent of `_toggleSharing`: whether this rider receives SOS dispatch pings.
  Future<void> _toggleReceiveSosAlerts(bool enabled) async {
    setState(() => _busy = true);
    try {
      await ref.read(nearbyRidersRepositoryProvider).setReceiveSosAlerts(enabled);
      ref.invalidate(receiveSosAlertsProvider);
    } on ApiException catch (e) {
      _showMessage(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _pushLocation({bool silent = false}) async {
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        if (!silent) _showMessage('Location permission is required to share your position.');
        return;
      }
      final position = await Geolocator.getCurrentPosition();
      await ref.read(nearbyRidersRepositoryProvider).updateLocation(position.latitude, position.longitude);
      if (!silent) {
        _showMessage('Location updated');
        ref.invalidate(nearbyRidersProvider);
      }
    } on ApiException catch (e) {
      if (!silent) _showMessage(e.message);
    } catch (_) {
      if (!silent) _showMessage("Couldn't get your location");
    }
  }

  @override
  Widget build(BuildContext context) {
    final sharingAsync = ref.watch(sharingEnabledProvider);
    final receiveSosAsync = ref.watch(receiveSosAlertsProvider);
    final radiusKm = ref.watch(radiusKmProvider);
    final ridersAsync = ref.watch(nearbyRidersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Nearby Riders')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text('Share my location', style: Theme.of(context).textTheme.titleMedium),
                      ),
                      sharingAsync.when(
                        data: (enabled) => Switch(
                          value: enabled,
                          onChanged: _busy ? null : _toggleSharing,
                        ),
                        loading: () => const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        error: (_, __) => const Icon(Icons.error_outline),
                      ),
                    ],
                  ),
                  const Text(
                    'You must share your own location to see other riders nearby — reciprocity, not just a toggle.',
                    style: TextStyle(fontSize: 12),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: _busy ? null : () => _pushLocation(),
                    icon: const Icon(Icons.my_location, size: 18),
                    label: const Text('Update my location now'),
                  ),
                  const Divider(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: Text('Receive SOS assistance requests', style: Theme.of(context).textTheme.titleMedium),
                      ),
                      receiveSosAsync.when(
                        data: (enabled) => Switch(
                          value: enabled,
                          onChanged: _busy ? null : _toggleReceiveSosAlerts,
                        ),
                        loading: () => const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        error: (_, __) => const Icon(Icons.error_outline),
                      ),
                    ],
                  ),
                  const Text(
                    'Temporarily stop receiving nearby-rider SOS pings without turning off location '
                    'sharing — you stay findable, you just won\'t be paged for assistance requests.',
                    style: TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Text('Radius:'),
              const SizedBox(width: 8),
              for (final km in [5, 10, 20])
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text('${km}km'),
                    selected: radiusKm == km,
                    onSelected: (_) => ref.read(radiusKmProvider.notifier).state = km,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          ridersAsync.when(
            data: (riders) {
              if (riders.isEmpty) {
                return const EmptyState(
                  icon: Icons.explore_off_outlined,
                  title: 'No nearby riders',
                  message: 'No one sharing their location was found within this radius.',
                );
              }
              return Column(
                children: riders
                    .map(
                      (r) => Card(
                        child: ListTile(
                          leading: const CircleAvatar(child: Icon(Icons.person_outline)),
                          title: Text(r.name),
                          trailing: Text('${(r.distanceMeters / 1000).toStringAsFixed(1)} km'),
                        ),
                      ),
                    )
                    .toList(),
              );
            },
            loading: () => const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator())),
            error: (error, _) {
              if (error is ApiException && error.errorCode == 'SHARING_DISABLED') {
                return const EmptyState(
                  icon: Icons.location_off_outlined,
                  title: 'Turn on sharing to see nearby riders',
                  message: 'Enable the switch above and update your location first.',
                );
              }
              return EmptyState(
                icon: Icons.error_outline,
                title: "Couldn't load nearby riders",
                message: error is ApiException ? error.message : null,
                actionLabel: 'Retry',
                onAction: () => ref.invalidate(nearbyRidersProvider),
              );
            },
          ),
        ],
      ),
    );
  }
}
