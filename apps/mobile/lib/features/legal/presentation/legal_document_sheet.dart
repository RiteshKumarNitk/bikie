import 'package:flutter/material.dart';

import '../data/legal_models.dart';

/// ADR-090 — shows one current legal document in full, so a user can read exactly what they are
/// agreeing to before checking the signup consent box. Read-only: legal text is managed only from
/// the web Admin Dashboard.
Future<void> showLegalDocumentSheet(BuildContext context, CurrentLegalDocument document) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (context) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 1,
      builder: (context, controller) => _LegalDocumentView(document: document, controller: controller),
    ),
  );
}

class _LegalDocumentView extends StatelessWidget {
  const _LegalDocumentView({required this.document, required this.controller});

  final CurrentLegalDocument document;
  final ScrollController controller;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final published = DateTime.tryParse(document.publishedAt)?.toLocal();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 8, 8),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(document.title, style: textTheme.titleLarge),
                    Text(
                      published != null
                          ? 'Version ${document.version} · Effective ${published.day}/${published.month}/${published.year}'
                          : 'Version ${document.version}',
                      style: textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.close),
                tooltip: 'Close',
              ),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: ListView(
            controller: controller,
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
            children: [LegalContentView(content: document.content)],
          ),
        ),
      ],
    );
  }
}

/// Same minimal format as the web's `LegalContent`: `# ` / `## ` lines are headings, blank lines
/// separate paragraphs, single newlines are kept. Rendered as plain text only.
class LegalContentView extends StatelessWidget {
  const LegalContentView({super.key, required this.content});

  final String content;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final children = <Widget>[];
    final paragraph = <String>[];

    void flush() {
      if (paragraph.isEmpty) return;
      children.add(Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Text(paragraph.join('\n'), style: textTheme.bodyMedium),
      ));
      paragraph.clear();
    }

    for (final raw in content.replaceAll('\r\n', '\n').split('\n')) {
      final line = raw.trimRight();
      if (line.startsWith('## ')) {
        flush();
        children.add(Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 6),
          child: Text(line.substring(3).trim(), style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
        ));
      } else if (line.startsWith('# ')) {
        flush();
        children.add(Padding(
          padding: const EdgeInsets.only(top: 12, bottom: 8),
          child: Text(line.substring(2).trim(), style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        ));
      } else if (line.trim().isEmpty) {
        flush();
      } else {
        paragraph.add(line);
      }
    }
    flush();

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: children);
  }
}
