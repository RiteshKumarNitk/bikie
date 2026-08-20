import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_toast.dart';
import '../data/sos_model.dart';
import '../data/sos_repository.dart';
import '../domain/sos_providers.dart';

/// Mirrors `PanicAlertCards.tsx`'s two alert kinds. Every category maps to its own real
/// `SOSAlertType` (ADR-033) — severity is always server-derived from `type`, never chosen here.
enum _AlertKind { red, amber }

class _Category {
  const _Category(this.label, this.type, this.icon);
  final String label;
  final String type;
  final String icon;
}

const _redCategories = [
  _Category('Accident', 'ACCIDENT', '🚨'),
  _Category('Medical Emergency', 'MEDICAL', '🏥'),
  _Category('Life Threatening', 'LIFE_THREATENING', '🔥'),
];
const _amberCategories = [
  _Category('Bike Breakdown', 'BIKE_BREAKDOWN', '🔧'),
  _Category('Flat Tyre', 'FLAT_TYRE', '🔩'),
  _Category('Fuel Required', 'FUEL_EMPTY', '⛽'),
  _Category('Battery Issue', 'BATTERY_ISSUE', '🔋'),
  _Category('Lost', 'LOST', '🗺️'),
  _Category('Other', 'OTHER', '❗'),
];

// Exact brand hexes for the two alert kinds, matching `PanicAlertCards.tsx` verbatim (RED
// #e8000d, AMBER #ffaa00) — intentionally more saturated than the shared theme's error/warning
// tokens, used only here since this needs to read as urgent at a glance.
const _redColor = Color(0xFFE8000D);
const _amberColor = Color(0xFFFFAA00);

class _KindTheme {
  const _KindTheme({
    required this.label,
    required this.icon,
    required this.tagline,
    required this.categories,
    required this.color,
    required this.confirmTitle,
    required this.confirmBody,
    required this.sendLabel,
  });

  final String label;
  final String icon;
  final String tagline;
  final List<_Category> categories;
  final Color color;
  final String confirmTitle;
  final String confirmBody;
  final String sendLabel;
}

const _themes = {
  _AlertKind.red: _KindTheme(
    label: 'Red Alert — Emergency',
    icon: '🆘',
    tagline: 'Accident or life-threatening situation. Immediately alerts fellow riders with your GPS.',
    categories: _redCategories,
    color: _redColor,
    confirmTitle: 'RED ALERT — Are you sure?',
    confirmBody:
        'This immediately alerts your emergency contacts and nearby BIKIE riders, sharing your live GPS via SMS and WhatsApp.',
    sendLabel: 'Yes, Send Alert Now',
  ),
  _AlertKind.amber: _KindTheme(
    label: 'Amber Alert — Assistance',
    icon: '⚠️',
    tagline: 'Non-emergency. Select your issue and BIKIE connects nearby support.',
    categories: _amberCategories,
    color: _amberColor,
    confirmTitle: 'AMBER ALERT — What do you need?',
    confirmBody: 'Select your situation. BIKIE alerts nearby service providers and riders with your GPS via SMS and WhatsApp.',
    sendLabel: 'Send Amber Alert',
  ),
};

Future<void> showSendSosSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (context) => const SendSosSheet(),
  );
}

/// The Red/Amber panic cards + confirm flow — mirrors the website's `PanicAlertCards.tsx`
/// exactly (same two cards, same silent-GPS-capture confirm modal, same post-send dispatch
/// report) rather than the old flat 9-item dropdown form.
class SendSosSheet extends ConsumerStatefulWidget {
  const SendSosSheet({super.key});

  @override
  ConsumerState<SendSosSheet> createState() => _SendSosSheetState();
}

class _SendSosSheetState extends ConsumerState<SendSosSheet> {
  _AlertKind? _openKind;
  _Category? _category;
  final _cityController = TextEditingController();
  double? _lat;
  double? _lng;
  String? _locError;

