"use client";

import { useState } from "react";

export function SMSComposer() {
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    const res = await fetch("/api/admin/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, message }),
    });
    if (res.ok) setSent(true);
    setSending(false);
  }

  if (sent) return <p className="mt-6 text-green-400">SMS sent successfully!</p>;

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl bg-white/5 p-4 backdrop-blur">
      <input value={to} onChange={(e) => setTo(e.target.value)} type="tel" placeholder="Recipient phone (e.g., +1234567890)" required className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30" />
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" required rows={4} className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30" />
      <button type="submit" disabled={sending} className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black transition hover:bg-gold/90">
        {sending ? "Sending…" : "Send SMS"}
      </button>
    </form>
  );
}