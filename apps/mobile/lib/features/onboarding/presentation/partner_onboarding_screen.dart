import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/app_toast.dart';
import '../../auth/data/auth_repository.dart';
import '../../auth/domain/auth_controller.dart';
import '../../sos/domain/sos_providers.dart';
import '../data/geocoding_repository.dart';
import '../data/partner_profile_model.dart';
import '../data/partner_profile_repository.dart';
import 'location_picker_field.dart';
import 'onboarding_widgets.dart';

/// `/partner-onboarding` — mirrors the web's post-signup partner-profile form
/// (`apps/web/app/partner-onboarding/page.tsx`), collecting the same fields via the same
/// `PUT /api/partner/profile` route. Shown once, right after a brand-new Partner signup
/// completes (see `signup_screen.dart`). Unlike rider onboarding, there is **no skip** — matches
/// web exactly, since a partner account is useless without at least business name/type/city.
///
/// Also reused as the "Business Profile" editor from the Partner Profile tab (mirrors
/// `PartnerSettingsForm.tsx`/`/partner/settings` on web, which reuses the same
/// `PartnerBusinessFields` the onboarding form uses) — pass [initialProfile] to pre-fill and
/// switch the screen into edit mode (title/button copy, pops back instead of routing home).
class PartnerOnboardingScreen extends ConsumerStatefulWidget {
  const PartnerOnboardingScreen({super.key, this.initialProfile});

  final PartnerProfileSummary? initialProfile;

  @override
  ConsumerState<PartnerOnboardingScreen> createState() => _PartnerOnboardingScreenState();
}

class _PartnerOnboardingScreenState extends ConsumerState<PartnerOnboardingScreen> {
  final _fullName = TextEditingController();
  final _businessName = TextEditingController();
  final _businessMobile = TextEditingController();
  final _businessEmail = TextEditingController();
  final _city = TextEditingController();
  final _addressLine = TextEditingController();
  final _area = TextEditingController();
  final _pincode = TextEditingController();
  final _governmentIdNumber = TextEditingController();
  final _workingHours = TextEditingController();
  final _serviceRadiusKm = TextEditingController();
  final _yearsOfExperience = TextEditingController();
  final _contactPerson1Name = TextEditingController();
  final _contactPerson1Mobile = TextEditingController();
  final _contactPerson2Name = TextEditingController();
  final _contactPerson2Mobile = TextEditingController();

  String _type = partnerTypes.first;
  String? _governmentIdType;
  /// The last *confirmed* map location — only ever set by "Confirm location" (or loaded from the
  /// saved profile), never by merely moving the map. Required to save: SOS dispatch and nearby
  /// provider search only consider providers with coordinates (ADR-091).
  LatLng? _location;
  bool _locationUnconfirmed = false;
  int _geocodeRequest = 0;
  bool _showContactPerson2 = false;

  bool _saving = false;
  String? _error;

  bool get _isEditMode => widget.initialProfile != null;

