import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../bikes/domain/bike_providers.dart';
import '../../bikes/presentation/widgets/bike_card.dart';
import '../../destinations/domain/destination_providers.dart';
import '../../nearby_riders/data/nearby_riders_repository.dart';
import '../../nearby_riders/domain/nearby_riders_providers.dart';
import '../../onboarding/domain/rider_profile_providers.dart';
import '../../sos/presentation/send_sos_sheet.dart';
import '../domain/home_providers.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final featuredBikes = ref.watch(featuredBikesProvider);
    final destinations = ref.watch(popularDestinationsProvider);
    final testimonials = ref.watch(testimonialsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('BIKIE', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1)),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(featuredBikesProvider);
          ref.invalidate(popularDestinationsProvider);
          ref.invalidate(testimonialsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          children: [
            // SOS leads Home — the safety network is the first thing a rider sees, ahead of
            // browsing bikes/destinations (kept below, unchanged, per product decision: the
            // marketplace stays, SOS just leads).
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _SosPanicCards(onOpen: () => showSendSosSheet(context)),
            ),
            const _LocationSharingBanner(),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text('Rent the ride, own the road', style: Theme.of(context).textTheme.headlineSmall),
            ),
            const SizedBox(height: 4),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'Airbnb for motorcycles — find your next ride anywhere in India.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
            const _ProfileCompletionBanner(),
            const SizedBox(height: 20),
            _SectionHeader(title: 'Featured bikes', onSeeAll: () => context.go('/bikes')),
            SizedBox(
              height: 260,
              child: featuredBikes.when(
                data: (bikes) => ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: bikes.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) => SizedBox(width: 170, child: BikeCard(bike: bikes[index])),
                ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => const Center(child: Text('Could not load bikes')),
              ),
            ),
            const SizedBox(height: 20),
            _SectionHeader(title: 'Popular destinations', onSeeAll: () => context.push('/destinations')),
            SizedBox(
              height: 140,
              child: destinations.when(
                data: (list) => ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final d = list[index];
                    return GestureDetector(
                      onTap: () => context.push('/destinations/${d.slug}'),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Stack(
                          children: [
                            SizedBox(
                              width: 160,
                              height: 140,
                              child: Image.network(d.imageUrl, fit: BoxFit.cover),
                            ),
                            Positioned(
                              left: 8,
                              bottom: 8,
                              child: Text(
                                d.name,
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => const Center(child: Text('Could not load destinations')),
              ),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text('What riders say', style: Theme.of(context).textTheme.titleMedium),
            ),
            const SizedBox(height: 12),
            testimonials.when(
              data: (list) => Column(
                children: list
                    .take(3)
                    .map(
                      (t) => Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('"${t.quote}"', style: Theme.of(context).textTheme.bodyMedium),
                                const SizedBox(height: 8),
                                Text(t.authorName, style: Theme.of(context).textTheme.titleSmall),
                              ],
                            ),
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

/// Red/Amber alert cards leading Home — mirrors web's `PanicAlertCards.tsx` (same two exact
/// brand hexes, same category groupings as `send_sos_sheet.dart`'s picker), but as a lighter
/// read-only preview: tapping either card opens the real `SendSosSheet` (reused as-is, not
/// duplicated) rather than re-implementing category selection here.
const _sosRed = Color(0xFFE8000D);
const _sosAmber = Color(0xFFFFAA00);
const _redCategoryPreview = ['🚨 Accident', '🏥 Medical', '🔥 Life Threatening'];
const _amberCategoryPreview = ['🔧 Breakdown', '🔩 Flat Tyre', '⛽ Fuel', '🔋 Battery'];

class _SosPanicCards extends StatelessWidget {
  const _SosPanicCards({required this.onOpen});

  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _SosAlertCard(
          color: _sosRed,
          icon: Icons.sos,
          title: 'Red Alert — Emergency',
          tagline: 'Accident or life-threatening. Instantly alerts fellow riders with your GPS.',
          categories: _redCategoryPreview,
          onTap: onOpen,
        ),
        const SizedBox(height: 12),
        _SosAlertCard(
          color: _sosAmber,
          icon: Icons.warning_amber_rounded,
          title: 'Amber Alert — Assistance',
          tagline: 'Non-emergency. Nearby riders and service providers get notified.',
          categories: _amberCategoryPreview,
          onTap: onOpen,
        ),
      ],
    );
  }
}

class _SosAlertCard extends StatelessWidget {
  const _SosAlertCard({
    required this.color,
    required this.icon,
    required this.title,
    required this.tagline,
    required this.categories,
    required this.onTap,
  });

  final Color color;
  final IconData icon;
  final String title;
  final String tagline;
  final List<String> categories;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withValues(alpha: 0.35))),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    height: 48,
                    width: 48,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                    child: Icon(icon, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: Theme.of(context).textTheme.titleSmall?.copyWith(color: color, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Text(tagline, style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right, color: color),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: categories
                    .map((c) => Chip(
                          label: Text(c, style: const TextStyle(fontSize: 11)),
                          backgroundColor: color.withValues(alpha: 0.12),
                          side: BorderSide(color: color.withValues(alpha: 0.3)),
                          visualDensity: VisualDensity.compact,
                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ))
                    .toList(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Surfaces `rider_location.sharingEnabled` directly on Home, reframed around what it actually
/// buys the rider — being findable when someone nearby sends an SOS, and having nearby riders
/// findable when *they* need help — rather than the generic "share your location to browse
/// nearby riders" framing this same toggle used to have (buried on the Nearby Riders screen).
/// Someone who doesn't care about browsing nearby riders would reasonably skip that toggle
/// without realizing it's the same switch SOS's nearby-rider dispatch tier depends on.
/// Enabling here pushes an immediate location fix too, same as the Nearby Riders screen's own
/// toggle, so this banner is fully self-sufficient — no detour required. Dismissal is local
/// widget state only (mirrors `_ProfileCompletionBanner` below), so it naturally reappears next
/// time Home is rebuilt rather than being silenced forever after one "Not now."
class _LocationSharingBanner extends ConsumerStatefulWidget {
  const _LocationSharingBanner();

  @override
  ConsumerState<_LocationSharingBanner> createState() => _LocationSharingBannerState();
}

class _LocationSharingBannerState extends ConsumerState<_LocationSharingBanner> {
  bool _dismissed = false;
  bool _busy = false;

  Future<void> _toggle(bool value) async {
    setState(() => _busy = true);
    try {
      await ref.read(nearbyRidersRepositoryProvider).setSharingEnabled(value);
      if (value) await _pushLocation();
      ref.invalidate(sharingEnabledProvider);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _pushLocation() async {
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location permission is required to turn this on.')),
          );
        }
        return;
      }
      final position = await Geolocator.getCurrentPosition();
      await ref.read(nearbyRidersRepositoryProvider).updateLocation(position.latitude, position.longitude);
    } catch (_) {
      // Sharing is still enabled either way — a fresher fix can land next time it's refreshed;
      // not worth blocking the toggle itself over one failed GPS read.
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_dismissed) return const SizedBox.shrink();

    final sharingAsync = ref.watch(sharingEnabledProvider);
    final enabled = sharingAsync.valueOrNull ?? false;
    if (enabled) return const SizedBox.shrink();

    final accent = Theme.of(context).colorScheme.primary;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: accent.withValues(alpha: 0.08),
          border: Border.all(color: accent.withValues(alpha: 0.25)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.location_on_outlined, color: accent, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Be findable in an emergency',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
                if (_busy)
                  const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                else
                  Switch(value: enabled, onChanged: _toggle),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              "Off right now — nearby riders won't be alerted if you send an SOS, and you won't "
              "be alerted if someone near you does. It never tracks you in the background; your "
              "location only updates when you turn this on or refresh it yourself.",
              style: Theme.of(context).textTheme.bodySmall,
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => setState(() => _dismissed = true),
                child: const Text('Not now'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Reminds a rider who skipped `/onboarding` (and never substantively filled the profile in
/// since) that it's still worth completing — mirrors web's `ProfileCompletionBanner`. Dismissal
/// is local widget state only, not persisted, so it naturally reappears next time Home is
/// rebuilt (a fresh navigation, not just a scroll) rather than needing a scheduled reminder.
class _ProfileCompletionBanner extends ConsumerStatefulWidget {
  const _ProfileCompletionBanner();

  @override
  ConsumerState<_ProfileCompletionBanner> createState() => _ProfileCompletionBannerState();
}

class _ProfileCompletionBannerState extends ConsumerState<_ProfileCompletionBanner> {
  bool _dismissed = false;

  @override
  Widget build(BuildContext context) {
    if (_dismissed) return const SizedBox.shrink();

    final shouldShow = ref.watch(profileCompletionReminderProvider).valueOrNull ?? false;
    if (!shouldShow) return const SizedBox.shrink();

    final accent = Theme.of(context).colorScheme.primary;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: accent.withValues(alpha: 0.08),
          border: Border.all(color: accent.withValues(alpha: 0.25)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                'Finish setting up your rider profile — it makes your SOS alerts far more useful.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
            const SizedBox(width: 8),
            TextButton(
              onPressed: () => context.push('/onboarding'),
              child: const Text('Complete'),
            ),
            IconButton(
              onPressed: () => setState(() => _dismissed = true),
              icon: const Icon(Icons.close, size: 18),
              tooltip: 'Dismiss',
              visualDensity: VisualDensity.compact,
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.onSeeAll});

  final String title;
  final VoidCallback onSeeAll;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const Spacer(),
          TextButton(onPressed: onSeeAll, child: const Text('See all')),
        ],
      ),
    );
  }
}
