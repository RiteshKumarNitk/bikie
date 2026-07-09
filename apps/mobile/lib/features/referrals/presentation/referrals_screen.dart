import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/async_value_view.dart';
import '../data/referral_repository.dart';
import '../domain/referral_providers.dart';

class ReferralsScreen extends ConsumerStatefulWidget {
  const ReferralsScreen({super.key});

  @override
  ConsumerState<ReferralsScreen> createState() => _ReferralsScreenState();
}

class _ReferralsScreenState extends ConsumerState<ReferralsScreen> {
  final _codeController = TextEditingController();
  bool _isLinking = false;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _linkCode() async {
    final code = _codeController.text.trim();
    if (code.isEmpty) return;
    setState(() => _isLinking = true);
    try {
      await ref.read(referralRepositoryProvider).link(code);
      _codeController.clear();
      ref.invalidate(myReferralInfoProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Referral linked!')));
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _isLinking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final info = ref.watch(myReferralInfoProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Referrals')),
      body: AsyncValueView(
        value: info,
        onRetry: () => ref.invalidate(myReferralInfoProvider),
        data: (data) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(myReferralInfoProvider),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('Your referral code', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          data.code,
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.copy),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: data.code));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Copied to clipboard')),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text('Have a code?', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _codeController,
                      decoration: const InputDecoration(labelText: 'Enter referral code'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _isLinking ? null : _linkCode,
                    child: const Text('Link'),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text('People you referred', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              if (data.referrals.isEmpty)
                const Text('No referrals yet — share your code!')
              else
                ...data.referrals.map(
                  (r) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const CircleAvatar(child: Icon(Icons.person)),
                    title: Text(r.name),
                    subtitle: Text(r.email),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
