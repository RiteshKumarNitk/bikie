import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/empty_state.dart';
import '../data/partner_model.dart';
import '../data/partners_repository.dart';

/// "Find a service provider" — public "which BIKIE partners are near me" (ADR-036), mirroring
/// web's `NearbyPartnersPanel.tsx`. No session/membership required, unlike `NearbyRidersScreen`
/// (which needs reciprocal location sharing) — this only reads our own verified Partner table.
class PartnersScreen extends ConsumerStatefulWidget {
  const PartnersScreen({super.key});

  @override
  ConsumerState<PartnersScreen> createState() => _PartnersScreenState();
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
    );
  }
}

class _PartnersScreenState extends ConsumerState<PartnersScreen> {
  bool _loading = false;
  String? _error;
  List<NearbyPartner>? _partners;
  LatLng? _center;

  Future<void> _findNearby() async {
    setState(() {
      _loading = true;
      _error = null;
      _partners = null;
    });
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        setState(() => _error = 'Location permission is required to find nearby service providers.');
        return;
      }
      final position = await Geolocator.getCurrentPosition();
      final center = LatLng(position.latitude, position.longitude);
      final partners = await ref.read(partnersRepositoryProvider).findNearby(position.latitude, position.longitude);
      setState(() {
        _center = center;
        _partners = partners;
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = "Couldn't get your location");
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Service Providers')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            "See BIKIE's registered mechanics, fuel delivery, and rental partners on a map — each with its verification status, so you know exactly who's been checked by BIKIE.",
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: _loading ? null : _findNearby,
            icon: const Icon(Icons.my_location, size: 18),
            label: Text(_loading ? 'Finding nearby partners…' : 'Find service providers near me'),
          ),
          const SizedBox(height: 16),
          if (_error != null)
            EmptyState(
              icon: Icons.error_outline,
              title: "Couldn't load nearby partners",
              message: _error,
              actionLabel: 'Retry',
              onAction: _findNearby,
            ),
          if (_partners != null && _partners!.isEmpty)
            const EmptyState(
              icon: Icons.storefront_outlined,
              title: 'No service providers found nearby yet',
            ),
          if (_partners != null && _partners!.isNotEmpty) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                height: 220,
                child: FlutterMap(
                  options: MapOptions(initialCenter: _center!, initialZoom: 12),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.bikie.mobile',
                    ),
                    MarkerLayer(markers: [
                      Marker(
                        point: _center!,
                        width: 40,
                        height: 40,
                        child: const Icon(Icons.my_location, color: Colors.blue, size: 30),
                      ),
                      for (final p in _partners!)
                        Marker(
                          point: LatLng(p.latitude, p.longitude),
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
            const SizedBox(height: 12),
            ..._partners!.map(
              (p) => Card(
                child: ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.storefront_outlined)),
                  title: Row(
                    children: [
                      Flexible(child: Text(p.businessName, overflow: TextOverflow.ellipsis)),
                      const SizedBox(width: 6),
                      if (p.verificationStatus == 'APPROVED')
                        const _Badge(label: '✓ Verified', color: Colors.green)
                      else
                        const _Badge(label: '⚠ Unverified', color: Colors.amber),
                    ],
                  ),
                  subtitle: Text(
                    [
                      partnerTypeLabels[p.type] ?? p.type,
                      p.city,
                      if (p.ratingCount > 0) '⭐ ${p.ratingAvg.toStringAsFixed(1)} (${p.ratingCount})',
                    ].join(' · '),
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        p.distanceMeters < 1000
                            ? '${p.distanceMeters.round()} m'
                            : '${(p.distanceMeters / 1000).toStringAsFixed(1)} km',
                        style: Theme.of(context).textTheme.labelMedium,
                      ),
                      Text(
                        p.isAvailable ? '🟢 Available' : '⚫ Offline',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: p.isAvailable ? Colors.green : null,
                            ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
