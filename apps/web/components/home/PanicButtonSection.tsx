"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Reveal } from "@/components/shared/Reveal";

type SOSType = "ACCIDENT" | "BIKE_BREAKDOWN" | "FUEL_EMPTY" | "MEDICAL" | "LOST" | "OTHER";
type AlertKind = "RED" | "AMBER";

interface Category {
  label: string;
  type: SOSType;
}

// The backend's SOSAlertType enum has no dedicated "puncture" or "fire/hazard" value —
// Puncture maps onto BIKE_BREAKDOWN and Fire/Hazard onto OTHER, with the specific label
// preserved in the alert's free-text description so responders still see exactly what was
// picked even though the stored `type` collapses two labels together.
const RED_CATEGORIES: Category[] = [
  { label: "Accident", type: "ACCIDENT" },
  { label: "Medical Emergency", type: "MEDICAL" },
  { label: "Fire / Hazard", type: "OTHER" },
];
const AMBER_CATEGORIES: Category[] = [
  { label: "Breakdown", type: "BIKE_BREAKDOWN" },
  { label: "Puncture", type: "BIKE_BREAKDOWN" },
  { label: "Empty Fuel", type: "FUEL_EMPTY" },
  { label: "Medical Help", type: "MEDICAL" },
];

const THEME = {
  RED: {
    label: "Red Alert — Emergency",
    icon: "🆘",
    tagline: "Accident or life-threatening situation. Immediately alerts fellow riders with your GPS.",
    categories: RED_CATEGORIES,
    channels: ["SMS", "WhatsApp", "Fellow Riders"],
    secondaryChannel: "Emergency Services",
    footer: "Live GPS shared instantly",
    cta: "Send Red Alert",
    border: "border-red-500/30",
    ring: "ring-red-500",
    iconBg: "bg-red-500/15 text-red-400",
    chipActive: "border-red-500 bg-red-500/10 text-red-400",
    button: "bg-red-500 hover:bg-red-600",
    titleColor: "text-red-400",
    dot: "bg-red-500",
  },
  AMBER: {
    label: "Amber Alert — Assistance",
    icon: "⚠️",
    tagline: "Non-emergency. Select your issue and BIKIE connects nearby support.",
    categories: AMBER_CATEGORIES,
    channels: ["SMS", "WhatsApp", "Service Provider"],
    secondaryChannel: "Fellow Riders",
    footer: "GPS shared so help finds you faster",
    cta: "Report an Issue",
    border: "border-warning/30",
    ring: "ring-warning",
    iconBg: "bg-warning/15 text-warning",
    chipActive: "border-warning bg-warning/10 text-warning",
    button: "bg-warning hover:bg-warning/90",
    titleColor: "text-warning",
    dot: "bg-warning",
  },
} as const;

function ChannelPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/60">
      {children}
    </span>
  );
}

function AlertCard({
  kind,
  active,
  selectedCategory,
  onSelectCategory,
  onOpen,
}: {
  kind: AlertKind;
  active: boolean;
  selectedCategory: Category | null;
  onSelectCategory: (kind: AlertKind, category: Category) => void;
  onOpen: (kind: AlertKind) => void;
}) {
  const theme = THEME[kind];
  return (
    <div
      className={`glass rounded-3xl border p-6 transition-all md:p-8 ${
        active ? `${theme.border} ring-1 ${theme.ring}` : "border-foreground/10"
      }`}
    >
      <span className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${theme.iconBg}`}>
        {theme.icon}
      </span>
      <h3 className={`mt-5 font-display text-xl font-bold ${theme.titleColor}`}>{theme.label}</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/70">{theme.tagline}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {theme.categories.map((category) => (
          <button
            key={category.label}
            type="button"
            onClick={() => onSelectCategory(kind, category)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              active && selectedCategory?.label === category.label
                ? theme.chipActive
                : "border-foreground/15 text-foreground/60 hover:border-foreground/30"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {theme.channels.map((c) => (
          <ChannelPill key={c}>{c}</ChannelPill>
        ))}
      </div>
      <div className="mt-2">
        <ChannelPill>{theme.secondaryChannel}</ChannelPill>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-xs text-foreground/50">
          <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
          {theme.footer}
        </span>
        <button
          type="button"
          onClick={() => onOpen(kind)}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors ${theme.button}`}
        >
          {theme.cta}
        </button>
      </div>
    </div>
  );
}

