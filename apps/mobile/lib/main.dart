import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/providers.dart';
import 'core/push/notification_deep_link.dart';
import 'core/push/push_bootstrap.dart';
import 'core/router/app_router.dart';
import 'core/storage/app_preferences.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/domain/auth_controller.dart';
import 'features/auth/domain/auth_state.dart';
import 'features/auth/presentation/widgets/msg91_widget_host.dart';
import 'features/onboarding/presentation/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  // Sets up Firebase, the background message handler, and local-notification channels before
  // any UI builds — so a terminated-app launch triggered by tapping a push (`getInitialMessage`,
  // checked inside this call) is captured from the very first frame (ADR-035).
  await bootstrapPushNotifications();
  runApp(
    ProviderScope(
      overrides: [appPreferencesProvider.overrideWithValue(AppPreferences(prefs))],
      child: const BikieApp(),
    ),
  );
}

class BikieApp extends ConsumerWidget {
  const BikieApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Activates the notification-tap subscription for the app's lifetime — a no-op provider
    // watch otherwise, deduped by Riverpod so this never subscribes twice.
    ref.watch(pushTapListenerProvider);

    final status = ref.watch(authControllerProvider.select((s) => s.status));

    if (status == AuthStatus.unknown) {
      return MaterialApp(
        theme: AppTheme.dark,
        darkTheme: AppTheme.dark,
        themeMode: ThemeMode.dark,
        home: const SplashScreen(),
      );
    }

    final router = ref.watch(routerProvider);

    // A push tap resolved to a route (possibly moments ago, via getInitialMessage — see main())
    // is applied here once we actually have a router and a settled auth state. `go`, not
    // `push`, so the target screen replaces whatever the router's initial location would have
    // shown — the app never renders Home first.
    ref.listen<String?>(pendingDeepLinkRouteProvider, (previous, next) {
      if (next == null || status != AuthStatus.authenticated) return;
      router.go(next);
      ref.read(pendingDeepLinkRouteProvider.notifier).state = null;
    });

    return MaterialApp.router(
      title: 'BIKIE',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.dark,
      routerConfig: router,
      // Mounts the headless MSG91 widget WebView once, above every route, so it's ready before
      // login/signup need it and survives navigation between them — see Msg91WidgetHost's doc
      // comment for why OTP send/verify runs through a WebView at all.
      builder: (context, child) => Stack(
        children: [
          if (child != null) child,
          const Msg91WidgetHost(),
        ],
      ),
    );
  }
}
