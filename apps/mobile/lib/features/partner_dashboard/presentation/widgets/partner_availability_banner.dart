import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/network/api_exception.dart';
import '../../../partner_membership/domain/partner_membership_providers.dart';
import '../../data/partner_dashboard_repository.dart';
import '../../domain/partner_dashboard_providers.dart';

/// The "🟢 AVAILABLE / ⚫ OFFLINE" toggle (ADR-044) — deliberately persistent across every
/// partner screen (rendered once, in `AppShell`), not confined to Home, since offline is exactly
/// the state where a partner most needs a constant reminder they won't be paged for anything.
///
/// ADR-056 — `PATCH /api/partner/availability` was already server-side membership-gated
/// (`requirePartnerCapability`); a non-member tapping the switch previously just got a snackbar
/// error after the fact. Pre-emptively disabling it via `activePartnerMembershipProvider` (mirrors
/// web's `PartnerAvailabilityToggle.tsx`) makes the restriction visible instead of discoverable
/// only by trying — the server-side gate remains the actual enforcement either way.
class PartnerAvailabilityBanner extends ConsumerStatefulWidget {
  const PartnerAvailabilityBanner({super.key});

  @override
  ConsumerState<PartnerAvailabilityBanner> createState() => _PartnerAvailabilityBannerState();
}

class _PartnerAvailabilityBannerState extends ConsumerState<PartnerAvailabilityBanner> {
  bool _busy = false;

  Future<void> _toggle(bool value) async {
    setState(() => _busy = true);
    try {
      await ref.read(partnerDashboardRepositoryProvider).setAvailability(value);
      ref.invalidate(partnerAvailabilityProvider);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final membershipAsync = ref.watch(activePartnerMembershipProvider);
    // Fail open while loading/on error rather than flashing a locked state that then flips —
    // the PATCH itself still enforces membership server-side regardless of what this shows.
    final membershipActive = membershipAsync.maybeWhen(data: (m) => m != null, orElse: () => true);

    if (!membershipActive) {
      return Material(
        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05),
        child: InkWell(
          onTap: () => context.push('/partner-membership'),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                const Text('🔒', style: TextStyle(fontSize: 14)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'UNAVAILABLE',
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        'Activate ₹99/month membership to go available',
                        style: Theme.of(context).textTheme.labelSmall,
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, size: 18),
              ],
            ),
          ),
        ),
      );
    }

    final availableAsync = ref.watch(partnerAvailabilityProvider);
    final available = availableAsync.valueOrNull ?? false;
    final color = available ? const Color(0xFF22C55E) : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5);

    return Material(
      color: color.withValues(alpha: 0.1),
      child: InkWell(
        onTap: (_busy || availableAsync.isLoading) ? null : () => _toggle(!available),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      available ? 'AVAILABLE' : 'OFFLINE',
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.bold, color: color),
                    ),
                    Text(
                      available ? 'Receiving nearby assistance requests' : "You won't receive SOS requests",
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                  ],
                ),
              ),
              if (_busy || availableAsync.isLoading)
                const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
              else
                Switch(value: available, onChanged: _toggle),
            ],
          ),
        ),
      ),
    );
  }
}
