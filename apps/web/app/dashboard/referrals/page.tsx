"use client";

import { useState, useEffect } from "react";

interface Referral {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function ReferralsPage() {
  const [code, setCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referrals/me")
      .then((r) => r.json())
      .then((data) => {
        setCode(data.code);
        setReferrals(data.referrals ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const link = code && typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${code}` : "";

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Referrals</h1>
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-card" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Referrals</h1>
      <p className="mt-1 text-sm text-foreground/50">Invite friends to BIKIE and keep track of who joined.</p>

      <div className="mt-6 rounded-2xl border border-accent/20 bg-card p-6">
        <p className="text-sm font-medium">Your referral code</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="rounded-xl bg-accent/10 px-4 py-2 font-mono text-lg font-semibold text-accent-text">
            {code}
          </span>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {copied ? "✓ Copied!" : "Copy invite link"}
          </button>
        </div>
        <p className="mt-3 break-all text-xs text-foreground/40">{link}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-foreground/10 bg-card p-6">
        <p className="text-sm font-medium">
          Friends you&apos;ve referred{" "}
          <span className="text-foreground/40">({referrals.length})</span>
        </p>
        {referrals.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/50">
            No referrals yet. Share your link above to invite friends.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-foreground/10">
            {referrals.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-foreground/50">{r.email}</p>
                </div>
                <p className="text-xs text-foreground/40">
                  Joined {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