  bool _sending = false;
  String? _sendError;
  SOSCreateResult? _result;

  @override
  void dispose() {
    _cityController.dispose();
    super.dispose();
  }

  void _openModal(_AlertKind kind) {
    setState(() {
      _openKind = kind;
      _category = kind == _AlertKind.red ? _redCategories.first : null;
      _cityController.clear();
      _lat = null;
      _lng = null;
      _locError = null;
      _sendError = null;
      _result = null;
    });
    // Captured silently in the background so the confirm step stays a single tap for Red,
    // matching the website — no manual "capture location" button.
    _captureLocation();
  }

  Future<void> _captureLocation() async {
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        if (mounted) setState(() => _locError = "Couldn't get your location — enter your city instead.");
        return;
      }
      final position = await Geolocator.getCurrentPosition();
      if (mounted) {
        setState(() {
          _lat = position.latitude;
          _lng = position.longitude;
          _locError = null;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _locError = "Couldn't get your location — enter your city instead.");
    }
  }

  Future<void> _handleSend() async {
    final kind = _openKind;
    final category = _category;
    if (kind == null || category == null) return;
    if (_lat == null && _cityController.text.trim().isEmpty) {
      setState(() => _sendError = 'Share your location or enter your city.');
      return;
    }
    setState(() {
      _sending = true;
      _sendError = null;
    });
    try {
      final result = await ref.read(sosRepositoryProvider).create(
            type: category.type,
            description: '${kind == _AlertKind.red ? 'Red Alert' : 'Amber Alert'} — ${category.label}',
            latitude: _lat ?? 0,
            longitude: _lng ?? 0,
            city: _cityController.text.trim().isNotEmpty ? _cityController.text.trim() : 'Unknown',
          );
      ref.invalidate(activeSosAlertsProvider);
      if (mounted) {
        setState(() => _result = result);
        showAppToast(context, 'SOS alert sent successfully', variant: AppToastVariant.success);
      }
    } on ApiException catch (e) {
      if (mounted) {
        setState(() => _sendError = e.message);
        showAppToast(context, e.message, variant: AppToastVariant.error);
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final kind = _openKind;
    if (kind == null) return _ChooserView(onOpen: _openModal);

    final theme = _themes[kind]!;
    final result = _result;
    if (result != null) {
      return _SentView(theme: theme, result: result, onClose: () => Navigator.of(context).pop());
    }

    return _ConfirmView(
      theme: theme,
      kind: kind,
      category: _category,
      onCategoryChanged: (c) => setState(() => _category = c),
      cityController: _cityController,
      lat: _lat,
      locError: _locError,
      sending: _sending,
      sendError: _sendError,
      onSend: _handleSend,
      onCancel: () => setState(() => _openKind = null),
    );
  }
}

class _ChooserView extends StatelessWidget {
  const _ChooserView({required this.onOpen});

  final ValueChanged<_AlertKind> onOpen;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(context).viewInsets.bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Send SOS alert', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          _AlertCard(theme: _themes[_AlertKind.red]!, onTap: () => onOpen(_AlertKind.red)),
          const SizedBox(height: 12),
          _AlertCard(theme: _themes[_AlertKind.amber]!, onTap: () => onOpen(_AlertKind.amber)),
        ],
      ),
    );
  }
}

class _AlertCard extends StatelessWidget {
  const _AlertCard({required this.theme, required this.onTap});

