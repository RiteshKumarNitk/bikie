"use client";

import { useState } from "react";

export function EmailComposer() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    const res = await fetch("/api/admin/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });
    if (res.ok) setSent(true);
    setSending(false);
  }

  if (sent) return <p className="mt-6 text-green-400">Email sent successfully!</p>;

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl bg-white/5 p-4 backdrop-blur">
      <input value={to} onChange={(e) => setTo(e.target.value)} type="email" placeholder="Recipient email" required className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30" />
      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" required className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30" />
      <textarea value={html} onChange={(e) => setHtml(e.target.value)} placeholder="HTML body" required rows={8} className="w-full rounded-lg bg-white/10 px-3 py-2 font-mono text-sm text-white placeholder-white/30" />
      <button type="submit" disabled={sending} className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black transition hover:bg-gold/90">
        {sending ? "Sending…" : "Send Email"}
      </button>
    </form>
  );
}