export function PanicButtonSection() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const [expandedKind, setExpandedKind] = useState<AlertKind | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [profileWarning, setProfileWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    if (session.user.role === "ADMIN") {
      setIsMember(true);
      return;
    }
    setCheckingMembership(true);
    fetch("/api/membership/active")
      .then((r) => r.json())
      .then((data) => setIsMember(!!data.membership))
      .finally(() => setCheckingMembership(false));
  }, [session]);

  function resetForm() {
    setCategory(null);
    setDescription("");
    setCity("");
    setLocation(null);
    setLocError(null);
    setSendError(null);
    setSent(false);
  }

  function openForm(kind: AlertKind) {
    if (expandedKind === kind) return;
    setExpandedKind(kind);
    resetForm();
  }

  function selectCategory(kind: AlertKind, cat: Category) {
    setExpandedKind(kind);
    setCategory(cat);
    setSent(false);
    setSendError(null);
    setDescription((prev) => (prev.trim() ? prev : cat.label));
  }

  function getLocation() {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocError(null);
      },
      () => setLocError("Could not get your location. Please enter your city manually."),
    );
  }

  async function handleSend() {
    if (!expandedKind) return;
    if (!category) {
      setSendError("Select what's happening first.");
      return;
    }
    if (!location && !city.trim()) {
      setSendError("Share your location or enter your city.");
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/sos/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: category.type,
          description: `${expandedKind === "RED" ? "Red Alert" : "Amber Alert"} — ${description.trim() || category.label}`,
          latitude: location?.lat ?? 0,
          longitude: location?.lng ?? 0,
          city: city.trim() || "Unknown",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSent(true);
        if (data.profileWarning) setProfileWarning(data.profileWarning);
        return;
      }
      const data = await res.json().catch(() => null);
      if (res.status === 403 && data?.error === "MEMBERSHIP_REQUIRED") {
        setIsMember(false);
        return;
      }
      setSendError(data?.message ?? data?.error ?? "Could not send the alert. Please try again.");
    } catch {
      setSendError("Could not send the alert. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const theme = expandedKind ? THEME[expandedKind] : null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">— Rider Safety</p>
        <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
          Panic Button — We&apos;ve got your back
        </h2>
        <p className="mt-2 max-w-2xl text-foreground/60">
          One tap connects you to fellow riders and nearby support. Your live GPS location is shared
          instantly the moment you send an alert.
        </p>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Reveal>
          <AlertCard
            kind="RED"
            active={expandedKind === "RED"}
            selectedCategory={category}
            onSelectCategory={selectCategory}
            onOpen={openForm}
          />
        </Reveal>
        <Reveal delay={0.05}>
          <AlertCard
            kind="AMBER"
            active={expandedKind === "AMBER"}
            selectedCategory={category}
            onSelectCategory={selectCategory}
            onOpen={openForm}
          />
        </Reveal>
      </div>

      {expandedKind && theme && (
        <div className={`mt-6 rounded-3xl border ${theme.border} bg-card p-6 md:p-8`}>
          {!sessionPending && !session ? (
            <div className="text-center">
              <p className="font-semibold">Log in to send an SOS alert</p>
              <p className="mt-1 text-sm text-foreground/60">
                The Panic Button is available to signed-in BIKIE members so alerts can reach real
                riders and stay trustworthy.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-flex rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Log in
              </Link>
            </div>
          ) : checkingMembership ? (
            <div className="h-24 animate-pulse rounded-2xl bg-foreground/5" />
          ) : !isMember ? (
            <div className="text-center">
              <p className="font-semibold">SOS Emergency is a BIKIE Membership perk</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-foreground/60">
                Sending and responding to SOS alerts is available to active members only — this
                keeps the safety network trustworthy and limited to verified riders.
              </p>
              <Link
                href="/membership"
                className="mt-4 inline-flex rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                View Membership Plans
              </Link>
            </div>
          ) : sent ? (
            <div className="text-center">
              <p className={`font-semibold ${theme.titleColor}`}>🆘 Alert sent — nearby riders and admins have been notified.</p>
              {profileWarning && (
                <p className="mx-auto mt-2 max-w-md rounded-lg bg-warning/10 p-3 text-sm text-warning">
                  ⚠️ {profileWarning}
                </p>
              )}
              <div className="mt-4 flex justify-center gap-3">
                <Link
                  href="/dashboard/sos"
                  className="rounded-full border border-foreground/15 px-5 py-2 text-sm font-medium hover:bg-foreground/5"
                >
                  View Emergency Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => setExpandedKind(null)}
                  className="rounded-full px-5 py-2 text-sm font-medium text-foreground/60 hover:text-foreground"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold uppercase tracking-wide ${theme.titleColor}`}>
                  {theme.label}
                </p>
                <button
                  type="button"
                  onClick={() => setExpandedKind(null)}
                  className="text-xs font-medium text-foreground/50 hover:text-foreground"
                >
                  Cancel
                </button>
              </div>

              <p className="mt-3 text-sm font-medium">
                {category ? `Selected: ${category.label}` : "Pick what's happening above, then share your location."}
              </p>

              <div className="mt-4">
                <label className="text-sm font-medium">Additional details (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Describe your situation..."
                  className="mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Your city</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Goa, Manali"
                    className="mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={getLocation}
                    className="w-full rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5"
                  >
                    {location ? "📍 Location captured" : "Share my location"}
                  </button>
                </div>
              </div>
              {locError && <p className="mt-2 text-xs text-red-400">{locError}</p>}

              {sendError && (
                <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{sendError}</div>
              )}

              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className={`mt-5 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${theme.button}`}
              >
                {sending ? "Sending…" : theme.cta}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
