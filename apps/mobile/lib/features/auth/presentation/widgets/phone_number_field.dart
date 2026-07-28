import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

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
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 100,
          child: DropdownButtonFormField<String>(
            initialValue: widget.countryCode,
            isExpanded: true,
            items: _countryCodes.map((c) => DropdownMenuItem(value: c.$1, child: Text(c.$2))).toList(),
            onChanged: widget.enabled ? (v) => widget.onCountryCodeChanged(v!) : null,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: TextField(
            controller: _controller,
            enabled: widget.enabled,
            keyboardType: TextInputType.number,
            // Digit-filtering/length-limiting done via TextInputFormatter,
            // not by hand-mutating `_controller.value` inside `onChanged` —
            // that pattern (an earlier version of this widget) fights the
            // web text-input plugin's own state sync and can make the field
            // appear to swallow keystrokes. Formatters are the supported way
            // to constrain input and don't have that problem.
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(10),
            ],
            decoration: const InputDecoration(hintText: '98765 43210'),
            onChanged: widget.onLocalNumberChanged,
          ),
        ),
      ],
    );
  }
}