  final _KindTheme theme;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: theme.color.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: theme.color.withValues(alpha: 0.35)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: theme.color, shape: BoxShape.circle),
                    child: Text(theme.icon, style: const TextStyle(fontSize: 24)),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          theme.label,
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.bold, color: theme.color),
                        ),
                        const SizedBox(height: 4),
                        Text(theme.tagline, style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: theme.categories
                    .map(
                      (c) => Chip(
                        label: Text('${c.icon} ${c.label}', style: const TextStyle(fontSize: 11)),
                        backgroundColor: theme.color.withValues(alpha: 0.15),
                        padding: EdgeInsets.zero,
                        visualDensity: VisualDensity.compact,
                        side: BorderSide.none,
                      ),
                    )
                    .toList(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ConfirmView extends StatelessWidget {
  const _ConfirmView({
    required this.theme,
    required this.kind,
    required this.category,
    required this.onCategoryChanged,
    required this.cityController,
    required this.lat,
    required this.locError,
    required this.sending,
    required this.sendError,
    required this.onSend,
    required this.onCancel,
  });

  final _KindTheme theme;
  final _AlertKind kind;
  final _Category? category;
  final ValueChanged<_Category> onCategoryChanged;
  final TextEditingController cityController;
  final double? lat;
  final String? locError;
  final bool sending;
  final String? sendError;
  final VoidCallback onSend;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(left: 20, right: 20, top: 24, bottom: MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(theme.icon, style: const TextStyle(fontSize: 40)),
          const SizedBox(height: 12),
          Text(
            theme.confirmTitle,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(color: theme.color, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(theme.confirmBody, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium),
          if (kind == _AlertKind.amber) ...[
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 3.2,
              children: theme.categories.map((c) {
                final selected = category?.label == c.label;
                // `Theme.of(context).dividerColor` is the same literal hex as this sheet's own
                // background in dark mode (`AppColors.darkSecondary` == `darkSurface`), so an
                // unselected border drawn in that color was invisible — the buttons read as plain
                // text. `onSurface` is guaranteed to contrast with the surface it sits on.
                final onSurface = Theme.of(context).colorScheme.onSurface;
                return OutlinedButton(
                  onPressed: () => onCategoryChanged(c),
                  style: OutlinedButton.styleFrom(
                    backgroundColor: selected ? theme.color.withValues(alpha: 0.12) : onSurface.withValues(alpha: 0.05),
                    side: BorderSide(color: selected ? theme.color : onSurface.withValues(alpha: 0.28)),
                    foregroundColor: selected ? theme.color : null,
                  ),
                  child: Text('${c.icon} ${c.label}', style: const TextStyle(fontSize: 12)),
                );
              }).toList(),
            ),
          ],
          const SizedBox(height: 16),
          if (locError != null) ...[
            Align(
              alignment: Alignment.centerLeft,
              child: Text('Your city', style: Theme.of(context).textTheme.labelMedium),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: cityController,
              decoration: const InputDecoration(hintText: 'e.g. Goa, Manali'),
            ),
            const SizedBox(height: 4),
            Text(locError!, style: Theme.of(context).textTheme.labelSmall),
          ] else if (lat == null)
            Text('📍 Getting your location…', style: Theme.of(context).textTheme.labelSmall)
          else
            Text('📍 Location captured', style: Theme.of(context).textTheme.labelSmall),
          if (sendError != null) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                sendError!,
                style: TextStyle(color: Theme.of(context).colorScheme.error, fontSize: 13),
                textAlign: TextAlign.center,
              ),
            ),
          ],
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              FilledButton(
                onPressed: sending || category == null ? null : onSend,
                style: FilledButton.styleFrom(backgroundColor: theme.color),
                child: sending
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(theme.sendLabel),
              ),
              const SizedBox(width: 12),
              TextButton(onPressed: sending ? null : onCancel, child: const Text('Cancel')),
            ],
          ),
        ],
      ),
    );
  }
}

class _SentView extends StatelessWidget {
  const _SentView({required this.theme, required this.result, required this.onClose});

  final _KindTheme theme;
  final SOSCreateResult result;
  final VoidCallback onClose;

  int get _reached {
    final d = result.dispatch;
    if (d == null) return 0;
    return d.nearbyRiders + d.serviceProviders + d.emergencyContacts + d.emergencyServices;
  }

