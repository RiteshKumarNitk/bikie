const COUNTRY_CODES = [
  { code: "+91", label: "India", flag: "🇮🇳" },
  { code: "+1", label: "USA", flag: "🇺🇸" },
];

export const DEFAULT_COUNTRY_CODE = "+91";

/** Composes a country code + 10-digit local number into the E.164 string the OTP endpoints
 * expect, or null if the local number isn't exactly 10 digits. */
export function composePhoneNumber(countryCode: string, localNumber: string): string | null {
  const digits = localNumber.replace(/\D/g, "");
  if (digits.length !== 10) return null;
  return `${countryCode}${digits}`;
}

interface PhoneNumberInputProps {
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  localNumber: string;
  onLocalNumberChange: (digits: string) => void;
  id?: string;
  disabled?: boolean;
}

export function PhoneNumberInput({
  countryCode,
  onCountryCodeChange,
  localNumber,
  onLocalNumberChange,
  id = "phoneNumber",
  disabled,
}: PhoneNumberInputProps) {
  return (
    <div className="flex gap-2">
      <select
        aria-label="Country code"
        value={countryCode}
        onChange={(e) => onCountryCodeChange(e.target.value)}
        disabled={disabled}
        className="w-[6.5rem] shrink-0 rounded-xl border border-foreground/15 bg-transparent px-2 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code} className="bg-card">
            {c.flag} {c.code}
          </option>
        ))}
      </select>
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
