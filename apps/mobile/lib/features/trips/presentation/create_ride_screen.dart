import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/network/api_exception.dart';
import '../../onboarding/presentation/location_picker_field.dart';
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
  final _destinationNameController = TextEditingController();

  String _type = rideCreationTypes.first;
  String _difficulty = 'MODERATE';
  LatLng? _meetingLocation;
  DateTime? _startDate;
  DateTime? _endDate;
  bool _isSubmitting = false;
  String? _error;

  File? _coverImageFile;
  String? _coverImageUrl;
  bool _uploadingCover = false;

  final List<String> _galleryUrls = [];
  bool _uploadingGallery = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _seatsController.dispose();
    _priceController.dispose();
    _meetingPointController.dispose();
    _destinationNameController.dispose();
    super.dispose();
  }

  Future<void> _pickCoverImage() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked == null) return;

    setState(() {
      _coverImageFile = File(picked.path);
      _uploadingCover = true;
      _error = null;
    });
    try {
      final url = await ref.read(tripRepositoryProvider).uploadCoverImage(_coverImageFile!);
      if (mounted) setState(() => _coverImageUrl = url);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = "Couldn't upload that image: ${e.message}");
    } finally {
      if (mounted) setState(() => _uploadingCover = false);
    }
  }

  Future<void> _pickGalleryImages() async {
    final remaining = 8 - _galleryUrls.length;
    if (remaining <= 0) return;
    final picked = await ImagePicker().pickMultiImage(imageQuality: 85, limit: remaining);
    if (picked.isEmpty) return;

    setState(() {
      _uploadingGallery = true;
      _error = null;
    });
    try {
      final repo = ref.read(tripRepositoryProvider);
      for (final image in picked) {
        final url = await repo.uploadCoverImage(File(image.path));
        if (mounted) setState(() => _galleryUrls.add(url));
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = "Couldn't upload gallery photos: ${e.message}");
    } finally {
      if (mounted) setState(() => _uploadingGallery = false);
    }
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
            meetingLat: _meetingLocation?.latitude,
            meetingLng: _meetingLocation?.longitude,
            startDate: _startDate!,
            endDate: _endDate!,
            destinationName: _destinationNameController.text,
            imageUrl: _coverImageUrl,
            gallery: _galleryUrls,
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
            TextFormField(
              controller: _destinationNameController,
              decoration: const InputDecoration(
                labelText: 'Destination (optional)',
                hintText: 'Mount Abu, Rajasthan',
              ),
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
            const SizedBox(height: 12),
            LocationPickerField(
              value: _meetingLocation,
              onChanged: (latlng) => setState(() => _meetingLocation = latlng),
            ),
            const SizedBox(height: 16),
            Text('Cover image', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            Row(
              children: [
                if (_coverImageFile != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.file(_coverImageFile!, height: 64, width: 96, fit: BoxFit.cover),
                  ),
                if (_coverImageFile != null) const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(
                    onPressed: _uploadingCover ? null : _pickCoverImage,
                    child: _uploadingCover
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(_coverImageUrl != null ? 'Change cover image' : 'Upload cover image'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text('Gallery (optional, up to 8)', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            if (_galleryUrls.isNotEmpty)
              SizedBox(
                height: 64,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _galleryUrls.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) => Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(_galleryUrls[index], height: 64, width: 96, fit: BoxFit.cover),
                      ),
                      Positioned(
                        right: 2,
                        top: 2,
                        child: GestureDetector(
                          onTap: () => setState(() => _galleryUrls.removeAt(index)),
                          child: Container(
                            height: 18,
                            width: 18,
                            decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                            child: const Icon(Icons.close, size: 12, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            if (_galleryUrls.isNotEmpty) const SizedBox(height: 8),
            OutlinedButton(
              onPressed: (_uploadingGallery || _galleryUrls.length >= 8) ? null : _pickGalleryImages,
              child: _uploadingGallery
                  ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Add gallery photos'),
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
