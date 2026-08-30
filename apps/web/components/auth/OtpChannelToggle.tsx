"use client";

import type { OtpChannel } from "@/lib/use-msg91-widget";

interface Props {
  value: OtpChannel;
  onChange: (channel: OtpChannel) => void;
  disabled?: boolean;
}

/**
 * ADR-071 — WhatsApp is out of scope for the current phase. Flip this back to `true` to
 * restore the WhatsApp OTP delivery option (the `retryOtp`/`OtpChannel` plumbing in
 * `use-msg91-widget.ts` and `Msg91OtpRepository` is left intact and dormant). While `false`,
 * SMS is the only channel and this control renders nothing (there is no choice to make).
 */
const WHATSAPP_OTP_ENABLED = false;

const OPTIONS: { value: OtpChannel; label: string }[] = [
  { value: "sms", label: "📱 SMS" },
  ...(WHATSAPP_OTP_ENABLED
    ? ([{ value: "whatsapp", label: "🟢 WhatsApp" }] as { value: OtpChannel; label: string }[])
    : []),
];

/** ADR-057 — lets the user pick which channel their OTP arrives on, shared by `/login` and
 * `/signup`. Only meaningful before the code is sent — callers should keep rendering this
 * through the "otp" step too, since `retryOtp` (Resend) still reads it and can switch channel
 * on a resend even if the first send already went out on the other one. */
export function OtpChannelToggle({ value, onChange, disabled }: Props) {
  if (OPTIONS.length < 2) return null;
  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label="OTP delivery method">
      <span className="text-xs font-medium text-foreground/50">Send code via</span>
      <div className="flex gap-1 rounded-lg border border-foreground/15 p-0.5">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
              value === option.value
                ? "bg-accent text-white"
                : "text-foreground/60 hover:bg-foreground/5"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
