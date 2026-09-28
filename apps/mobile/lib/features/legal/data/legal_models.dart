import 'package:freezed_annotation/freezed_annotation.dart';

part 'legal_models.freezed.dart';
part 'legal_models.g.dart';

/// ADR-090 — mirrors `packages/types/src/legal.ts` `CurrentLegalDocumentDTO`: one currently
/// published legal document, exactly as a user must see it before accepting.
@freezed
class CurrentLegalDocument with _$CurrentLegalDocument {
  const factory CurrentLegalDocument({
    required String documentId,
    required String type,
    required String title,
    required String versionId,
    required int version,
    required String content,
    required String publishedAt,
  }) = _CurrentLegalDocument;

  factory CurrentLegalDocument.fromJson(Map<String, dynamic> json) => _$CurrentLegalDocumentFromJson(json);
}

/// `GET /api/legal/current`. [versionIds] is exactly what signup must send back as consent.
@freezed
class CurrentLegalDocuments with _$CurrentLegalDocuments {
  const factory CurrentLegalDocuments({
    required List<CurrentLegalDocument> documents,
    required List<String> versionIds,
  }) = _CurrentLegalDocuments;

  factory CurrentLegalDocuments.fromJson(Map<String, dynamic> json) => _$CurrentLegalDocumentsFromJson(json);
}

/// The consent a new account is created with: the exact versions shown + the account type chosen
/// on /welcome. Sent as headers on the account-creating OTP verify call — the server's `user.create`
/// hook rejects the signup without them (ADR-090).
class LegalConsent {
  const LegalConsent({required this.versionIds, required this.accountType});

  final List<String> versionIds;
  final String accountType;

  Map<String, String> toHeaders() => {
        'x-legal-consent-versions': versionIds.join(','),
        'x-legal-consent-account-type': accountType,
      };
}
