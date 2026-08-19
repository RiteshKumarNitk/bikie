import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';

import '../../data/msg91_otp_repository.dart';

/// ADR-057 — mirrors `apps/web/components/auth/OtpChannelToggle.tsx`. WhatsApp is disabled in
/// debug builds: debug mode uses the backend-proxied native-API OTP path (preserved for the
/// dev-bypass/test-number mechanisms — see `Msg91OtpRepository`'s doc comment), which only
/// supports SMS, not the MSG91 Widget SDK's channels.
class OtpChannelToggle extends StatelessWidget {
  const OtpChannelToggle({super.key, required this.value, required this.onChanged, this.enabled = true});

  final OtpChannel value;
  final ValueChanged<OtpChannel> onChanged;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final whatsappAvailable = !kDebugMode;
    return Row(
      children: [
        Text('Send code via', style: Theme.of(context).textTheme.labelSmall),
        const SizedBox(width: 8),
        _ChannelChip(
          label: '📱 SMS',
          selected: value == OtpChannel.sms,
          enabled: enabled,
          onTap: () => onChanged(OtpChannel.sms),
        ),
        const SizedBox(width: 6),
        Tooltip(
          message: whatsappAvailable ? '' : 'WhatsApp OTP requires a release build',
          child: _ChannelChip(
            label: '🟢 WhatsApp',
            selected: value == OtpChannel.whatsapp,
            enabled: enabled && whatsappAvailable,
            onTap: () => onChanged(OtpChannel.whatsapp),
          ),
        ),
      ],
    );
  }
}

class _ChannelChip extends StatelessWidget {
  const _ChannelChip({required this.label, required this.selected, required this.enabled, required this.onTap});

  final String label;
  final bool selected;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme;
    return Opacity(
      opacity: enabled ? 1 : 0.4,
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: selected ? color.primary : Colors.transparent,
            border: Border.all(color: color.outlineVariant),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: selected ? color.onPrimary : color.onSurfaceVariant,
            ),
          ),
        ),
      ),
    );
  }
}
