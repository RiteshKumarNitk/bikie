import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

/// Map location picker (ADR-036) — mirrors the web's `LocationPicker.tsx`. Uses `flutter_map` +
/// raw OpenStreetMap tiles instead of `google_maps_flutter` — no API key, no native Android/iOS
/// config needed.
///
/// Two modes:
/// - **Tap-to-place** (default, used by the ride meeting-point picker): tapping drops the pin and
///   reports it via [onChanged] immediately. Unchanged from the original widget.
/// - **Confirm mode** ([confirmMode] — Service Provider location setup): the pin is fixed in the
///   centre and the map moves underneath it, so the map centre *is* the selection. Nothing is
///   reported until the user taps "Confirm location" — moving the map alone never counts. With
///   [locateUser] it offers "Use current location", and with [autoLocate] it centres on the device
///   location on open, but only when there is no saved [value] (a saved location is never
///   silently replaced by GPS).
const _indiaCenter = LatLng(20.5937, 78.9629);
const _locatedZoom = 16.0;
const _fallbackCityZoom = 12.0;

class LocationPickerField extends StatefulWidget {
  const LocationPickerField({
    super.key,
    required this.value,
    required this.onChanged,
    this.confirmMode = false,
    this.locateUser,
    this.autoLocate = false,
    this.resolveFallbackCenter,
    this.onUnconfirmedChange,
  });

  /// Initial (tap-to-place) or last confirmed (confirm mode) location.
  final LatLng? value;

  /// Tap-to-place: every tap. Confirm mode: only when "Confirm location" is tapped.
  final ValueChanged<LatLng> onChanged;

  final bool confirmMode;

  /// Confirm mode only — one-shot device location, `null` if unavailable or permission denied.
  /// Enables the "Use current location" button.
  final Future<LatLng?> Function()? locateUser;

  /// Confirm mode only — call [locateUser] once on open when [value] is null.
  final bool autoLocate;

  /// Confirm mode only — a rough centre (e.g. the typed city) to open near when there's no saved
  /// value and the device location isn't available. Only moves the map; never selects anything.
  final Future<LatLng?> Function()? resolveFallbackCenter;

  /// Confirm mode only — whether the map has been moved away from the confirmed location without
  /// confirming. Called only when that changes.
  final ValueChanged<bool>? onUnconfirmedChange;

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
    if (widget.confirmMode) {
      return _ConfirmLocationPicker(
        value: widget.value,
        onConfirmed: widget.onChanged,
        locateUser: widget.locateUser,
        autoLocate: widget.autoLocate,
        resolveFallbackCenter: widget.resolveFallbackCenter,
        onUnconfirmedChange: widget.onUnconfirmedChange,
      );
    }
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
                const _OsmTiles(),
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

enum _LocateStatus { idle, locating, located, unavailable }

/// Confirm mode — see [LocationPickerField].
class _ConfirmLocationPicker extends StatefulWidget {
  const _ConfirmLocationPicker({
    required this.value,
    required this.onConfirmed,
    required this.locateUser,
    required this.autoLocate,
    required this.resolveFallbackCenter,
    required this.onUnconfirmedChange,
  });

  final LatLng? value;
  final ValueChanged<LatLng> onConfirmed;
  final Future<LatLng?> Function()? locateUser;
  final bool autoLocate;
  final Future<LatLng?> Function()? resolveFallbackCenter;
  final ValueChanged<bool>? onUnconfirmedChange;

  @override
  State<_ConfirmLocationPicker> createState() => _ConfirmLocationPickerState();
}

class _ConfirmLocationPickerState extends State<_ConfirmLocationPicker> {
  final _mapController = MapController();

  /// The map centre = the candidate selection. A notifier (not setState) so panning only rebuilds
  /// the small status/actions area, not the map.
  late final ValueNotifier<LatLng> _center = ValueNotifier(widget.value ?? _indiaCenter);
  late LatLng? _confirmed = widget.value;

  /// False while the map sits on a placeholder centre (India / a typed city) nobody chose — the
  /// user must locate or move the map before a location can be confirmed.
  late bool _hasCandidate = widget.value != null;

  _LocateStatus _status = _LocateStatus.idle;
  bool _mapReady = false;
  ({LatLng point, double zoom})? _pendingMove;
  bool _lastReportedUnconfirmed = false;

  @override
  void initState() {
    super.initState();
    if (widget.autoLocate && widget.value == null && widget.locateUser != null) {
      _locate(automatic: true);
    }
  }

  @override
  void dispose() {
    _center.dispose();
    _mapController.dispose();
    super.dispose();
  }

  void _move(LatLng point, double zoom) {
    _center.value = point;
    if (_mapReady) {
      _mapController.move(point, zoom);
    } else {
      _pendingMove = (point: point, zoom: zoom);
    }
  }