  @override
  void initState() {
    super.initState();
    // ADR-053 — this form is Service-Provider-accountType only now; a Rider landing here
    // (stale deep link, back button) is sent to request a change instead of filling out a form
    // that would 400 on submit (`PUT /api/partner/profile` is gated the same way server-side).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final user = ref.read(authControllerProvider).user;
      if (user != null && user.accountType != 'SERVICE_PROVIDER') {
        context.go('/account-type-request');
      }
    });
    // Pre-fill from the existing account — a common path here is an approved Account Type
    // Change Request (Rider -> Service Provider), where the name is already known.
    final accountName = ref.read(authControllerProvider).user?.name;
    if (accountName != null && accountName.isNotEmpty) _fullName.text = accountName;

    final profile = widget.initialProfile;
    if (profile != null) {
      _businessName.text = profile.businessName;
      _businessMobile.text = profile.businessMobile ?? '';
      _businessEmail.text = profile.businessEmail ?? '';
      _type = profile.type;
      _city.text = profile.city ?? '';
      _addressLine.text = profile.addressLine ?? '';
      _area.text = profile.area ?? '';
      _pincode.text = profile.pincode ?? '';
      _governmentIdType = profile.governmentIdType;
      _governmentIdNumber.text = profile.governmentIdNumber ?? '';
      _workingHours.text = profile.workingHours ?? '';
      _serviceRadiusKm.text = profile.serviceRadiusKm?.toString() ?? '';
      _yearsOfExperience.text = profile.yearsOfExperience?.toString() ?? '';
      _contactPerson1Name.text = profile.contactPerson1Name ?? '';
      _contactPerson1Mobile.text = profile.contactPerson1Mobile ?? '';
      _contactPerson2Name.text = profile.contactPerson2Name ?? '';
      _contactPerson2Mobile.text = profile.contactPerson2Mobile ?? '';
      _showContactPerson2 = profile.contactPerson2Name != null || profile.contactPerson2Mobile != null;
      if (profile.latitude != null && profile.longitude != null) {
        _location = LatLng(profile.latitude!, profile.longitude!);
      }
    }
  }

  String _verificationLabel(String? status) {
    switch (status) {
      case 'APPROVED':
        return 'Verification status: ✓ Verified';
      case 'PENDING_VERIFICATION':
        return 'Verification status: pending';
      default:
        return 'Verification status: unverified (fully operational)';
    }
  }

  @override
  void dispose() {
    for (final c in [
      _fullName,
      _businessName,
      _businessMobile,
      _businessEmail,
      _city,
      _addressLine,
      _area,
      _pincode,
      _governmentIdNumber,
      _workingHours,
      _serviceRadiusKm,
      _yearsOfExperience,
      _contactPerson1Name,
      _contactPerson1Mobile,
      _contactPerson2Name,
      _contactPerson2Mobile,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  static final _emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

  static const _locationRequiredMessage = 'Please select and confirm your service location to continue.';

  /// Reuses the app's one GPS/permission path (`captureOneShotLocation`). Denied or unavailable
  /// returns null — the picker then falls back to manual selection; onboarding is never blocked.
  Future<LatLng?> _locateUser() async {
    final fix = await ref.read(oneShotLocationProvider)();
    return fix == null ? null : LatLng(fix.latitude, fix.longitude);
  }

  /// Runs once per confirmed pin (not per map movement). Only fills address fields that are still
  /// empty — anything the provider typed is kept as-is.
  Future<void> _onLocationConfirmed(LatLng position) async {
    setState(() {
      _location = position;
      _locationUnconfirmed = false;
      if (_error == _locationRequiredMessage) _error = null;
    });
    final request = ++_geocodeRequest;
    final address = await ref.read(geocodingRepositoryProvider).reverse(position);
    // A newer confirmation superseded this one while it was in flight.
    if (!mounted || address == null || request != _geocodeRequest) return;

    var filled = 0;
    void fillIfEmpty(TextEditingController controller, String? value) {
      if (value == null || controller.text.trim().isNotEmpty) return;
      controller.text = value;
      filled++;
    }

    setState(() {
      fillIfEmpty(_city, address.city);
      fillIfEmpty(_area, address.area);
      fillIfEmpty(_pincode, address.pincode);
      fillIfEmpty(_addressLine, address.road);
    });
    if (filled > 0) {
      showAppToast(context, 'Filled empty address fields from your map location — please check them.');
    }
  }

  Future<void> _save() async {
    if (_businessName.text.trim().isEmpty || _city.text.trim().isEmpty) {
      setState(() => _error = 'Business name and city are required.');
      return;
    }
    if (_businessMobile.text.trim().length < 10) {
      setState(() => _error = 'Enter a valid business mobile number.');
      return;
    }
    if (!_emailRegex.hasMatch(_businessEmail.text.trim())) {
      setState(() => _error = 'Enter a valid business email address.');
      return;
    }
    // A confirmed map location is required; GPS permission is not (manual selection works).
    if (_location == null) {
      setState(() => _error = _locationRequiredMessage);
      return;
    }
    if (_locationUnconfirmed) {
      setState(() => _error = 'You moved the map but didn\'t confirm the new location. Tap "Confirm location" to use it.');
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
      }
      await ref.read(partnerProfileRepositoryProvider).save(PartnerProfileInput(
            businessName: _businessName.text.trim(),
            businessMobile: _businessMobile.text.trim().isEmpty ? null : _businessMobile.text.trim(),
            businessEmail: _businessEmail.text.trim().isEmpty ? null : _businessEmail.text.trim(),
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
            workingHours: _workingHours.text,
            serviceRadiusKm: int.tryParse(_serviceRadiusKm.text),
            yearsOfExperience: int.tryParse(_yearsOfExperience.text),
          ));
      // Refresh unconditionally (not just when `name` changed) — the very first call into this
      // save path for a brand-new signup is also the moment `partnerStatus` actually moves
      // NOT_APPLIED -> DRAFT server-side (ADR-046b); app_router.dart's `isPartner` branch and
      // the Profile tab both need the app's local auth state to reflect that immediately, not
      // just after an incidental name update. `role` itself is never touched here anymore.
      await ref.read(authControllerProvider.notifier).refreshSession();
      if (!mounted) return;
      showAppToast(
        context,
        _isEditMode ? 'Profile updated successfully' : 'Profile created successfully',
        variant: AppToastVariant.success,
      );
      if (_isEditMode) {
        context.pop();
      } else {
        // ADR-056 — was `context.go('/become-provider')`, which for a brand-new
        // SERVICE_PROVIDER-accountType account immediately redirected right back to
        // `/partner-onboarding` (`BecomeProviderScreen`'s own redirect logic, written for the
        // superseded ADR-046b application-review model) — a real bug: the provider who just
        // saved their profile landed back on a blank copy of the same form instead of
        // progressing. The profile itself needs no approval (FINAL PRODUCT MODEL, ADR-049) and
        // no membership either — creating/saving it is always allowed. Actually *operating* as a
        // provider (SOS, availability) needs the ₹99/month membership, so that's the next stop;
        // `/partner-membership` has its own "Skip for Now" out to `/`, so this never blocks
        // onboarding — mirrors web's `/partner-onboarding` → `/partner/membership` redirect.
        context.go('/partner-membership');
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
      if (mounted) showAppToast(context, e.message, variant: AppToastVariant.error);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditMode ? 'Business Profile' : 'Complete your Partner Profile'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                _isEditMode
                    ? 'Update your business details. Riders and the SOS dispatch system see this information.'
                    : 'Tell us about your business. This helps us set up your fleet and payouts.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              if (_isEditMode && widget.initialProfile != null) ...[
                const SizedBox(height: 8),
                // FINAL PRODUCT MODEL — verification is a separate trust badge: APPROVED =
                // Verified, PENDING_VERIFICATION = pending, everything else = unverified (but
                // fully operational).
                Text(
                  _verificationLabel(widget.initialProfile!.verificationStatus),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
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
                    label: 'Business name *',
                    hint: 'e.g. Goa Moto Rentals',
                  ),
                  OnboardingTextField(
                    controller: _businessMobile,
                    label: 'Business mobile *',
                    hint: '10-digit number',
                    keyboardType: TextInputType.phone,
                  ),
                  OnboardingTextField(
                    controller: _businessEmail,
                    label: 'Business email *',
                    hint: 'e.g. hello@goamoto.com',
                    keyboardType: TextInputType.emailAddress,
                  ),
                  OnboardingDropdown(
                    label: 'Service type *',
                    value: _type,
                    options: partnerTypes,
                    optionLabels: {for (final t in partnerTypes) t: t.replaceAll('_', ' ')},
                    onChanged: (v) => setState(() => _type = v ?? partnerTypes.first),
                  ),
                  OnboardingTextField(controller: _city, label: 'City *', hint: 'e.g. Goa'),
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
                  Text('Service location on map *', style: Theme.of(context).textTheme.labelLarge),
                  const SizedBox(height: 2),
                  Text(
                    'SOS assistance requests reach you based on this pin. Place it where you actually operate.',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 8),
                  LocationPickerField(
                    value: _location,
                    confirmMode: true,
                    autoLocate: true,
                    locateUser: _locateUser,
                    resolveFallbackCenter: () => ref.read(geocodingRepositoryProvider).searchCity(_city.text),
                    onUnconfirmedChange: (v) => setState(() => _locationUnconfirmed = v),
                    onChanged: _onLocationConfirmed,
                  ),
                ],
              ),
              OnboardingSection(
                title: 'Operations',
                children: [
                  OnboardingTextField(
                    controller: _workingHours,
                    label: 'Working hours (optional)',
                    hint: 'e.g. Mon–Sat 9:00–19:00',
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: OnboardingTextField(
                          controller: _serviceRadiusKm,
                          label: 'Service radius (km, optional)',
                          hint: 'e.g. 20',
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OnboardingTextField(
                          controller: _yearsOfExperience,
                          label: 'Years of experience (optional)',
                          hint: 'e.g. 8',
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
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
                title: 'Contact person (optional)',
                children: [
                  OnboardingTextField(
                    controller: _contactPerson1Name,
                    label: 'Name (optional)',
                    hint: 'e.g. Rahul Sharma',
                  ),
                  OnboardingTextField(
                    controller: _contactPerson1Mobile,
                    label: 'Mobile number (optional)',
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
                    : Text(_isEditMode ? 'Save changes' : 'Save & continue'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