  @override
  Widget build(BuildContext context) {
    final dispatch = result.dispatch;
    final reachedNobody = dispatch == null || _reached == 0;

    return Padding(
      padding: EdgeInsets.only(left: 20, right: 20, top: 24, bottom: MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(dispatch == null ? '❓' : (reachedNobody ? '⚠️' : '✅'), style: const TextStyle(fontSize: 40)),
          const SizedBox(height: 12),
          Text(
            dispatch == null
                ? 'Alert recorded'
                : (reachedNobody ? 'Alert recorded — nobody reached' : 'Alert Sent!'),
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: dispatch == null || reachedNobody ? Theme.of(context).colorScheme.error : AppColors.success,
                ),
          ),
          const SizedBox(height: 8),
          _DispatchReport(dispatch: dispatch, reachedNobody: reachedNobody, reached: _reached),
          if (result.profileWarning != null) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text('⚠️ ${result.profileWarning}', style: const TextStyle(fontSize: 13), textAlign: TextAlign.center),
            ),
          ],
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              FilledButton(
                onPressed: () {
                  onClose();
                  context.push('/sos/${result.alert.id}');
                },
                child: const Text('View Alert'),
              ),
              const SizedBox(width: 12),
              TextButton(onPressed: onClose, child: const Text('Close')),
            ],
          ),
        ],
      ),
    );
  }
}

class _DispatchReport extends StatelessWidget {
  const _DispatchReport({required this.dispatch, required this.reachedNobody, required this.reached});

  final SOSDispatchSummary? dispatch;
  final bool reachedNobody;
  final int reached;

  @override
  Widget build(BuildContext context) {
    if (dispatch == null) {
      return Text(
        'Your alert is recorded and visible to responders in the app, but the notification dispatch failed. '
        'Call local emergency services now.',
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.bodySmall,
      );
    }

    if (reachedNobody) {
      final d = dispatch!;
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Your alert is live in the app, but no one could be notified — no emergency contacts are saved on '
            'your profile, no nearby riders are sharing their location, and no service provider matched your city.'
            '${d.escalatedToAdmins > 0 ? ' It was escalated to ${d.escalatedToAdmins} BIKIE admin${d.escalatedToAdmins > 1 ? 's' : ''}.' : ''}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 8),
          Text(
            "Call local emergency services now — don't wait on the app.",
            style: TextStyle(color: Theme.of(context).colorScheme.error, fontWeight: FontWeight.w600, fontSize: 13),
          ),
        ],
      );
    }

    final d = dispatch!;
    final delivered = [
      if (d.smsAttempted > 0) 'SMS ${d.smsSent}/${d.smsAttempted}',
      if (d.whatsappAttempted > 0) 'WhatsApp ${d.whatsappSent}/${d.whatsappAttempted}',
      if (d.emailAttempted > 0) 'Email ${d.emailSent}/${d.emailAttempted}',
    ];
    final off = [
      if (d.channels?.sms != true) 'SMS',
      if (d.channels?.whatsapp != true) 'WhatsApp',
      if (d.channels?.email != true) 'email',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Your live GPS went out to $reached responder${reached > 1 ? 's' : ''}'
          '${d.nearbyRiders > 0 ? ' · ${d.nearbyRiders} nearby rider(s)' : ''}'
          '${d.serviceProviders > 0 ? ' · ${d.serviceProviders} provider(s)' : ''}'
          '${d.emergencyContacts > 0 ? ' · ${d.emergencyContacts} emergency contact(s)' : ''}.',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        if (delivered.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text('Delivered: ${delivered.join(' · ')}', style: Theme.of(context).textTheme.labelSmall),
        ],
        if (off.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.tertiary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '${off.join(' and ')} ${off.length > 1 ? 'are' : 'is'} not configured on this deployment, '
              'so those messages were not sent.',
              style: const TextStyle(fontSize: 11),
            ),
          ),
        ],
      ],
    );
  }
}