  Future<void> _locate({required bool automatic}) async {
    setState(() => _status = _LocateStatus.locating);
    final position = await widget.locateUser!();
    if (!mounted) return;
    if (position != null) {
      _move(position, _locatedZoom);
      setState(() {
        _status = _LocateStatus.located;
        _hasCandidate = true;
      });
      return;
    }
    setState(() => _status = _LocateStatus.unavailable);
    // No saved location and no GPS: open near the typed city rather than all of India, but leave
    // the actual choice to the user.
    if (automatic && widget.resolveFallbackCenter != null) {
      final fallback = await widget.resolveFallbackCenter!();
      if (mounted && fallback != null && !_hasCandidate) _move(fallback, _fallbackCityZoom);
    }
  }

  void _onPositionChanged(MapCamera camera, bool hasGesture) {
    _center.value = camera.center;
    if (hasGesture && !_hasCandidate) setState(() => _hasCandidate = true);
  }

  bool _differsFromConfirmed(LatLng center) {
    final confirmed = _confirmed;
    if (confirmed == null) return true;
    return (confirmed.latitude - center.latitude).abs() > 1e-7 ||
        (confirmed.longitude - center.longitude).abs() > 1e-7;
  }

  void _reportUnconfirmed(bool unconfirmed) {
    if (unconfirmed == _lastReportedUnconfirmed || widget.onUnconfirmedChange == null) return;
    _lastReportedUnconfirmed = unconfirmed;
    // Reported after the frame: this runs during a build, and the parent will setState.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) widget.onUnconfirmedChange!(unconfirmed);
    });
  }

  void _confirm() {
    final selected = _center.value;
    setState(() => _confirmed = selected);
    widget.onConfirmed(selected);
  }

  @override
  Widget build(BuildContext context) {
    final initial = widget.value;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: SizedBox(
            height: 280,
            child: Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: initial ?? _indiaCenter,
                    initialZoom: initial != null ? _locatedZoom : 5,
                    // A picker doesn't need rotation, and accidental rotation is confusing here.
                    interactionOptions: const InteractionOptions(flags: InteractiveFlag.all & ~InteractiveFlag.rotate),
                    onMapReady: () {
                      _mapReady = true;
                      final pending = _pendingMove;
                      _pendingMove = null;
                      if (pending != null) _mapController.move(pending.point, pending.zoom);
                    },
                    onPositionChanged: _onPositionChanged,
                    // Tapping re-centres there — the pin stays in the middle.
                    onTap: (_, latlng) {
                      _move(latlng, _mapController.camera.zoom);
                      if (!_hasCandidate) setState(() => _hasCandidate = true);
                    },
                  ),
                  children: const [_OsmTiles(), _OsmAttribution()],
                ),
                // Fixed centre pin: the icon's tip sits on the exact map centre.
                const IgnorePointer(
                  child: Center(
                    child: Padding(
                      padding: EdgeInsets.only(bottom: 40),
                      child: Icon(Icons.location_pin, color: Colors.red, size: 40),
                    ),
                  ),
                ),
                if (_status == _LocateStatus.locating)
                  const Positioned(
                    top: 8,
                    left: 8,
                    right: 8,
                    child: LinearProgressIndicator(),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        ValueListenableBuilder<LatLng>(
          valueListenable: _center,
          builder: (context, center, _) {
            final unconfirmed = _hasCandidate && _differsFromConfirmed(center);
            _reportUnconfirmed(unconfirmed && _confirmed != null);
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(_statusText(center, unconfirmed), style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  alignment: WrapAlignment.end,
                  children: [
                    if (widget.locateUser != null)
                      OutlinedButton.icon(
                        onPressed: _status == _LocateStatus.locating ? null : () => _locate(automatic: false),
                        icon: const Icon(Icons.my_location, size: 18),
                        label: const Text('Use current location'),
                      ),
                    ElevatedButton.icon(
                      onPressed: unconfirmed ? _confirm : null,
                      icon: const Icon(Icons.check, size: 18),
                      label: const Text('Confirm location'),
                    ),
                  ],
                ),
              ],
            );
          },
        ),
      ],
    );
  }

  String _statusText(LatLng center, bool unconfirmed) {
    final coords = '${center.latitude.toStringAsFixed(5)}, ${center.longitude.toStringAsFixed(5)}';
    if (_status == _LocateStatus.locating) return 'Finding your current location…';
    if (!_hasCandidate) {
      return _status == _LocateStatus.unavailable
          ? "We couldn't access your current location. Please move the map and select your service location manually."
          : 'Move the map so the pin sits on your service location.';
    }
    if (unconfirmed) {
      return _confirmed == null
          ? 'Selected: $coords. Move the map to adjust, then tap Confirm location.'
          : 'New position $coords is not confirmed yet — tap Confirm location to use it.';
    }
    return '✓ Location confirmed ($coords). Move the map to change it.';
  }
}

class _OsmTiles extends StatelessWidget {
  const _OsmTiles();

  @override
  Widget build(BuildContext context) {
    return TileLayer(
      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      userAgentPackageName: 'com.bikie.mobile',
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
