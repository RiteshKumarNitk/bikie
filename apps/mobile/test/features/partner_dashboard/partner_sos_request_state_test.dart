import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/partner_dashboard/presentation/partner_sos_request_screen.dart';
import 'package:mobile/features/sos/data/sos_model.dart';

SOSAlert _alert({String status = 'ACTIVE', String? assignedHelperId}) => SOSAlert(
      id: 'alert-1',
      userId: 'rider-1',
      userName: 'Rider One',
      userEmail: 'rider@bikie.app',
      type: 'BIKE_BREAKDOWN',
      latitude: 26.9124,
      longitude: 75.7873,
      city: 'Jaipur',
      status: status,
      severity: 'ASSISTANCE',
      escalationTier: 'SERVICE_PROVIDERS',
      currentRadiusMeters: 15000,
      assignedHelperId: assignedHelperId,
      createdAt: '2026-08-09T00:00:00.000Z',
    );

SOSOffer _offer({String status = 'OFFERED'}) => SOSOffer(
      id: 'offer-1',
      alertId: 'alert-1',
      responderId: 'partner-1',
      responderName: 'Speedy Repairs',
      status: status,
      createdAt: '2026-08-09T00:01:00.000Z',
    );

SOSSessionDetail _session({required String helperId}) => SOSSessionDetail(
      id: 'session-1',
      status: 'ACTIVE',
      helper: SOSParticipant(id: helperId, name: 'Speedy Repairs', email: 'partner@bikie.app'),
      rider: const SOSParticipant(id: 'rider-1', name: 'Rider One', email: 'rider@bikie.app'),
    );

void main() {
  group('derivePartnerRequestState (ADR-044)', () {
    const me = 'partner-1';

    test('needsResponse: open alert, no offer from me yet', () {
      final state = derivePartnerRequestState(
        alert: _alert(),
        session: null,
        myOffer: null,
        currentUserId: me,
      );
      expect(state, PartnerRequestState.needsResponse);
    });

    test('waitingForRider: my OFFERED offer exists, alert still unassigned', () {
      final state = derivePartnerRequestState(
        alert: _alert(),
        session: null,
        myOffer: _offer(status: 'OFFERED'),
        currentUserId: me,
      );
      expect(state, PartnerRequestState.waitingForRider);
    });

    test('confirmed: a session exists with me as the helper, regardless of my offer state', () {
      final state = derivePartnerRequestState(
        alert: _alert(assignedHelperId: me),
        session: _session(helperId: me),
        myOffer: _offer(status: 'ACCEPTED'),
        currentUserId: me,
      );
      expect(state, PartnerRequestState.confirmed);
    });

    test('unavailable: someone else was assigned the alert', () {
      final state = derivePartnerRequestState(
        alert: _alert(assignedHelperId: 'other-partner'),
        session: null,
        myOffer: null,
        currentUserId: me,
      );
      expect(state, PartnerRequestState.unavailable);
    });

    test('unavailable: the alert is no longer ACTIVE (resolved/cancelled)', () {
      final state = derivePartnerRequestState(
        alert: _alert(status: 'RESOLVED'),
        session: null,
        myOffer: null,
        currentUserId: me,
      );
      expect(state, PartnerRequestState.unavailable);
    });

    test('confirmed takes priority over an assignedHelperId mismatch check when the session is mine', () {
      // Guards the exact ordering: session-is-mine must be checked before the generic
      // "someone else is assigned" branch, since assignedHelperId == me in this case too.
      final state = derivePartnerRequestState(
        alert: _alert(assignedHelperId: me, status: 'RESOLVED'),
        session: _session(helperId: me),
        myOffer: null,
        currentUserId: me,
      );
      expect(state, PartnerRequestState.confirmed);
    });
  });
}
