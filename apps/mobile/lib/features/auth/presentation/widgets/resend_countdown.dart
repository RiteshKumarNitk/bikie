import 'dart:async';

import 'package:flutter/widgets.dart';

/// Mirrors `apps/web/lib/use-resend-countdown.ts` — a ticking countdown for the OTP resend
/// button. Mix into a `State<T>`, call `startResendCountdown()` after each successful send.
mixin ResendCountdownMixin<T extends StatefulWidget> on State<T> {
  Timer? _resendTimer;
  int _resendRemaining = 0;

  int get resendRemaining => _resendRemaining;
  bool get canResend => _resendRemaining == 0;

  void startResendCountdown([int seconds = 60]) {
    _resendTimer?.cancel();
    setState(() => _resendRemaining = seconds);
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_resendRemaining <= 1) {
        _resendTimer?.cancel();
        if (mounted) setState(() => _resendRemaining = 0);
        return;
      }
      if (mounted) setState(() => _resendRemaining -= 1);
    });
  }

  @override
  void dispose() {
    _resendTimer?.cancel();
    super.dispose();
  }
}
