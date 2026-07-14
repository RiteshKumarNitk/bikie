"use client";

import { useState } from "react";

export function CopyRideLinkButton({ tripSlug }: { tripSlug: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/trips/${tripSlug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API can be unavailable (e.g. insecure context) — fall back silently,
      // the URL is still visible/selectable via the input beside this button.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      className="bg-foreground text-background px-4 py-2 rounded-xl text-sm font-semibold hover:bg-foreground/90 transition-colors whitespace-nowrap"
    >
      {copied ? "Copied!" : "Copy Ride Link"}
    </button>
  );
}
