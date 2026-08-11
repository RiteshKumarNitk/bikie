import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../auth/domain/auth_controller.dart';
import '../data/account_type_request_model.dart';
import '../data/account_type_request_repository.dart';

const _statusLabel = {
  'PENDING': 'Pending review',
  'MORE_INFORMATION_REQUIRED': 'More information requested',
  'APPROVED': 'Approved',
  'REJECTED': 'Rejected',
};

/// ADR-053 — Profile → Help & Support → Account Type Request. `accountType` is set once at
/// registration and only ever changed by an admin approving a request submitted here.
class AccountTypeRequestScreen extends ConsumerStatefulWidget {
  const AccountTypeRequestScreen({super.key});

  @override
  ConsumerState<AccountTypeRequestScreen> createState() => _AccountTypeRequestScreenState();
}

class _AccountTypeRequestScreenState extends ConsumerState<AccountTypeRequestScreen> {
  final _reasonController = TextEditingController();
  final _supportingInfoController = TextEditingController();

  List<AccountTypeChangeRequest> _requests = [];
  bool _loading = true;
  bool _submitting = false;
  bool _submitted = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    _supportingInfoController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final requests = await ref.read(accountTypeRequestRepositoryProvider).getMine();
      if (mounted) setState(() => _requests = requests);
    } on ApiException catch (_) {
      // Best-effort — an empty list still renders a working submit form.
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  AccountTypeChangeRequest? get _openRequest {
    for (final r in _requests) {
      if (r.status == 'PENDING' || r.status == 'MORE_INFORMATION_REQUIRED') return r;
    }
    return null;
  }

  Future<void> _submit(String currentType, String otherType) async {
    if (_reasonController.text.trim().isEmpty) {
      setState(() => _error = 'Please enter a reason.');
      return;
    }
    setState(() {
      _error = null;
      _submitting = true;
    });
    try {
      await ref.read(accountTypeRequestRepositoryProvider).submit(
            requestedType: otherType,
            reason: _reasonController.text.trim(),
            supportingInfo: _supportingInfoController.text.trim(),
          );
      _reasonController.clear();
      _supportingInfoController.clear();
      setState(() => _submitted = true);
      await _load();
    } on ApiException catch (e) {
      setState(() {
        _error = e.errorCode == 'ALREADY_OPEN'
            ? 'You already have a pending request — please wait for it to be reviewed.'
            : e.message;
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authControllerProvider).user;
    final currentType = user?.accountType ?? 'RIDER';
    final otherType = currentType == 'SERVICE_PROVIDER' ? 'RIDER' : 'SERVICE_PROVIDER';

    return Scaffold(
      appBar: AppBar(title: const Text('Account Type Request')),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Your BIKIE account is currently a '
                      '${currentType == 'SERVICE_PROVIDER' ? 'Service Provider' : 'Rider'} account. '
                      'Picked the wrong one at signup? Submit a request below and our team will '
                      'review it — account type is never changed automatically.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 20),
                    if (_openRequest != null)
                      _buildOpenRequestCard(context, _openRequest!)
                    else if (_submitted)
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(20)),
                        child: const Text('Your request has been submitted. We\'ll notify you once it\'s been reviewed.'),
                      )
                    else
                      _buildForm(context, currentType, otherType),
                    if (_requests.where((r) => r.id != _openRequest?.id).isNotEmpty) ...[
                      const SizedBox(height: 24),
                      Text('Previous requests', style: Theme.of(context).textTheme.labelMedium),
                      const SizedBox(height: 8),
                      ..._requests.where((r) => r.id != _openRequest?.id).map((r) => _buildHistoryTile(context, r)),
                    ],
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildOpenRequestCard(BuildContext context, AccountTypeChangeRequest r) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(20)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Your request is being reviewed', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text('${r.currentType} → ${r.requestedType}', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 4),
          Text(r.reason, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 8),
          Chip(label: Text(_statusLabel[r.status] ?? r.status)),
        ],
      ),
    );
  }

  Widget _buildForm(BuildContext context, String currentType, String otherType) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(20)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Requested account type', style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: 6),
          Text(otherType == 'SERVICE_PROVIDER' ? 'Service Provider' : 'Rider', style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: 16),
          TextField(
            controller: _reasonController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Reason',
              hintText: 'e.g. I am a bike mechanic and accidentally registered as Rider.',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _supportingInfoController,
            maxLines: 2,
            decoration: const InputDecoration(
              labelText: 'Supporting information (optional)',
              hintText: 'Any additional context or links to documents',
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _submitting ? null : () => _submit(currentType, otherType),
            child: Text(_submitting ? 'Submitting…' : 'Submit request'),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryTile(BuildContext context, AccountTypeChangeRequest r) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(border: Border.all(color: Theme.of(context).dividerColor), borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${r.currentType} → ${r.requestedType} — ${_statusLabel[r.status] ?? r.status}',
              style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 4),
          Text(r.reason, style: Theme.of(context).textTheme.bodySmall),
          if (r.adminRemarks != null) ...[
            const SizedBox(height: 4),
            Text('Admin: ${r.adminRemarks}', style: Theme.of(context).textTheme.bodySmall),
          ],
        ],
      ),
    );
  }
}
