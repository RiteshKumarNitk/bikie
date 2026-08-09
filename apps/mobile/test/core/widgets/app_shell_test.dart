import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/widgets/app_shell.dart';

void main() {
  group('indexForTab (ADR-044 role-based tab selection)', () {
    test('selects Home for the root path on both tab sets', () {
      expect(indexForTab(AppShell.riderTabs, '/'), 0);
      expect(indexForTab(AppShell.partnerTabs, '/'), 0);
    });

    test('never matches a sibling route to Home via prefix', () {
      expect(indexForTab(AppShell.riderTabs, '/trips'), 1);
      expect(indexForTab(AppShell.partnerTabs, '/partner/requests'), 1);
    });

    test('matches partner tabs on prefix (nested SOS request under Requests)', () {
      expect(indexForTab(AppShell.partnerTabs, '/partner/requests'), 1);
      expect(indexForTab(AppShell.partnerTabs, '/partner/active'), 2);
      expect(indexForTab(AppShell.partnerTabs, '/messages'), 3);
      expect(indexForTab(AppShell.partnerTabs, '/messages/conv-1'), 3);
      expect(indexForTab(AppShell.partnerTabs, '/profile'), 4);
    });

    test('matches rider tabs identically to the pre-ADR-044 behavior', () {
      expect(indexForTab(AppShell.riderTabs, '/bikes'), 2);
      expect(indexForTab(AppShell.riderTabs, '/bookings'), 3);
      expect(indexForTab(AppShell.riderTabs, '/profile'), 4);
    });

    test('falls back to Home for a location neither tab set owns', () {
      expect(indexForTab(AppShell.riderTabs, '/sos/alert-1'), 0);
      expect(indexForTab(AppShell.partnerTabs, '/bikes'), 0);
    });

    test('rider and partner tab sets do not share a Requests/Active/Bikes/Bookings tab', () {
      expect(AppShell.riderTabs, isNot(contains('/partner/requests')));
      expect(AppShell.partnerTabs, isNot(contains('/bikes')));
    });
  });
}
