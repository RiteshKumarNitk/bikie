import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

/// Shared layout pieces between `rider_onboarding_screen.dart` and
/// `partner_onboarding_screen.dart` — both mirror web onboarding forms built from the same kind
/// of grouped, labeled sections.
class OnboardingSection extends StatelessWidget {
  const OnboardingSection({super.key, required this.title, required this.children, this.subtitle});

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

class OnboardingTextField extends StatelessWidget {
  const OnboardingTextField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.maxLines = 1,
    this.keyboardType,
    this.enabled = true,
  });

  final TextEditingController controller;
  final String label;
  final String? hint;
  final int maxLines;
  final TextInputType? keyboardType;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: keyboardType,
        enabled: enabled,
        decoration: InputDecoration(labelText: label, hintText: hint),
      ),
    );
  }
}

class OnboardingDropdown extends StatelessWidget {
  const OnboardingDropdown({
    super.key,
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
    this.optionLabels,
    this.enabled = true,
  });

  final String label;
  final String? value;
  final List<String> options;
  final Map<String, String>? optionLabels;
  final ValueChanged<String?> onChanged;
  final bool enabled;

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
        onChanged: enabled ? onChanged : null,
      ),
    );
  }
}
