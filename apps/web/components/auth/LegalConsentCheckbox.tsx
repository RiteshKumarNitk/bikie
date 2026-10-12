"use client";

import Link from "next/link";
import type { CurrentLegalDocumentsResponse } from "@bikie/types";

export const LEGAL_CONSENT_REQUIRED_MESSAGE =
  "Please accept the Terms & Conditions, Privacy Policy and Legal Terms to continue.";

/** ADR-090 — the headers the server's `user.create` hook requires on the account-creating
 * request: exactly the version ids the user was shown, plus the account type they signed up as. */
export function legalConsentHeaders(versionIds: string[], accountType: string): Record<string, string> {
  return {
    "x-legal-consent-versions": versionIds.join(","),
    "x-legal-consent-account-type": accountType,
  };
}

const LINKS: { key: "terms" | "privacy" | "userAgreement"; href: string; fallback: string }[] = [
  { key: "terms", href: "/terms-and-conditions", fallback: "Terms & Conditions" },
  { key: "privacy", href: "/privacy-policy", fallback: "Privacy Policy" },
  { key: "userAgreement", href: "/user-agreement", fallback: "Legal Terms" },
];

/** Never pre-checked — the caller owns `checked`, which must start `false`. Each document name
 * opens its current published version in a new tab. */
export function LegalConsentCheckbox({
  legal,
  checked,
  onChange,
  disabled,
}: {
  legal: CurrentLegalDocumentsResponse | null;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const links = LINKS.filter((l) => !legal || legal[l.key]);
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-foreground/70">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
      />
      <span>
        I have read and agree to the{" "}
        {links.map((link, i) => (
          <span key={link.key}>
            {i > 0 && (i === links.length - 1 ? " and " : ", ")}
            <Link
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent-text underline-offset-2 hover:underline"
            >
              {legal?.[link.key]?.title ?? link.fallback}
            </Link>
          </span>
        ))}
        .
      </span>
    </label>
  );
}
