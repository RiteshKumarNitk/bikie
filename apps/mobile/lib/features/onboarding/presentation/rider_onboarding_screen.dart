import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_toast.dart';
import '../../auth/data/auth_repository.dart';
import '../../auth/domain/auth_controller.dart';
import '../data/rider_profile_model.dart';
import '../data/rider_profile_repository.dart';
import 'onboarding_widgets.dart';

/// `/onboarding` — mirrors the web's post-signup rider-profile form (`apps/web/app/onboarding/
/// page.tsx`), collecting the same `RiderProfile` fields via the same `PUT /api/rider-profile`
/// route, plus full name/photo via Better Auth's `update-user` (mirrors
/// `authClient.updateUser`). Shown once, right after a brand-new signup completes (see
/// `signup_screen.dart`), and reachable afterward from Profile > Rider Details.
///
/// No skip (product decision, no longer ADR-012's skippable flow) — the form always has to be
/// gone through. Once a profile already exists, it opens read-only with an "Edit" action in the
/// app bar; tapping it unlocks every field for editing until the next Save.
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
  final _vehicleRegistrationNumber = TextEditingController();
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
  bool _loadingProfile = true;
  // Starts true so first-time onboarding (nothing to review yet) opens directly editable;
  // flipped to false once `_loadExisting` finds an actual saved profile to show first.
  bool _editing = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadExisting();
  }

  /// This screen doubles as first-time onboarding and "Rider Details" reached later from
  /// Profile — where showing a blank form every time made it impossible to tell whether
  /// anything had actually been saved before, or to update just one field without retyping
  /// everything else blind. Name/photo come from the account itself (Better Auth), independent
  /// of whether a `RiderProfile` row exists yet, so those two prefill unconditionally.
  Future<void> _loadExisting() async {
    final user = ref.read(authControllerProvider).user;
    if (user != null && mounted) {
      setState(() {
        _fullName.text = user.name;
        _photoUrl = user.image;
      });
    }

    try {
      final profile = await ref.read(riderProfileRepositoryProvider).getMine();
      if (!mounted || profile == null) return;
      setState(() {
        _drivingLicenceNumber.text = profile.drivingLicenceNumber ?? '';
        _drivingLicenceExpiry = _parseSavedDate(profile.drivingLicenceExpiry);
        _addressLine.text = profile.addressLine ?? '';
        _area.text = profile.area ?? '';
        _district.text = profile.district ?? '';
        _pincode.text = profile.pincode ?? '';
        _country.text = profile.country ?? 'India';
        _fatherName.text = profile.fatherName ?? '';
        _motherName.text = profile.motherName ?? '';
        _dateOfBirth = _parseSavedDate(profile.dateOfBirth);
        _gender = profile.gender;
        _bloodGroup = profile.bloodGroup;
        _medicalHistory.text = profile.medicalHistory ?? '';
        _allergies.text = profile.allergies ?? '';
        _vehicleType = profile.vehicleType;
        _vehicleBrand.text = profile.vehicleBrand ?? '';
        _vehicleModel.text = profile.vehicleModel ?? '';
        _vehicleRegistrationNumber.text = profile.vehicleRegistrationNumber ?? '';
        _governmentIdType = profile.governmentIdType;
        _governmentIdNumber.text = profile.governmentIdNumber ?? '';
        _riderFrequency = profile.riderFrequency;
        _ridingClubType = profile.ridingClubType;
        _clubName.text = profile.clubName ?? '';
        _contacts.addAll(profile.emergencyContacts.map(
          (c) => _ContactControllers()
            ..name.text = c.name
            ..phone.text = c.phone
            ..email.text = c.email ?? ''
            ..relation.text = c.relation ?? '',
        ));
        // There's now something real to review before allowing changes.
        _editing = false;
      });
    } catch (_) {
      // Best-effort prefill only — if this fails, the form just starts blank and editable, same
      // as before this existed. Not worth surfacing an error on a screen that's still usable.
    } finally {
      if (mounted) setState(() => _loadingProfile = false);
    }
  }

  /// Saved as `.toUtc().toIso8601String()`; `.toLocal()` here exactly reverses that, so a date
  /// picked at local midnight round-trips back to that same local midnight instead of drifting a
  /// day either way depending on the device's timezone offset.
  static DateTime? _parseSavedDate(String? iso) => iso == null ? null : DateTime.parse(iso).toLocal();

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
      _vehicleRegistrationNumber,
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
      if (mounted) {
        final message = "Couldn't upload that photo: ${e.message}";
        setState(() => _error = message);
        showAppToast(context, message, variant: AppToastVariant.error);
      }
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
      drivingLicenceExpiry: _drivingLicenceExpiry?.toUtc().toIso8601String(),
      addressLine: _addressLine.text,
      area: _area.text,
      district: _district.text,
      pincode: _pincode.text,
      country: _country.text,
      fatherName: _fatherName.text,
      motherName: _motherName.text,
      dateOfBirth: _dateOfBirth?.toUtc().toIso8601String(),
      gender: _gender,
      bloodGroup: _bloodGroup,
      medicalHistory: _medicalHistory.text,
      allergies: _allergies.text,
      vehicleType: _vehicleType,
      vehicleBrand: _vehicleBrand.text,
      vehicleModel: _vehicleModel.text,
      vehicleRegistrationNumber: _vehicleRegistrationNumber.text,
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
  /// user actually supplies one. `updateUser` changes the account server-side but has no way to
  /// update `AuthController`'s own cached session on its own, so `refreshSession()` is what
  /// makes Profile's displayed name/avatar actually reflect the change instead of staying stale
  /// until the next full app restart.
  Future<void> _saveNameAndPhoto() async {
    final name = _fullName.text.trim();
    if (name.isEmpty && _photoUrl == null) return;
    await ref.read(authRepositoryProvider).updateUser(name: name.isEmpty ? null : name, image: _photoUrl);
    await ref.read(authControllerProvider.notifier).refreshSession();
  }

  Future<void> _save() async {
    setState(() {
      _error = null;
      _saving = true;
    });
    try {
      await _saveNameAndPhoto();
      await ref.read(riderProfileRepositoryProvider).save(_buildInput());
      if (mounted) {
        showAppToast(context, 'Profile updated successfully', variant: AppToastVariant.success);
        context.go('/');
      }
    } on ApiException catch (e) {
      if (mounted) {
        setState(() => _error = e.message);
        showAppToast(context, e.message, variant: AppToastVariant.error);
      }
    } catch (e) {
      // Anything other than ApiException (a bad response shape, a dropped connection Dio
      // didn't wrap cleanly, etc.) used to fall through both this catch and the caller — no
      // error shown, no navigation, "Save" just went quiet. Catch broadly so a real failure is
      // always visible instead of indistinguishable from nothing happening at all.
      if (mounted) {
        const message = "Couldn't save your profile. Please try again.";
        setState(() => _error = message);
        showAppToast(context, message, variant: AppToastVariant.error);
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Let's get you ready to ride"),
        actions: [
          if (!_loadingProfile && !_editing)
            TextButton(
              onPressed: () => setState(() => _editing = true),
              child: const Text('Edit'),
            ),
        ],
      ),
      body: SafeArea(
        child: _loadingProfile
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      _editing
                          ? 'A few details help partners and fellow riders reach you faster, and make '
                              'your SOS alerts more useful to whoever responds.'
                          : 'Tap Edit to update any of these.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 20),
                    OnboardingSection(
                      title: 'Rider profile',
                      children: [
                        Row(
                          children: [
                            _PhotoAvatar(file: _photoFile, url: _photoUrl, uploading: _uploadingPhoto),
                            const SizedBox(width: 16),
                            Expanded(
                              child: OutlinedButton(
                                onPressed: (_uploadingPhoto || !_editing) ? null : _pickPhoto,
                                child: Text(_photoUrl != null ? 'Change photo' : 'Upload photo'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        OnboardingTextField(
                          controller: _fullName,
                          label: 'Full name',
                          hint: 'As per government ID',
                          enabled: _editing,
                        ),
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
                          enabled: _editing,
                        ),
                        OnboardingTextField(
                          controller: _vehicleBrand,
                          label: 'Brand',
                          hint: 'e.g. Royal Enfield',
                          enabled: _editing,
                        ),
                        OnboardingTextField(
                          controller: _vehicleModel,
                          label: 'Model',
                          hint: 'e.g. Classic 350',
                          enabled: _editing,
                        ),
                        OnboardingTextField(
                          controller: _vehicleRegistrationNumber,
                          label: 'Registration number (optional)',
                          hint: 'e.g. MH12AB1234',
                          enabled: _editing,
                        ),
                      ],
                    ),
                    OnboardingSection(
                      title: 'Personal details',
                      children: [
                        OnboardingTextField(controller: _fatherName, label: "Father's name", enabled: _editing),
                        OnboardingTextField(controller: _motherName, label: "Mother's name", enabled: _editing),
                        _DatePickerField(
                          label: 'Date of birth',
                          value: _dateOfBirth,
                          onTap: _editing
                              ? () => _pickDate(initial: _dateOfBirth, onPicked: (d) => setState(() => _dateOfBirth = d))
                              : null,
                        ),
                        OnboardingDropdown(
                          label: 'Gender',
                          value: _gender,
                          options: genderOptions,
                          onChanged: (v) => setState(() => _gender = v),
                          enabled: _editing,
                        ),
                        OnboardingDropdown(
                          label: 'Blood group',
                          value: _bloodGroup,
                          options: bloodGroupOptions,
                          onChanged: (v) => setState(() => _bloodGroup = v),
                          enabled: _editing,
                        ),
                        OnboardingTextField(
                          controller: _medicalHistory,
                          label: 'Medical history (optional)',
                          hint: 'Any conditions responders should know about in an emergency',
                          maxLines: 3,
                          enabled: _editing,
                        ),
                        OnboardingTextField(
                          controller: _allergies,
                          label: 'Allergies (optional)',
                          maxLines: 2,
                          enabled: _editing,
                        ),
                      ],
                    ),
                    OnboardingSection(
                      title: 'Driving licence',
                      children: [
                        OnboardingTextField(
                          controller: _drivingLicenceNumber,
                          label: 'Licence number',
                          hint: 'e.g. KA0120230012345',
                          enabled: _editing,
                        ),
                        _DatePickerField(
                          label: 'Expiry date',
                          value: _drivingLicenceExpiry,
                          onTap: _editing
                              ? () => _pickDate(
                                    initial: _drivingLicenceExpiry,
                                    onPicked: (d) => setState(() => _drivingLicenceExpiry = d),
                                  )
                              : null,
                        ),
                      ],
                    ),
                    OnboardingSection(
                      title: 'Address',
                      children: [
                        OnboardingTextField(
                          controller: _addressLine,
                          label: 'Address line',
                          hint: 'House / street',
                          enabled: _editing,
                        ),
                        OnboardingTextField(controller: _area, label: 'Area', enabled: _editing),
                        OnboardingTextField(controller: _district, label: 'District', enabled: _editing),
                        OnboardingTextField(
                          controller: _pincode,
                          label: 'Pincode',
                          keyboardType: TextInputType.number,
                          enabled: _editing,
                        ),
                        OnboardingTextField(controller: _country, label: 'Country', enabled: _editing),
                      ],
                    ),
                    OnboardingSection(
                      title: 'Emergency contacts',
                      subtitle: 'Add up to 3 people we can reach in case of an emergency during a ride.',
                      children: [
                        for (var i = 0; i < _contacts.length; i++) _contactCard(i),
                        if (_editing && _contacts.length < 3)
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
                          enabled: _editing,
                        ),
                        OnboardingTextField(controller: _governmentIdNumber, label: 'ID number', enabled: _editing),
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
                          enabled: _editing,
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
                                onTap: _editing ? () => setState(() => _ridingClubType = 'SOLO') : null,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: _ChoiceChipButton(
                                label: 'Club member',
                                selected: _ridingClubType == 'CLUB_MEMBER',
                                onTap: _editing ? () => setState(() => _ridingClubType = 'CLUB_MEMBER') : null,
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
                            enabled: _editing,
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
                    if (_editing) ...[
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: _saving ? null : _save,
                        child: _saving
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('Save'),
                      ),
                    ],
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
              if (_editing)
                IconButton(
                  onPressed: () => _removeContact(index),
                  icon: const Icon(Icons.close, size: 18),
                  tooltip: 'Remove',
                ),
            ],
          ),
          OnboardingTextField(controller: c.name, label: 'Name', enabled: _editing),
          OnboardingTextField(
            controller: c.phone,
            label: 'Phone',
            keyboardType: TextInputType.phone,
            hint: '+91 98765 43210',
            enabled: _editing,
          ),
          OnboardingTextField(
            controller: c.email,
            label: 'Email (optional)',
            keyboardType: TextInputType.emailAddress,
            enabled: _editing,
          ),
          OnboardingTextField(
            controller: c.relation,
            label: 'Relation (optional)',
            hint: 'e.g. Parent, Spouse, Friend',
            enabled: _editing,
          ),
        ],
      ),
    );
  }
}

class _PhotoAvatar extends StatelessWidget {
  const _PhotoAvatar({required this.file, required this.url, required this.uploading});

  final File? file;
  final String? url;
  final bool uploading;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        CircleAvatar(
          radius: 32,
          backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
          backgroundImage: file != null ? FileImage(file!) : (url != null ? NetworkImage(url!) : null) as ImageProvider?,
          child: (file == null && url == null) ? const Icon(Icons.camera_alt_outlined) : null,
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
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(kInputRadius),
        child: InputDecorator(
          decoration: InputDecoration(
            labelText: label,
            suffixIcon: onTap == null ? null : const Icon(Icons.calendar_today_outlined, size: 18),
            enabled: onTap != null,
          ),
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
  final VoidCallback? onTap;

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
