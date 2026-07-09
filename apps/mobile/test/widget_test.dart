import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/main.dart';

void main() {
  testWidgets('App boots without throwing while session bootstrap is pending', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: BikieApp()));
    await tester.pump();

    // Session bootstrap (a real network call) is still in flight — widget
    // tests don't drive real async I/O without `runAsync`, so we only assert
    // the initial splash renders cleanly rather than waiting for it to
    // resolve. End-to-end auth/session behavior is covered by running the
    // app against a live backend (see .docs/TASKS.md verification notes).
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
