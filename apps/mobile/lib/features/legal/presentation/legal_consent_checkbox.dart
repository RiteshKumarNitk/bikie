import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../data/legal_models.dart';
import 'legal_document_sheet.dart';

const legalConsentRequiredMessage = 'Please accept the Terms & Conditions, Privacy Policy and Legal Terms to continue.';

/// ADR-090 — mandatory signup consent for both Rider and Service Provider accounts. Never
/// pre-checked: the caller owns [checked] and must start it `false`. Each document name opens its
/// current published version in full.
class LegalConsentCheckbox extends StatelessWidget {
  const LegalConsentCheckbox({
    super.key,
    required this.documents,
    required this.checked,
    required this.onChanged,
    this.enabled = true,
  });

  final List<CurrentLegalDocument> documents;
  final bool checked;
  final ValueChanged<bool> onChanged;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final bodyStyle = Theme.of(context).textTheme.bodySmall;
    final linkStyle = bodyStyle?.copyWith(
      color: AppTheme.accentTextOf(context),
      fontWeight: FontWeight.w600,
      decoration: TextDecoration.underline,
    );

    final spans = <InlineSpan>[const TextSpan(text: 'I have read and agree to the ')];
    for (var i = 0; i < documents.length; i++) {
      if (i > 0) spans.add(TextSpan(text: i == documents.length - 1 ? ' and ' : ', '));
      final document = documents[i];
      spans.add(WidgetSpan(
        alignment: PlaceholderAlignment.baseline,
        baseline: TextBaseline.alphabetic,
        child: Semantics(
          link: true,
          label: 'Read ${document.title}',
          child: InkWell(
            onTap: () => showLegalDocumentSheet(context, document),
            child: Text(document.title, style: linkStyle),
          ),
        ),
      ));
    }
    spans.add(const TextSpan(text: '.'));

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Checkbox(
          value: checked,
          onChanged: enabled ? (v) => onChanged(v ?? false) : null,
          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          visualDensity: VisualDensity.compact,
        ),
        const SizedBox(width: 4),
        Expanded(
          child: GestureDetector(
            // Tapping the sentence (outside a link) toggles the box, like a native label.
            onTap: enabled ? () => onChanged(!checked) : null,
            child: Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Text.rich(TextSpan(style: bodyStyle, children: spans)),
            ),
          ),
        ),
      ],
    );
  }
}
