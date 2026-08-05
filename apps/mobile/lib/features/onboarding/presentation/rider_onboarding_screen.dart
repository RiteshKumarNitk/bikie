import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/data/auth_repository.dart';
import '../data/rider_profile_model.dart';
import '../data/rider_profile_repository.dart';
import 'onboarding_widgets.dart';

/// `/onboarding` — mirrors the web's post-signup rider-profile form (`apps/web/app/onboarding/
/// page.tsx`), collecting the same `RiderProfile` fields via the same `PUT /api/rider-profile`
/// route, plus full name/photo via Better Auth's `update-user` (mirrors
/// `authClient.updateUser`). Shown once, right after a brand-new signup completes (see
/// `signup_screen.dart`), and reachable afterward from Profile > Rider Details.
/// Skippable (ADR-012) — nothing here blocks using the app, but the more filled in, the more
/// useful an SOS alert is to whoever responds to it (blood group, medical history, vehicle,
/// emergency contacts all surface on the SOS alert/session screens).
class RiderOnboardingScreen extends ConsumerStatefulWidget {
  const RiderOnboardingScreen({super.key});

  @override
  ConsumerState<RiderOnboardingScreen> createState() => _RiderOnboardingScreenState();
}

class _ContactControllers {
  _ContactControllers()
      : name = TextEditingController(),
        phone = TextEditingController(),
        email = TextEditingController(),
        relation = TextEditingController();

  final TextEditingController name;
  final TextEditingController phone;
  final TextEditingController email;
  final TextEditingController relation;

  void dispose() {
    name.dispose();
    phone.dispose();
    email.dispose();
    relation.dispose();
  }
}

class _RiderOnboardingScreenState extends ConsumerState<RiderOnboardingScreen> {
  final _fullName = TextEditingController();
  File? _photoFile;
  String? _photoUrl;
  bool _uploadingPhoto = false;

  final _drivingLicenceNumber = TextEditingController();
  final _addressLine = TextEditingController();
  final _area = TextEditingController();
  final _district = TextEditingController();
  final _pincode = TextEditingController();
  final _country = TextEditingController(text: 'India');
  final _fatherName = TextEditingController();
  final _motherName = TextEditingController();
  final _medicalHistory = TextEditingController();
  final _allergies = TextEditingController();
  final _vehicleBrand = TextEditingController();
  final _vehicleModel = TextEditingController();
  final _governmentIdNumber = TextEditingController();
  final _clubName = TextEditingController();

  DateTime? _drivingLicenceExpiry;
  DateTime? _dateOfBirth;
  String? _gender;
  String? _bloodGroup;
  String? _vehicleType;
  String? _governmentIdType;
  String? _riderFrequency;
  String? _ridingClubType;

  final List<_ContactControllers> _contacts = [];

  bool _saving = false;
  bool _skipping = false;
  String? _error;

