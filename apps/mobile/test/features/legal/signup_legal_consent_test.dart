import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';
import 'package:mobile/features/auth/domain/role_provider.dart';
import 'package:mobile/features/auth/presentation/signup_screen.dart';
import 'package:mobile/features/legal/data/legal_models.dart';
import 'package:mobile/features/legal/domain/legal_providers.dart';
import 'package:mobile/features/legal/presentation/legal_consent_checkbox.dart';
import 'package:mocktail/mocktail.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

const _legal = CurrentLegalDocuments(
  documents: [
    CurrentLegalDocument(
      documentId: 'doc-terms',
      type: 'TERMS_AND_CONDITIONS',
      title: 'Terms & Conditions',
      versionId: 'terms-v3',
      version: 3,
      content: '## 1. Eligibility\nYou must be at least 18 years old.',
      publishedAt: '2026-09-28T00:00:00.000Z',
    ),
    CurrentLegalDocument(
      documentId: 'doc-privacy',
      type: 'PRIVACY_POLICY',
      title: 'Privacy Policy',
      versionId: 'privacy-v2',
      version: 2,
      content: 'We do not sell personal data.',
      publishedAt: '2026-09-20T00:00:00.000Z',
    ),
  ],
  versionIds: ['terms-v3', 'privacy-v2'],
);

void main() {
  late _MockAuthRepository repository;

  setUp(() {
    repository = _MockAuthRepository();
    // An existing number short-circuits before any OTP is sent — enough to prove the gate opened.
    when(() => repository.phoneExists(any())).thenAnswer(
      (_) async => (exists: true, hasRealName: true, accountType: 'RIDER', testOtpBypass: false),
    );
  });

  Future<void> pumpSignup(WidgetTester tester, {String role = 'RIDER'}) async {
    tester.view.physicalSize = const Size(412, 915);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(repository),
          currentLegalDocumentsProvider.overrideWith((ref) async => _legal),
          selectedRoleProvider.overrideWith((ref) => role),
        ],
        child: MaterialApp(theme: AppTheme.dark, home: const SignupScreen()),
      ),
    );
    await tester.pumpAndSettle();
  }

  for (final role in ['RIDER', 'SERVICE_PROVIDER']) {
    testWidgets('$role signup: consent is unchecked by default and blocks sending the code', (tester) async {
      await pumpSignup(tester, role: role);

      expect(tester.widget<Checkbox>(find.byType(Checkbox)).value, isFalse);

      await tester.enterText(find.byType(TextField).first, '9876543210');
      await tester.tap(find.text('Send code'));
      await tester.pumpAndSettle();

      expect(find.text(legalConsentRequiredMessage), findsOneWidget);
      verifyNever(() => repository.phoneExists(any()));
    });

    testWidgets('$role signup: checking consent lets the flow continue', (tester) async {
      await pumpSignup(tester, role: role);

      await tester.enterText(find.byType(TextField).first, '9876543210');
      await tester.tap(find.byType(Checkbox));
      await tester.pump();
      expect(tester.widget<Checkbox>(find.byType(Checkbox)).value, isTrue);

      await tester.tap(find.text('Send code'));
      await tester.pumpAndSettle();

      expect(find.text(legalConsentRequiredMessage), findsNothing);
      verify(() => repository.phoneExists(any())).called(1);
    });
  }

  testWidgets('document names open the current published version in full', (tester) async {
    await pumpSignup(tester);

    await tester.tap(find.text('Terms & Conditions'));
    await tester.pumpAndSettle();

    final effective = DateTime.parse('2026-09-28T00:00:00.000Z').toLocal();
    expect(find.text('Version 3 · Effective ${effective.day}/${effective.month}/${effective.year}'), findsOneWidget);
    expect(find.text('1. Eligibility'), findsOneWidget);
    expect(find.text('You must be at least 18 years old.'), findsOneWidget);
    // Opening a document must not tick the box on the user's behalf.
    await tester.tap(find.byTooltip('Close'));
    await tester.pumpAndSettle();
    expect(tester.widget<Checkbox>(find.byType(Checkbox)).value, isFalse);
  });
}
