import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../data/rider_profile_model.dart';
import '../data/rider_profile_repository.dart';

/// `/onboarding` — mirrors the web's post-signup rider-profile form (`apps/web/app/onboarding/
/// page.tsx`), collecting the same `RiderProfile` fields via the same `PUT /api/rider-profile`
/// route. Shown once, right after a brand-new signup completes (see `signup_screen.dart`).
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

  Future<void> _save() async {
    setState(() {
      _error = null;
      _saving = true;
    });
    try {
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
              _Section(
                title: 'Vehicle details',
                children: [
                  _Dropdown(
                    label: 'Vehicle type',
                    value: _vehicleType,
                    options: vehicleTypeOptions,
                    onChanged: (v) => setState(() => _vehicleType = v),
                  ),
                  _field(_vehicleBrand, 'Brand', hint: 'e.g. Royal Enfield'),
                  _field(_vehicleModel, 'Model', hint: 'e.g. Classic 350'),
                ],
              ),
              _Section(
                title: 'Rider profile',
                children: [
                  _field(_fatherName, "Father's name"),
                  _field(_motherName, "Mother's name"),
                  _DatePickerField(
                    label: 'Date of birth',
                    value: _dateOfBirth,
                    onTap: () => _pickDate(initial: _dateOfBirth, onPicked: (d) => setState(() => _dateOfBirth = d)),
                  ),
                  _Dropdown(
                    label: 'Gender',
                    value: _gender,
                    options: genderOptions,
                    onChanged: (v) => setState(() => _gender = v),
                  ),
                  _Dropdown(
                    label: 'Blood group',
                    value: _bloodGroup,
                    options: bloodGroupOptions,
                    onChanged: (v) => setState(() => _bloodGroup = v),
                  ),
                  _field(
                    _medicalHistory,
                    'Medical history (optional)',
                    hint: 'Any conditions responders should know about in an emergency',
                    maxLines: 3,
                  ),
                  _field(_allergies, 'Allergies (optional)', maxLines: 2),
                ],
              ),
              _Section(
                title: 'Driving licence',
                children: [
                  _field(_drivingLicenceNumber, 'Licence number', hint: 'e.g. KA0120230012345'),
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
              _Section(
                title: 'Address',
                children: [
                  _field(_addressLine, 'Address line', hint: 'House / street'),
                  _field(_area, 'Area'),
                  _field(_district, 'District'),
                  _field(_pincode, 'Pincode', keyboardType: TextInputType.number),
                  _field(_country, 'Country'),
                ],
              ),
              _Section(
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
              _Section(
                title: 'Government ID',
                subtitle: "Collected as plain text for reference only — we don't run identity verification on this.",
                children: [
                  _Dropdown(
                    label: 'ID type',
                    value: _governmentIdType,
                    options: governmentIdTypeOptions.keys.toList(),
                    optionLabels: governmentIdTypeOptions,
                    onChanged: (v) => setState(() => _governmentIdType = v),
                  ),
                  _field(_governmentIdNumber, 'ID number'),
                ],
              ),
              _Section(
                title: 'Riding details',
                children: [
                  _Dropdown(
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
                    _field(_clubName, 'Club name', hint: 'e.g. Himalayan Riders Collective'),
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
          _field(c.name, 'Name'),
          _field(c.phone, 'Phone', keyboardType: TextInputType.phone, hint: '+91 98765 43210'),
          _field(c.email, 'Email (optional)', keyboardType: TextInputType.emailAddress),
          _field(c.relation, 'Relation (optional)', hint: 'e.g. Parent, Spouse, Friend'),
        ],
      ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    String? hint,
    int maxLines = 1,
    TextInputType? keyboardType,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: keyboardType,
        decoration: InputDecoration(labelText: label, hintText: hint),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.children, this.subtitle});

  final String title;
  final String? subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(kCardRadius)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title.toUpperCase(),
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1, color: AppTheme.accentTextOf(context)),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle!, style: Theme.of(context).textTheme.bodySmall),
          ],
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }
}

class _Dropdown extends StatelessWidget {
  const _Dropdown({required this.label, required this.value, required this.options, required this.onChanged, this.optionLabels});

  final String label;
  final String? value;
  final List<String> options;
  final Map<String, String>? optionLabels;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DropdownButtonFormField<String>(
        initialValue: value,
        decoration: InputDecoration(labelText: label),
        isExpanded: true,
        items: options
            .map((o) => DropdownMenuItem(value: o, child: Text(optionLabels?[o] ?? o, overflow: TextOverflow.ellipsis)))
            .toList(),
        onChanged: onChanged,
      ),
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
