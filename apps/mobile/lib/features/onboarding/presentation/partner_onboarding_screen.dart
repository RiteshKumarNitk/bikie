import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/network/api_exception.dart';
import '../../auth/data/auth_repository.dart';
import '../../auth/domain/auth_controller.dart';
import '../data/partner_profile_model.dart';
import '../data/partner_profile_repository.dart';
import 'location_picker_field.dart';
import 'onboarding_widgets.dart';

/// `/partner-onboarding` — mirrors the web's post-signup partner-profile form
/// (`apps/web/app/partner-onboarding/page.tsx`), collecting the same fields via the same
/// `PUT /api/partner/profile` route. Shown once, right after a brand-new Partner signup
/// completes (see `signup_screen.dart`). Unlike rider onboarding, there is **no skip** — matches
/// web exactly, since a partner account is useless without at least business name/type/city.
class PartnerOnboardingScreen extends ConsumerStatefulWidget {
  const PartnerOnboardingScreen({super.key});

  @override
  ConsumerState<PartnerOnboardingScreen> createState() => _PartnerOnboardingScreenState();
}

class _PartnerOnboardingScreenState extends ConsumerState<PartnerOnboardingScreen> {
  final _fullName = TextEditingController();
  final _businessName = TextEditingController();
  final _city = TextEditingController();
  final _addressLine = TextEditingController();
  final _area = TextEditingController();
  final _pincode = TextEditingController();
  final _governmentIdNumber = TextEditingController();
  final _contactPerson1Name = TextEditingController();
  final _contactPerson1Mobile = TextEditingController();
  final _contactPerson2Name = TextEditingController();
  final _contactPerson2Mobile = TextEditingController();

  String _type = partnerTypes.first;
  String? _governmentIdType;
  LatLng? _location;
  bool _showContactPerson2 = false;

  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [
      _fullName,
      _businessName,
      _city,
      _addressLine,
      _area,
      _pincode,
      _governmentIdNumber,
      _contactPerson1Name,
      _contactPerson1Mobile,
      _contactPerson2Name,
      _contactPerson2Mobile,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (_businessName.text.trim().isEmpty || _city.text.trim().isEmpty) {
      setState(() => _error = 'Business name and city are required.');
      return;
    }

    setState(() {
      _error = null;
      _saving = true;
    });
    try {
      final name = _fullName.text.trim();
      if (name.isNotEmpty) {
        await ref.read(authRepositoryProvider).updateUser(name: name);
        await ref.read(authControllerProvider.notifier).refreshSession();
      }
      await ref.read(partnerProfileRepositoryProvider).save(PartnerProfileInput(
            businessName: _businessName.text.trim(),
            type: _type,
            city: _city.text.trim(),
            contactPerson1Name: _contactPerson1Name.text,
            contactPerson1Mobile: _contactPerson1Mobile.text,
            contactPerson2Name: _showContactPerson2 ? _contactPerson2Name.text : null,
            contactPerson2Mobile: _showContactPerson2 ? _contactPerson2Mobile.text : null,
            addressLine: _addressLine.text,
            area: _area.text,
            pincode: _pincode.text,
            latitude: _location?.latitude,
            longitude: _location?.longitude,
            governmentIdType: _governmentIdType,
            governmentIdNumber: _governmentIdNumber.text,
          ));
      if (mounted) context.go('/');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Complete your Partner Profile')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Tell us about your business. This helps us set up your fleet and payouts.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 20),
              OnboardingSection(
                title: 'Your details',
                children: [
                  OnboardingTextField(controller: _fullName, label: 'Full name', hint: 'As per government ID'),
                ],
              ),
              OnboardingSection(
                title: 'Business details',
                children: [
                  OnboardingTextField(
                    controller: _businessName,
                    label: 'Business name',
                    hint: 'e.g. Goa Moto Rentals',
                  ),
                  OnboardingDropdown(
                    label: 'Service type',
                    value: _type,
                    options: partnerTypes,
                    optionLabels: {for (final t in partnerTypes) t: t.replaceAll('_', ' ')},
                    onChanged: (v) => setState(() => _type = v ?? partnerTypes.first),
                  ),
                  OnboardingTextField(controller: _city, label: 'City', hint: 'e.g. Goa'),
                ],
              ),
              OnboardingSection(
                title: 'Shop address',
                children: [
                  OnboardingTextField(
                    controller: _addressLine,
                    label: 'Address line (optional)',
                    hint: 'Shop / street',
                  ),
                  OnboardingTextField(controller: _area, label: 'Area (optional)'),
                  OnboardingTextField(
                    controller: _pincode,
                    label: 'Pincode (optional)',
                    hint: '6-digit pincode',
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 4),
                  Text('Map location (optional)', style: Theme.of(context).textTheme.labelLarge),
                  const SizedBox(height: 8),
                  LocationPickerField(
                    value: _location,
                    onChanged: (position) => setState(() => _location = position),
                  ),
                ],
              ),
              OnboardingSection(
                title: 'Government ID',
                subtitle: "Collected as plain text for reference only — we don't run identity verification on this.",
                children: [
                  OnboardingDropdown(
                    label: 'ID type (optional)',
                    value: _governmentIdType,
                    options: governmentIdTypes.keys.toList(),
                    optionLabels: governmentIdTypes,
                    onChanged: (v) => setState(() => _governmentIdType = v),
                  ),
                  OnboardingTextField(controller: _governmentIdNumber, label: 'ID number (optional)'),
                ],
              ),
              OnboardingSection(
                title: 'Contact person',
                children: [
                  OnboardingTextField(
                    controller: _contactPerson1Name,
                    label: 'Name',
                    hint: 'e.g. Rahul Sharma',
                  ),
                  OnboardingTextField(
                    controller: _contactPerson1Mobile,
                    label: 'Mobile number',
                    hint: '10-digit mobile number',
                    keyboardType: TextInputType.phone,
                  ),
                  if (_showContactPerson2) ...[
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Contact person 2 (optional)',
                            style: Theme.of(context).textTheme.labelLarge,
                          ),
                        ),
                        TextButton(
                          onPressed: () => setState(() {
                            _showContactPerson2 = false;
                            _contactPerson2Name.clear();
                            _contactPerson2Mobile.clear();
                          }),
                          child: const Text('Remove'),
                        ),
                      ],
                    ),
                    OnboardingTextField(
                      controller: _contactPerson2Name,
                      label: 'Name',
                      hint: 'e.g. Priya Verma',
                    ),
                    OnboardingTextField(
                      controller: _contactPerson2Mobile,
                      label: 'Mobile number',
                      hint: '10-digit mobile number',
                      keyboardType: TextInputType.phone,
                    ),
                  ] else
                    Align(
                      alignment: Alignment.centerLeft,
                      child: TextButton(
                        onPressed: () => setState(() => _showContactPerson2 = true),
                        child: const Text('+ Add another contact'),
                      ),
                    ),
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
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Save & continue'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
