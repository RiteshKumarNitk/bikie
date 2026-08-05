import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

/// Tap-to-place map for picking a shop location (ADR-036) — mirrors the web's
/// `LocationPicker.tsx`. Uses `flutter_map` + raw OpenStreetMap tiles instead of
/// `google_maps_flutter` — no API key, no native Android/iOS config needed. Tap-only (not
/// drag-to-adjust like the web version): `flutter_map` has no built-in draggable-marker gesture
/// the way Google Maps' SDK does; tapping again to move the pin gets the same practical result
/// without a fragile custom gesture-to-LatLng implementation.
const _indiaCenter = LatLng(20.5937, 78.9629);

class LocationPickerField extends StatefulWidget {
  const LocationPickerField({super.key, required this.value, required this.onChanged});

  final LatLng? value;
  final ValueChanged<LatLng> onChanged;

  @override
  State<LocationPickerField> createState() => _LocationPickerFieldState();
}

class _LocationPickerFieldState extends State<LocationPickerField> {
  late LatLng? _marker = widget.value;

  void _setMarker(LatLng position) {
    setState(() => _marker = position);
    widget.onChanged(position);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: SizedBox(
            height: 220,
            child: FlutterMap(
              options: MapOptions(
                initialCenter: widget.value ?? _indiaCenter,
                initialZoom: widget.value != null ? 15 : 5,
                onTap: (_, latlng) => _setMarker(latlng),
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.bikie.mobile',
                ),
                if (_marker != null)
                  MarkerLayer(markers: [
                    Marker(
                      point: _marker!,
                      width: 40,
                      height: 40,
                      child: const Icon(Icons.location_pin, color: Colors.red, size: 40),
                    ),
                  ]),
                const _OsmAttribution(),
              ],
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          _marker != null
              ? 'Pin set at ${_marker!.latitude.toStringAsFixed(5)}, ${_marker!.longitude.toStringAsFixed(5)} — tap elsewhere to adjust.'
              : "Tap anywhere on the map to drop a pin at your shop's location.",
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}

/// OSM's tile usage policy requires visible attribution — `RichAttributionWidget` is
/// `flutter_map`'s standard widget for this, not automatic the way Leaflet's `attribution` tile
/// option is on web.
class _OsmAttribution extends StatelessWidget {
  const _OsmAttribution();

  @override
  Widget build(BuildContext context) {
    return const SimpleAttributionWidget(
      source: Text('OpenStreetMap contributors'),
    );
  }
}
