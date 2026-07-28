import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/empty_state.dart';
import '../data/sos_model.dart';
import '../data/sos_repository.dart';
import '../domain/sos_providers.dart';
import 'send_sos_sheet.dart';

class SosScreen extends ConsumerWidget {
  const SosScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final alerts = ref.watch(activeSosAlertsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('SOS Emergency')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showSendSosSheet(context),
        backgroundColor: Theme.of(context).colorScheme.error,
        icon: const Icon(Icons.sos),
        label: const Text('Send SOS'),
      ),
      body: alerts.when(
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(
              icon: Icons.shield_outlined,
              title: 'No active alerts',
              message: 'Tap "Send SOS" if you need roadside help.',
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(activeSosAlertsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) => _AlertCard(alert: list[index]),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) {
          if (error is ApiException && error.isMembershipRequired) {
            return EmptyState(
              icon: Icons.workspace_premium_outlined,
              title: 'Membership required',
              message: error.message,
              actionLabel: 'View membership plans',
              onAction: () => context.push('/membership'),
            );
          }
          return EmptyState(
            icon: Icons.error_outline,
            title: "Couldn't load SOS alerts",
            message: error is ApiException ? error.message : null,
            actionLabel: 'Retry',
            onAction: () => ref.invalidate(activeSosAlertsProvider),
          );
        },
      ),
    );
  }
}

class _AlertCard extends ConsumerWidget {
  const _AlertCard({required this.alert});

  final SOSAlert alert;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.warning_amber_rounded, color: Theme.of(context).colorScheme.error),
                const SizedBox(width: 8),
                Text(alert.type.replaceAll('_', ' '), style: Theme.of(context).textTheme.titleMedium),
                const Spacer(),
                Text(alert.status, style: Theme.of(context).textTheme.labelSmall),
              ],
            ),
            const SizedBox(height: 8),
            Text('${alert.userName} · ${alert.city}', style: Theme.of(context).textTheme.bodyMedium),
            if (alert.description != null) ...[
              const SizedBox(height: 4),
              Text(alert.description!),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                OutlinedButton(
                  onPressed: () async {
                    await ref.read(sosRepositoryProvider).respond(alert.id);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Reporter notified you're nearby")),
                      );
                    }
                  },
                  child: const Text("I'm nearby"),
                ),
                const SizedBox(width: 8),
                TextButton(
                  onPressed: () async {
                    await ref.read(sosRepositoryProvider).resolve(alert.id);
                    ref.invalidate(activeSosAlertsProvider);
                  },
                  child: const Text('Mark resolved'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
