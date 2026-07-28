import 'package:flutter/material.dart';

/// Mirrors `apps/web/components/auth/PhoneNumberInput.tsx`: a country-code
/// dropdown (India default) + a 10-digit local number field.
const kDefaultCountryCode = '+91';
const _countryCodes = [
  ('+91', '🇮🇳 +91'),
  ('+1', '🇺🇸 +1'),
];

/// Composes a country code + 10-digit local number into the E.164 string the
/// OTP endpoints expect, or null if the local number isn't exactly 10 digits
/// — mirrors the web's `composePhoneNumber`.
String? composePhoneNumber(String countryCode, String localNumber) {
  final digits = localNumber.replaceAll(RegExp(r'\D'), '');
  if (digits.length != 10) return null;
  return '$countryCode$digits';
}

class PhoneNumberField extends StatefulWidget {
  const PhoneNumberField({
    super.key,
    required this.countryCode,
    required this.onCountryCodeChanged,
    required this.onLocalNumberChanged,
    this.enabled = true,
  });

  final String countryCode;
  final ValueChanged<String> onCountryCodeChanged;
  final ValueChanged<String> onLocalNumberChanged;
  final bool enabled;

  @override
  State<PhoneNumberField> createState() => _PhoneNumberFieldState();
}

class _PhoneNumberFieldState extends State<PhoneNumberField> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 96,
          child: DropdownButtonFormField<String>(
            initialValue: widget.countryCode,
            items: _countryCodes.map((c) => DropdownMenuItem(value: c.$1, child: Text(c.$2))).toList(),
            onChanged: widget.enabled ? (v) => widget.onCountryCodeChanged(v!) : null,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: TextField(
            controller: _controller,
            enabled: widget.enabled,
            keyboardType: TextInputType.phone,
            autofillHints: const [AutofillHints.telephoneNumberNational],
            decoration: const InputDecoration(hintText: '98765 43210'),
            onChanged: (value) {
              final digits = value.replaceAll(RegExp(r'\D'), '');
              final trimmed = digits.length > 10 ? digits.substring(0, 10) : digits;
              if (trimmed != value) {
                _controller.value = TextEditingValue(
                  text: trimmed,
                  selection: TextSelection.collapsed(offset: trimmed.length),
                );
              }
              widget.onLocalNumberChanged(trimmed);
            },
          ),
        ),
      ],
    );
  }
}
