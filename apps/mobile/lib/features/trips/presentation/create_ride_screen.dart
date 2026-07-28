import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../destinations/domain/destination_providers.dart';
import '../data/trip_repository.dart';
import '../domain/trip_providers.dart';

/// `/trips/create` on mobile — membership-gated ride creation, posting
/// directly to the existing `POST /api/trips` (see `createTripSchema` in
/// `packages/validation/src/trip.schema.ts`). A full-screen push (not a
/// bottom sheet) since the web form has this many fields.
class CreateRideScreen extends ConsumerStatefulWidget {
  const CreateRideScreen({super.key});

  @override
  ConsumerState<CreateRideScreen> createState() => _CreateRideScreenState();
}

class _CreateRideScreenState extends ConsumerState<CreateRideScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _seatsController = TextEditingController(text: '4');
  final _priceController = TextEditingController(text: '0');
  final _meetingPointController = TextEditingController();
  final _imageUrlController = TextEditingController();

  String _type = rideCreationTypes.first;
  String _difficulty = 'MODERATE';
  String? _destinationId;
  DateTime? _startDate;
  DateTime? _endDate;
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _seatsController.dispose();
    _priceController.dispose();
    _meetingPointController.dispose();
    _imageUrlController.dispose();
    super.dispose();
  }

  Future<void> _pickDate({required bool isStart}) async {
    final now = DateTime.now();
    final initial = (isStart ? _startDate : _endDate) ?? _startDate ?? now;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial.isBefore(now) ? now : initial,
      firstDate: now,
      lastDate: now.add(const Duration(days: 730)),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _startDate = picked;
        if (_endDate != null && _endDate!.isBefore(picked)) _endDate = picked;
      } else {
        _endDate = picked;
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_startDate == null || _endDate == null) {
      setState(() => _error = 'Pick a start and end date.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });
    try {
      final trip = await ref.read(tripRepositoryProvider).create(
            title: _titleController.text.trim(),
            description: _descriptionController.text.trim(),
            type: _type,
            difficulty: _difficulty,
            price: num.tryParse(_priceController.text.trim()) ?? 0,
            seatsTotal: int.parse(_seatsController.text.trim()),
            meetingPoint: _meetingPointController.text,
            startDate: _startDate!,
            endDate: _endDate!,
            destinationId: _destinationId,
            imageUrl: _imageUrlController.text,
          );
      ref.invalidate(tripsProvider);
      ref.invalidate(myRidesProvider);
      if (mounted) context.pushReplacement('/trips/${trip.slug}');
    } on ApiException catch (e) {
      setState(() {
        _error = e.isMembershipRequired
            ? '${e.message} Tap below to view membership plans.'
            : e.message;
      });
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  static String _formatDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final destinations = ref.watch(allDestinationsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Create a Ride')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: 'Ride title'),
              validator: (v) => (v == null || v.trim().length < 3) ? 'At least 3 characters' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descriptionController,
              minLines: 3,
              maxLines: 6,
              decoration: const InputDecoration(
                labelText: 'Description',
                hintText: 'Route, required bike type, rules — anything riders should know.',
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Description is required' : null,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _type,
              decoration: const InputDecoration(labelText: 'Ride type'),
              items: rideCreationTypes
                  .map((t) => DropdownMenuItem(value: t, child: Text(t.replaceAll('_', ' '))))
                  .toList(),
              onChanged: (v) => setState(() => _type = v!),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _difficulty,
              decoration: const InputDecoration(labelText: 'Difficulty'),
              items: rideDifficulties.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
              onChanged: (v) => setState(() => _difficulty = v!),
            ),
            const SizedBox(height: 16),
            destinations.when(
              data: (list) => DropdownButtonFormField<String?>(
                initialValue: _destinationId,
                decoration: const InputDecoration(labelText: 'Destination (optional)'),
                items: [
                  const DropdownMenuItem<String?>(value: null, child: Text('None')),
                  ...list.map((d) => DropdownMenuItem<String?>(value: d.id, child: Text(d.name))),
                ],
                onChanged: (v) => setState(() => _destinationId = v),
              ),
              loading: () => const LinearProgressIndicator(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _pickDate(isStart: true),
                    child: Text(_startDate == null ? 'Start date' : _formatDate(_startDate!)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _pickDate(isStart: false),
                    child: Text(_endDate == null ? 'End date' : _formatDate(_endDate!)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _seatsController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Total seats'),
                    validator: (v) {
                      final n = int.tryParse(v?.trim() ?? '');
                      if (n == null || n < 1 || n > 200) return '1-200';
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _priceController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Price (₹, 0 = free)'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _meetingPointController,
              decoration: const InputDecoration(labelText: 'Meeting point (optional)'),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _imageUrlController,
              decoration: const InputDecoration(labelText: 'Cover image URL (optional)'),
            ),
            if (_error != null) ...[
              const SizedBox(height: 16),
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              if (_error!.contains('membership')) ...[
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: () => context.push('/membership'),
                  child: const Text('View membership plans'),
                ),
              ],
            ],
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              child: _isSubmitting
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Publish Ride'),
            ),
          ],
        ),
      ),
    );
  }
}
