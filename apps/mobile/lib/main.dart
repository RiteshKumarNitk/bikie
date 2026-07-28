import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/providers.dart';
import 'core/router/app_router.dart';
import 'core/storage/app_preferences.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/domain/auth_controller.dart';
import 'features/auth/domain/auth_state.dart';
import 'features/onboarding/presentation/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
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
    return MaterialApp.router(
      title: 'BIKIE',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.dark,
      routerConfig: router,
    );
  }
}