  @override
  void dispose() {
    _fullName.dispose();
    for (final c in [
      _drivingLicenceNumber,
      _addressLine,
      _area,
      _district,
      _pincode,
      _country,
      _fatherName,
      _motherName,
      _medicalHistory,
      _allergies,
      _vehicleBrand,
      _vehicleModel,
      _governmentIdNumber,
      _clubName,
    ]) {
      c.dispose();
    }
    for (final c in _contacts) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickDate({required DateTime? initial, required ValueChanged<DateTime> onPicked}) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial ?? DateTime(now.year - 25),
      firstDate: DateTime(1900),
      lastDate: DateTime(now.year + 20),
    );
    if (picked != null) onPicked(picked);
  }

  Future<void> _pickPhoto() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked == null) return;

    setState(() {
      _photoFile = File(picked.path);
      _uploadingPhoto = true;
      _error = null;
    });
    try {
      final url = await ref.read(riderProfileRepositoryProvider).uploadPhoto(_photoFile!);
      if (mounted) setState(() => _photoUrl = url);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = "Couldn't upload that photo: ${e.message}");
    } finally {
      if (mounted) setState(() => _uploadingPhoto = false);
    }
  }

  void _addContact() {
    if (_contacts.length >= 3) return;
    setState(() => _contacts.add(_ContactControllers()));
  }

  void _removeContact(int index) {
    setState(() => _contacts.removeAt(index).dispose());
  }

  RiderProfileInput _buildInput() {
    return RiderProfileInput(
      drivingLicenceNumber: _drivingLicenceNumber.text,
      drivingLicenceExpiry: _drivingLicenceExpiry?.toIso8601String(),
      addressLine: _addressLine.text,
      area: _area.text,
      district: _district.text,
      pincode: _pincode.text,
      country: _country.text,
      fatherName: _fatherName.text,
      motherName: _motherName.text,
      dateOfBirth: _dateOfBirth?.toIso8601String(),
      gender: _gender,
      bloodGroup: _bloodGroup,
      medicalHistory: _medicalHistory.text,
      allergies: _allergies.text,
      vehicleType: _vehicleType,
      vehicleBrand: _vehicleBrand.text,
      vehicleModel: _vehicleModel.text,
      governmentIdType: _governmentIdType,
      governmentIdNumber: _governmentIdNumber.text,
      riderFrequency: _riderFrequency,
      ridingClubType: _ridingClubType,
      clubName: _clubName.text,
      emergencyContacts: _contacts
          .map((c) => EmergencyContactInput(
                name: c.name.text,
                phone: c.phone.text,
                email: c.email.text,
                relation: c.relation.text,
              ))
          .toList(),
    );
  }

  /// Mirrors web's `saveNameAndPhoto()` — replaces the phone-number placeholder name once the
  /// user actually supplies one. Called before both Save and Skip, same as web's `handleSubmit`
  /// / `handleSkip`, so a name/photo entered right before tapping Skip isn't silently dropped.
  Future<void> _saveNameAndPhoto() async {
    final name = _fullName.text.trim();
    if (name.isEmpty && _photoUrl == null) return;
    await ref.read(authRepositoryProvider).updateUser(name: name.isEmpty ? null : name, image: _photoUrl);
  }

  Future<void> _save() async {
    setState(() {
      _error = null;
      _saving = true;
    });
    try {
      await _saveNameAndPhoto();
      await ref.read(riderProfileRepositoryProvider).save(_buildInput());
      if (mounted) context.go('/');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _skip() async {
    setState(() {
      _error = null;
      _skipping = true;
    });
    try {
      await _saveNameAndPhoto();
      await ref.read(riderProfileRepositoryProvider).skip();
      if (mounted) context.go('/');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _skipping = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final busy = _saving || _skipping;

    return Scaffold(
      appBar: AppBar(title: const Text("Let's get you ready to ride")),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'A few details help partners and fellow riders reach you faster, and make your '
                'SOS alerts more useful to whoever responds. Everything here is optional — you '
                'can always fill it in later from Settings.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 20),
              OnboardingSection(
                title: 'Rider profile',
                children: [
                  Row(
                    children: [
                      _PhotoAvatar(file: _photoFile, uploading: _uploadingPhoto),
                      const SizedBox(width: 16),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _uploadingPhoto ? null : _pickPhoto,
                          child: Text(_photoUrl != null ? 'Change photo' : 'Upload photo'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  OnboardingTextField(controller: _fullName, label: 'Full name', hint: 'As per government ID'),
                ],
              ),
              OnboardingSection(
                title: 'Vehicle details',
                children: [
                  OnboardingDropdown(
                    label: 'Vehicle type',
                    value: _vehicleType,
                    options: vehicleTypeOptions,
                    onChanged: (v) => setState(() => _vehicleType = v),
                  ),
                  OnboardingTextField(controller: _vehicleBrand, label: 'Brand', hint: 'e.g. Royal Enfield'),
                  OnboardingTextField(controller: _vehicleModel, label: 'Model', hint: 'e.g. Classic 350'),
                ],
              ),
              OnboardingSection(
                title: 'Personal details',
                children: [
                  OnboardingTextField(controller: _fatherName, label: "Father's name"),
                  OnboardingTextField(controller: _motherName, label: "Mother's name"),
                  _DatePickerField(
                    label: 'Date of birth',
                    value: _dateOfBirth,
                    onTap: () => _pickDate(initial: _dateOfBirth, onPicked: (d) => setState(() => _dateOfBirth = d)),
                  ),
                  OnboardingDropdown(
                    label: 'Gender',
                    value: _gender,
                    options: genderOptions,
                    onChanged: (v) => setState(() => _gender = v),
                  ),
                  OnboardingDropdown(
                    label: 'Blood group',
                    value: _bloodGroup,
                    options: bloodGroupOptions,
                    onChanged: (v) => setState(() => _bloodGroup = v),
                  ),
                  OnboardingTextField(
                    controller: _medicalHistory,
                    label: 'Medical history (optional)',
                    hint: 'Any conditions responders should know about in an emergency',
                    maxLines: 3,
                  ),
                  OnboardingTextField(controller: _allergies, label: 'Allergies (optional)', maxLines: 2),
                ],
              ),
              OnboardingSection(
                title: 'Driving licence',
                children: [
                  OnboardingTextField(
                    controller: _drivingLicenceNumber,
                    label: 'Licence number',
                    hint: 'e.g. KA0120230012345',
                  ),
                  _DatePickerField(
                    label: 'Expiry date',
                    value: _drivingLicenceExpiry,
                    onTap: () => _pickDate(
                      initial: _drivingLicenceExpiry,
                      onPicked: (d) => setState(() => _drivingLicenceExpiry = d),
                    ),
                  ),
                ],
              ),
              OnboardingSection(
                title: 'Address',
                children: [
                  OnboardingTextField(controller: _addressLine, label: 'Address line', hint: 'House / street'),
                  OnboardingTextField(controller: _area, label: 'Area'),
                  OnboardingTextField(controller: _district, label: 'District'),
                  OnboardingTextField(controller: _pincode, label: 'Pincode', keyboardType: TextInputType.number),
                  OnboardingTextField(controller: _country, label: 'Country'),
                ],
              ),
              OnboardingSection(
                title: 'Emergency contacts',
                subtitle: 'Add up to 3 people we can reach in case of an emergency during a ride.',
                children: [
                  for (var i = 0; i < _contacts.length; i++) _contactCard(i),
                  if (_contacts.length < 3)
                    OutlinedButton.icon(
                      onPressed: _addContact,
                      icon: const Icon(Icons.add),
                      label: const Text('Add emergency contact'),
                    ),
                ],
              ),
              OnboardingSection(
                title: 'Government ID',
                subtitle: "Collected as plain text for reference only — we don't run identity verification on this.",
                children: [
                  OnboardingDropdown(
                    label: 'ID type',
                    value: _governmentIdType,
                    options: governmentIdTypeOptions.keys.toList(),
                    optionLabels: governmentIdTypeOptions,
                    onChanged: (v) => setState(() => _governmentIdType = v),
                  ),
                  OnboardingTextField(controller: _governmentIdNumber, label: 'ID number'),
                ],
              ),
              OnboardingSection(
                title: 'Riding details',
                children: [
                  OnboardingDropdown(
                    label: 'How often do you ride?',
                    value: _riderFrequency,
                    options: riderFrequencyOptions.keys.toList(),
                    optionLabels: riderFrequencyOptions,
                    onChanged: (v) => setState(() => _riderFrequency = v),
                  ),
                  const SizedBox(height: 4),
                  Text('Riding style', style: Theme.of(context).textTheme.labelLarge),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: _ChoiceChipButton(
                          label: 'Solo rider',
                          selected: _ridingClubType == 'SOLO',
                          onTap: () => setState(() => _ridingClubType = 'SOLO'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _ChoiceChipButton(
                          label: 'Club member',
                          selected: _ridingClubType == 'CLUB_MEMBER',
                          onTap: () => setState(() => _ridingClubType = 'CLUB_MEMBER'),
                        ),
                      ),
                    ],
                  ),
                  if (_ridingClubType == 'CLUB_MEMBER') ...[
                    const SizedBox(height: 12),
                    OnboardingTextField(
                      controller: _clubName,
                      label: 'Club name',
                      hint: 'e.g. Himalayan Riders Collective',
                    ),
                  ],
                ],
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                ),
              ],
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: busy ? null : _save,
                child: _saving
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Save & continue'),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: busy ? null : _skip,
                child: Text(_skipping ? 'Skipping…' : 'Skip for now'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _contactCard(int index) {
    final c = _contacts[index];
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        border: Border.all(color: Theme.of(context).dividerColor),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(child: Text('Contact ${index + 1}', style: Theme.of(context).textTheme.labelLarge)),
              IconButton(
                onPressed: () => _removeContact(index),
                icon: const Icon(Icons.close, size: 18),
                tooltip: 'Remove',
              ),
            ],
          ),
          OnboardingTextField(controller: c.name, label: 'Name'),
          OnboardingTextField(controller: c.phone, label: 'Phone', keyboardType: TextInputType.phone, hint: '+91 98765 43210'),
          OnboardingTextField(controller: c.email, label: 'Email (optional)', keyboardType: TextInputType.emailAddress),
          OnboardingTextField(controller: c.relation, label: 'Relation (optional)', hint: 'e.g. Parent, Spouse, Friend'),
        ],
      ),
    );
  }
}

class _PhotoAvatar extends StatelessWidget {
  const _PhotoAvatar({required this.file, required this.uploading});

  final File? file;
  final bool uploading;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        CircleAvatar(
          radius: 32,
          backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
          backgroundImage: file != null ? FileImage(file!) : null,
          child: file == null ? const Icon(Icons.camera_alt_outlined) : null,
        ),
        if (uploading)
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.35), shape: BoxShape.circle),
              child: const Center(
                child: SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
              ),
            ),
          ),
      ],
    );
  }
}

class _DatePickerField extends StatelessWidget {
  const _DatePickerField({required this.label, required this.value, required this.onTap});

  final String label;
  final DateTime? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(kInputRadius),
        child: InputDecorator(
          decoration: InputDecoration(labelText: label, suffixIcon: const Icon(Icons.calendar_today_outlined, size: 18)),
          child: Text(
            value == null ? 'Select date' : '${value!.day}/${value!.month}/${value!.year}',
            style: value == null ? TextStyle(color: Theme.of(context).hintColor) : null,
          ),
        ),
      ),
    );
  }
}

class _ChoiceChipButton extends StatelessWidget {
  const _ChoiceChipButton({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final accent = Theme.of(context).colorScheme.primary;
    return OutlinedButton(
      onPressed: onTap,
      style: OutlinedButton.styleFrom(
        backgroundColor: selected ? accent.withValues(alpha: 0.15) : null,
        side: BorderSide(color: selected ? accent : Theme.of(context).dividerColor),
        foregroundColor: selected ? AppTheme.accentTextOf(context) : null,
      ),
      child: Text(label),
    );
  }
}
