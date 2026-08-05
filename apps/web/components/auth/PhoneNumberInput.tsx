export const DEFAULT_COUNTRY_CODE = "+91";

/** Composes the +91 country code and a 10-digit local number into the E.164 string the OTP
 * endpoints expect, or null if the local number isn't exactly 10 digits. India-only — OTP
 * send validates against isValidIndianMobile server-side (ADR-032). */
export function composePhoneNumber(localNumber: string): string | null {
  const digits = localNumber.replace(/\D/g, "");
  if (digits.length !== 10) return null;
  return `${DEFAULT_COUNTRY_CODE}${digits}`;
}

interface PhoneNumberInputProps {
  localNumber: string;
  onLocalNumberChange: (digits: string) => void;
  id?: string;
  disabled?: boolean;
}

export function PhoneNumberInput({
  localNumber,
  onLocalNumberChange,
  id = "phoneNumber",
  disabled,
}: PhoneNumberInputProps) {
  return (
    <div className="flex gap-2">
      <span className="flex w-[4.5rem] shrink-0 items-center justify-center gap-1 rounded-xl border border-foreground/15 bg-foreground/[0.02] px-2 py-2.5 text-sm text-foreground/70">
        🇮🇳 +91
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={localNumber}
        onChange={(e) => onLocalNumberChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
        disabled={disabled}
        placeholder="98765 43210"
        className="flex-1 rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
      />
    </div>
  );
}
