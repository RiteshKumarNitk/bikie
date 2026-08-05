import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Mirrors `apps/web/components/auth/PhoneNumberInput.tsx`: India-only, a
/// fixed +91 prefix + a 10-digit local number field. The web dropped its
/// `+1 USA` dropdown option once the server started rejecting non-Indian
/// numbers outright (`isValidIndianMobile`, ADR-032) — this mirrors that,
/// not the old two-country version.
const kDefaultCountryCode = '+91';

/// Composes the +91 prefix and a 10-digit local number into the E.164 string
/// the OTP endpoints expect, or null if the local number isn't exactly 10
/// digits — mirrors the web's `composePhoneNumber`.
String? composePhoneNumber(String localNumber) {
  final digits = localNumber.replaceAll(RegExp(r'\D'), '');
  if (digits.length != 10) return null;
  return '$kDefaultCountryCode$digits';
}

class PhoneNumberField extends StatefulWidget {
  const PhoneNumberField({
    super.key,
    required this.onLocalNumberChanged,
    this.enabled = true,
  });

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
        Container(
          height: 56,
          width: 64,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            border: Border.all(color: Theme.of(context).dividerColor),
            borderRadius: BorderRadius.circular(4),
          ),
          child: const Text('🇮🇳 +91'),
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
            decoration: const InputDecoration(labelText: 'Mobile number'),
            onChanged: widget.onLocalNumberChanged,
          ),
        ),
      ],
    );
  }
}
