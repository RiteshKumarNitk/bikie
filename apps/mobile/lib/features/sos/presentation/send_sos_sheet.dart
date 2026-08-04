import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../../core/network/api_exception.dart';
import '../data/sos_repository.dart';
import '../domain/sos_providers.dart';

// Matches PanicAlertCards.tsx's grouping exactly — every category has its own real
// SOSAlertType now (ADR-033), and severity is always server-derived from `type`.
const _emergencyTypes = {
  'ACCIDENT': '🚨 Accident',
  'MEDICAL': '🏥 Medical Emergency',
  'LIFE_THREATENING': '🔥 Life Threatening',
};
const _assistanceTypes = {
  'BIKE_BREAKDOWN': '🔧 Bike Breakdown',
  'FLAT_TYRE': '🔩 Flat Tyre',
  'FUEL_EMPTY': '⛽ Fuel Required',
  'BATTERY_ISSUE': '🔋 Battery Issue',
  'LOST': '🗺️ Lost',
  'OTHER': '❗ Other',
};
final _sosTypes = [..._emergencyTypes.keys, ..._assistanceTypes.keys];
final _sosTypeLabels = {..._emergencyTypes, ..._assistanceTypes};

Future<void> showSendSosSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    builder: (context) => const SendSosSheet(),
  );
}

class SendSosSheet extends ConsumerStatefulWidget {
  const SendSosSheet({super.key});

  @override
  ConsumerState<SendSosSheet> createState() => _SendSosSheetState();
}

class _SendSosSheetState extends ConsumerState<SendSosSheet> {
  String _type = _sosTypes.first;
  final _cityController = TextEditingController();
  final _descriptionController = TextEditingController();
  double? _lat;
  double? _lng;
  bool _isLocating = false;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _cityController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _captureLocation() async {
    setState(() => _isLocating = true);
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location permission is required to send an SOS alert')),
          );
        }
        return;
      }
      final position = await Geolocator.getCurrentPosition();
      setState(() {
        _lat = position.latitude;
        _lng = position.longitude;
      });
    } finally {
      if (mounted) setState(() => _isLocating = false);
    }
  }

  Future<void> _submit() async {
    if (_lat == null || _lng == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Capture your location first')));
      return;
    }
    if (_cityController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('City is required')));
      return;
    }
    setState(() => _isSubmitting = true);
    try {
      await ref.read(sosRepositoryProvider).create(
            type: _type,
            description: _descriptionController.text.trim(),
            latitude: _lat!,
            longitude: _lng!,
            city: _cityController.text.trim(),
          );
      ref.invalidate(activeSosAlertsProvider);
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('SOS alert sent')));
      }
    } on ApiException catch (e) {
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Send SOS alert', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _type,
            decoration: const InputDecoration(labelText: 'Type'),
            items: [
              const DropdownMenuItem(enabled: false, child: Text('🔴 Emergency', style: TextStyle(fontWeight: FontWeight.bold))),
              ..._emergencyTypes.keys.map((t) => DropdownMenuItem(value: t, child: Text(_sosTypeLabels[t]!))),
              const DropdownMenuItem(enabled: false, child: Text('🟠 Assistance', style: TextStyle(fontWeight: FontWeight.bold))),
              ..._assistanceTypes.keys.map((t) => DropdownMenuItem(value: t, child: Text(_sosTypeLabels[t]!))),
            ],
            onChanged: (value) => setState(() => _type = value!),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _cityController,
            decoration: const InputDecoration(labelText: 'City'),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _descriptionController,
            maxLines: 2,
            decoration: const InputDecoration(labelText: 'Description (optional)'),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: _isLocating ? null : _captureLocation,
            icon: const Icon(Icons.my_location),
            label: Text(_lat == null ? 'Capture current location' : 'Location captured ✓'),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _isSubmitting ? null : _submit,
            style: ElevatedButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error),
            child: _isSubmitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Send SOS'),
          ),
        ],
      ),
    );
  }
}
