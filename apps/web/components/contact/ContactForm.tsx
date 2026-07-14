"use client";

import { useState } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-3xl bg-card p-8 text-center">
        <p className="text-lg font-semibold">Thanks for reaching out</p>
        <p className="mt-2 text-sm text-foreground/60">Our team will get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="space-y-4 rounded-3xl bg-card p-8"
    >
      <div>
        <label htmlFor="contact-name" className="text-sm font-medium">Name</label>
        <input id="contact-name" name="name" required className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent" />
      </div>
      <div>
        <label htmlFor="contact-email" className="text-sm font-medium">Email</label>
        <input id="contact-email" name="email" type="email" required className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent" />
      </div>
      <div>
        <label htmlFor="contact-message" className="text-sm font-medium">Message</label>
        <textarea id="contact-message" name="message" required rows={5} className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent" />
      </div>
      <button type="submit" className="w-full rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90">
        Send Message
      </button>
    </form>
  );
}
