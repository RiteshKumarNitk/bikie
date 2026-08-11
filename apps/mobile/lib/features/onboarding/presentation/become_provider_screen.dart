import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/domain/auth_controller.dart';
import '../../auth/domain/role_provider.dart';

/// ADR-053 — this screen's old job ("any Rider can self-service start a Service Provider
/// application") no longer exists: `accountType` is fixed at registration and only ever changed
/// by an admin-approved Account Type Change Request. Kept only as a redirect for any stale
/// deep link, so nobody hits a dead screen.
class BecomeProviderScreen extends ConsumerStatefulWidget {
  const BecomeProviderScreen({super.key});

  @override
  ConsumerState<BecomeProviderScreen> createState() => _BecomeProviderScreenState();
}

class _BecomeProviderScreenState extends ConsumerState<BecomeProviderScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final user = ref.read(authControllerProvider).user;
      context.go(isServiceProviderAccountType(user?.accountType) ? '/partner-onboarding' : '/account-type-request');
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}
