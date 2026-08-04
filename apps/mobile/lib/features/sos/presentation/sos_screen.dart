import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/empty_state.dart';
import '../data/sos_model.dart';
import '../domain/sos_providers.dart';
import 'send_sos_sheet.dart';

class SosScreen extends ConsumerWidget {
  const SosScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final alerts = ref.watch(activeSosAlertsProvider);
    final city = ref.watch(sosActiveAlertsCityProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('SOS Emergency'),
        actions: [
          IconButton(
            icon: const Icon(Icons.location_city_outlined),
            tooltip: 'Set city',
            onPressed: () => _promptCity(context, ref),
          ),
          IconButton(
            icon: const Icon(Icons.near_me_outlined),
            tooltip: 'Nearby riders',
            onPressed: () => context.push('/sos/nearby-riders'),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showSendSosSheet(context),
        backgroundColor: Theme.of(context).colorScheme.error,
        icon: const Icon(Icons.sos),
        label: const Text('Send SOS'),
      ),
      body: alerts.when(
        data: (list) {
          if (list.isEmpty) {
            return EmptyState(
              icon: Icons.shield_outlined,
              title: 'No active alerts',
              message: city == null
                  ? 'Set your city to see nearby alerts, or tap "Send SOS" if you need help.'
                  : 'All clear right now.',
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
          if (error is ApiException && error.errorCode == 'CITY_REQUIRED') {
            return EmptyState(
              icon: Icons.location_city_outlined,
              title: 'Share your city',
              message: 'For everyone\'s privacy, SOS alerts are only shown to riders in the same city.',
              actionLabel: 'Set city',
              onAction: () => _promptCity(context, ref),
            );
          }
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

  Future<void> _promptCity(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController(text: ref.read(sosActiveAlertsCityProvider) ?? '');
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Your city'),
        content: TextField(controller: controller, decoration: const InputDecoration(hintText: 'e.g. Goa, Manali')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, controller.text.trim()), child: const Text('Save')),
        ],
      ),
    );
    if (result != null && result.isNotEmpty) {
      ref.read(sosActiveAlertsCityProvider.notifier).state = result;
    }
  }
}

class _AlertCard extends ConsumerWidget {
  const _AlertCard({required this.alert});

  final SOSAlert alert;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isEmergency = alert.severity == 'EMERGENCY';
    return Card(
      child: InkWell(
        onTap: () => context.push('/sos/${alert.id}'),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: Theme.of(context).colorScheme.error),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(alert.type.replaceAll('_', ' '), style: Theme.of(context).textTheme.titleMedium),
                  ),
                  Chip(
                    label: Text(isEmergency ? 'Emergency' : 'Assistance', style: const TextStyle(fontSize: 11)),
                    backgroundColor: isEmergency
                        ? Colors.red.withValues(alpha: 0.15)
                        : Colors.orange.withValues(alpha: 0.15),
                    padding: EdgeInsets.zero,
                    visualDensity: VisualDensity.compact,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text('${alert.userName} · ${alert.city}', style: Theme.of(context).textTheme.bodyMedium),
              if (alert.description != null) ...[
                const SizedBox(height: 4),
                Text(alert.description!),
              ],
              const SizedBox(height: 8),
              Text(
                alert.assignedHelperId != null
                    ? 'Helper assigned'
                    : 'Searching: ${alert.escalationTier.replaceAll('_', ' ').toLowerCase()} · ${alert.currentRadiusMeters ~/ 1000}km',
                style: Theme.of(context).textTheme.labelSmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
