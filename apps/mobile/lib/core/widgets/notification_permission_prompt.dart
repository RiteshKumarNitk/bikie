import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/domain/auth_controller.dart';
import '../../features/auth/domain/role_provider.dart';
import '../providers.dart';
import '../push/notification_permission.dart';
import 'app_toast.dart';

/// How long before the explanation is offered again after "Not now". Shorter while the system
/// dialog can still be shown; longer once only Settings can help, so it doesn't nag.
const _repromptAfterCanRequest = Duration(days: 3);
const _repromptAfterBlocked = Duration(days: 7);

/// Explains why BIKIE needs notifications *before* the Android dialog appears, then shows it
/// (or, once Android won't show it anymore, opens Settings). Asking with context, at a calm
/// moment, is what gets people to tap "Allow" — the old flow fired the bare system dialog
/// mid-navigation right after OTP verification.
Future<void> showNotificationPermissionPrompt(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (_) => const SingleChildScrollView(child: _NotificationPermissionSheet()),
  );
}

class _NotificationPermissionSheet extends ConsumerStatefulWidget {
  const _NotificationPermissionSheet();

  @override
  ConsumerState<_NotificationPermissionSheet> createState() => _NotificationPermissionSheetState();
}

class _NotificationPermissionSheetState extends ConsumerState<_NotificationPermissionSheet> {
  bool _busy = false;

  Future<void> _allow() async {
    setState(() => _busy = true);
    final result = await ref.read(notificationPermissionProvider.notifier).request();
    if (!mounted) return;
    Navigator.of(context).pop();
    if (result == NotificationPermissionState.granted) {
      showAppToast(context, 'Notifications are on', variant: AppToastVariant.success);
    } else {
      showAppToast(context, 'Notifications are still off. You can turn them on anytime from Profile.');
    }
  }

  Future<void> _openSettings() async {
    Navigator.of(context).pop();
    // The gate re-checks when the app resumes from Settings.
    await ref.read(notificationPermissionProvider.notifier).openSystemSettings();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationPermissionProvider);
    final accountType = ref.watch(authControllerProvider.select((s) => s.user?.accountType));
    final reasons = isServiceProviderAccountType(accountType)
        ? const [
            'New SOS assistance requests near you',
            'Rider confirmations and session updates',
            'Messages and account updates',
          ]
        : const [
            'SOS alerts when a rider near you needs help',
            'Updates when someone responds to your SOS',
            'Ride requests, bookings and messages',
          ];
    final blocked = state == NotificationPermissionState.blocked;
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Icon(Icons.notifications_active_outlined, size: 44, color: Theme.of(context).colorScheme.error),
          const SizedBox(height: 12),
          Text('Turn on notifications', textAlign: TextAlign.center, style: textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(
            'BIKIE is a safety network — without notifications, you won\'t hear about emergencies in time.',
            textAlign: TextAlign.center,
            style: textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          for (final reason in reasons)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.check_circle_outline, size: 18),
                  const SizedBox(width: 10),
                  Expanded(child: Text(reason, style: textTheme.bodyMedium)),
                ],
              ),
            ),
          if (blocked) ...[
            const SizedBox(height: 8),
            Text(
              'Notifications are turned off for BIKIE on this phone. Open Settings → Notifications and switch them on.',
              style: textTheme.bodySmall,
            ),
          ],
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _busy ? null : (blocked ? _openSettings : _allow),
            child: _busy
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : Text(blocked ? 'Open settings' : 'Allow notifications'),
          ),
          const SizedBox(height: 4),
          TextButton(
            onPressed: _busy ? null : () => Navigator.of(context).pop(),
            child: const Text('Not now'),
          ),
        ],
      ),
    );
  }
}

/// Lives in the signed-in app shell. Checks the permission once the user is actually in the app
/// (never during login/signup/onboarding — those screens have their own dialogs, e.g. location,
/// and Android can't show two permission dialogs at once), offers the explanation at most once
/// per launch and not more often than the re-prompt intervals above, and re-checks whenever the
/// app comes back to the foreground (e.g. from Settings) so the token registers immediately.
class NotificationPermissionGate extends ConsumerStatefulWidget {
  const NotificationPermissionGate({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<NotificationPermissionGate> createState() => _NotificationPermissionGateState();
}

/// Once per app process — the gate is rebuilt on navigation and re-login, the prompt shouldn't be.
bool _offeredThisLaunch = false;

@visibleForTesting
void resetNotificationPromptForTest() => _offeredThisLaunch = false;

class _NotificationPermissionGateState extends ConsumerState<NotificationPermissionGate> with WidgetsBindingObserver {

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _maybeOffer());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) ref.read(notificationPermissionProvider.notifier).refresh();
  }

  Future<void> _maybeOffer() async {
    if (_offeredThisLaunch || !mounted) return;
    final state = await ref.read(notificationPermissionProvider.notifier).refresh();
    if (!mounted) return;
    if (state != NotificationPermissionState.canRequest && state != NotificationPermissionState.blocked) return;

    final prefs = ref.read(appPreferencesProvider);
    final lastShown = prefs.notificationPromptShownAt;
    final interval = state == NotificationPermissionState.blocked ? _repromptAfterBlocked : _repromptAfterCanRequest;
    if (lastShown != null && DateTime.now().difference(lastShown) < interval) return;

    _offeredThisLaunch = true;
    await prefs.setNotificationPromptShownAt(DateTime.now());
    if (mounted) await showNotificationPermissionPrompt(context);
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
