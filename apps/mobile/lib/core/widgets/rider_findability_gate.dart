import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/nearby_riders/domain/rider_findability_service.dart';

/// Lives in the signed-in app shell, alongside `NotificationPermissionGate`. `AuthController`
/// already restores "Be findable in an emergency" right after login/signup/OTP-verify/bootstrap —
/// this covers the other half: the app staying open across backgrounding, being swiped from
/// recent apps and reopened, or a normal resume, none of which re-run auth bootstrap. Without this,
/// the periodic refresh `RiderFindabilityService.restore()` starts would silently stop the moment
/// the OS suspends the Dart isolate in the background, and never resume on its own.
class RiderFindabilityGate extends ConsumerStatefulWidget {
  const RiderFindabilityGate({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<RiderFindabilityGate> createState() => _RiderFindabilityGateState();
}

class _RiderFindabilityGateState extends ConsumerState<RiderFindabilityGate> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _restore());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _restore();
  }

  void _restore() {
    ref.read(riderFindabilityServiceProvider).restore();
    // The permission check itself may have changed too (e.g. the Rider granted it from Settings
    // and came back) — refresh what the Home row reads, never re-request it.
    ref.invalidate(riderLocationPermissionStateProvider);
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
