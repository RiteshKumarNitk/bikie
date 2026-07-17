"use client";

import { useState } from "react";
import Link from "next/link";

type SOSType = "ACCIDENT" | "BIKE_BREAKDOWN" | "FUEL_EMPTY" | "MEDICAL" | "LOST" | "OTHER";
export type AlertKind = "RED" | "AMBER";

interface Category {
  label: string;
  type: SOSType;
  icon: string;
}

// The backend's SOSAlertType enum has no dedicated "puncture" or "fire/hazard" value —
// Puncture maps onto BIKE_BREAKDOWN and Fire/Hazard onto OTHER, with the specific label
// preserved in the alert's free-text description so responders still see exactly what was
// picked even though the stored `type` collapses two labels together.
const RED_CATEGORIES: Category[] = [
  { label: "Accident", type: "ACCIDENT", icon: "🚨" },
  { label: "Medical Emergency", type: "MEDICAL", icon: "🏥" },
  { label: "Fire / Hazard", type: "OTHER", icon: "🔥" },
];
const AMBER_CATEGORIES: Category[] = [
  { label: "Bike Breakdown", type: "BIKE_BREAKDOWN", icon: "🔧" },
  { label: "Puncture", type: "BIKE_BREAKDOWN", icon: "🔩" },
  { label: "Empty Fuel", type: "FUEL_EMPTY", icon: "⛽" },
  { label: "Medical Assistance", type: "MEDICAL", icon: "🏥" },
];

const THEME = {
  RED: {
    label: "Red Alert — Emergency",
    icon: "🆘",
    tagline: "Accident or life-threatening situation. Immediately alerts fellow riders with your GPS.",
    categories: RED_CATEGORIES,
    channels: ["SMS", "WhatsApp", "Fellow Riders", "Emergency Services"],
    footer: "Live GPS shared instantly",
    cta: "🆘 Send Red Alert",
    border: "border-red-500/30",
    iconBg: "bg-red-500/15 text-red-400",
    button: "bg-red-500 hover:bg-red-600",
    titleColor: "text-red-400",
    dot: "bg-red-500",
    confirmTitle: "RED ALERT — Are you sure?",
    confirmBody:
      "This immediately alerts your emergency contacts and nearby BIKIE riders, sharing your live GPS via SMS and WhatsApp.",
  },
  AMBER: {
    label: "Amber Alert — Assistance",
    icon: "⚠️",
    tagline: "Non-emergency. Select your issue and BIKIE connects nearby support.",
    categories: AMBER_CATEGORIES,
    channels: ["SMS", "WhatsApp", "Service Provider", "Fellow Riders"],
    footer: "GPS shared so help finds you faster",
    cta: "⚠️ Report an Issue",
    border: "border-warning/30",
    iconBg: "bg-warning/15 text-warning",
    button: "bg-warning hover:bg-warning/90",
    titleColor: "text-warning",
    dot: "bg-warning",
    confirmTitle: "AMBER ALERT — What do you need?",
    confirmBody:
      "Select your situation. BIKIE alerts nearby service providers and riders with your GPS via SMS and WhatsApp.",
  },
} as const;

function ChannelPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/60">
      {children}
    </span>
  );
}

function AlertCard({ kind, onOpen }: { kind: AlertKind; onOpen: (kind: AlertKind) => void }) {
  const theme = THEME[kind];
  return (
    <div className={`glass rounded-3xl border p-6 transition-all md:p-8 ${theme.border}`}>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onOpen(kind)}
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl transition-transform hover:scale-105 ${theme.iconBg}`}
          aria-label={theme.cta}
        >
          {theme.icon}
        </button>
        <div>
          <h3 className={`font-display text-xl font-bold ${theme.titleColor}`}>{theme.label}</h3>
          <p className="mt-1 text-sm leading-relaxed text-foreground/70">{theme.tagline}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {theme.categories.map((category) => (
          <span
            key={category.label}
            className="rounded-full border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground/60"
          >
            {category.icon} {category.label}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {theme.channels.map((c) => (
          <ChannelPill key={c}>{c}</ChannelPill>
        ))}
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

export type PanicGateState = "checking" | "login-required" | "membership-required" | "ready";

/**
 * The Red/Amber panic cards + confirm-modal flow, shared between the homepage
 * (`PanicButtonSection`) and the dashboard SOS page's "New Alert" tab so both present the exact
 * same design instead of two different alert UIs. Session/membership gating is the caller's
 * responsibility (each page already has its own reasons to check it at a different point) —
 * this component just renders whatever `gateState` it's told inside the modal.
 */
export function PanicAlertCards({
  gateState,
  onSent,
}: {
  gateState: PanicGateState;
  onSent?: (profileWarning: string | null) => void;
}) {
  const [openKind, setOpenKind] = useState<AlertKind | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [city, setCity] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [profileWarning, setProfileWarning] = useState<string | null>(null);

  function getLocation() {
    if (!navigator.geolocation) {
      setLocError("Geolocation isn't supported on this device — enter your city instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocError(null);
      },
      () => setLocError("Couldn't get your location — enter your city instead."),
    );
  }

  function openModal(kind: AlertKind) {
    setOpenKind(kind);
    setCategory(kind === "RED" ? RED_CATEGORIES[0] : null);
    setCity("");
    setLocation(null);
    setLocError(null);
    setSendError(null);
    setSent(false);
    // Captured silently in the background so the modal itself can stay a single tap for Red.
    getLocation();
  }

  function closeModal() {
    setOpenKind(null);
  }

  async function handleSend() {
    if (!openKind || !category) return;
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
          description: `${openKind === "RED" ? "Red Alert" : "Amber Alert"} — ${category.label}`,
          latitude: location?.lat ?? 0,
          longitude: location?.lng ?? 0,
          city: city.trim() || "Unknown",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSent(true);
        const warning = data.profileWarning ?? null;
        setProfileWarning(warning);
        onSent?.(warning);
        return;
      }
      const data = await res.json().catch(() => null);
      if (res.status === 403 && data?.error === "MEMBERSHIP_REQUIRED") {
        setSendError("Your BIKIE membership is no longer active.");
        return;
      }
      setSendError(data?.message ?? data?.error ?? "Could not send the alert. Please try again.");
    } catch {
      setSendError("Could not send the alert. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const theme = openKind ? THEME[openKind] : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AlertCard kind="RED" onOpen={openModal} />
        <AlertCard kind="AMBER" onOpen={openModal} />
      </div>

      {openKind && theme && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className={`w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl md:p-8 ${
              sent ? "border-success/40" : theme.border
            }`}
          >
            {gateState === "login-required" ? (
              <div className="text-center">
                <div className="text-4xl">{theme.icon}</div>
                <h3 className={`mt-3 font-display text-xl font-bold ${theme.titleColor}`}>
                  Log in to send an SOS alert
                </h3>
                <p className="mt-2 text-sm text-foreground/60">
                  The Panic Button is available to signed-in BIKIE members so alerts can reach real
                  riders and stay trustworthy.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <Link
                    href="/login"
                    className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                  >
                    Log in
                  </Link>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full px-6 py-2.5 text-sm font-medium text-foreground/60 hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : gateState === "checking" ? (
              <div className="h-24 animate-pulse rounded-2xl bg-foreground/5" />
            ) : gateState === "membership-required" ? (
              <div className="text-center">
                <div className="text-4xl">{theme.icon}</div>
                <h3 className="mt-3 font-display text-xl font-bold">
                  SOS Emergency is a BIKIE Membership perk
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-foreground/60">
                  Sending and responding to SOS alerts is available to active members only — this
                  keeps the safety network trustworthy and limited to verified riders.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <Link
                    href="/membership"
                    className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                  >
                    View Membership Plans
                  </Link>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full px-6 py-2.5 text-sm font-medium text-foreground/60 hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : sent ? (
              <div className="text-center">
                <div className="text-4xl">✅</div>
                <h3 className="mt-3 font-display text-xl font-bold text-success">Alert Sent!</h3>
                <p className="mt-2 text-sm text-foreground/60">
                  GPS shared via SMS and WhatsApp. Help is on the way. Stay safe.
                </p>
                {profileWarning && (
                  <p className="mx-auto mt-3 max-w-sm rounded-lg bg-warning/10 p-3 text-sm text-warning">
                    ⚠️ {profileWarning}
                  </p>
                )}
                <div className="mt-5 flex justify-center gap-3">
                  <Link
                    href="/dashboard/sos"
                    className="rounded-full border border-foreground/15 px-5 py-2 text-sm font-medium hover:bg-foreground/5"
                  >
                    View Emergency Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full px-5 py-2 text-sm font-medium text-foreground/60 hover:text-foreground"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl">{theme.icon}</div>
                <h3 className={`mt-3 font-display text-xl font-bold ${theme.titleColor}`}>
                  {theme.confirmTitle}
                </h3>
                <p className="mt-2 text-sm text-foreground/60">{theme.confirmBody}</p>

                {openKind === "AMBER" && (
                  <div className="mt-5 grid grid-cols-2 gap-2 text-left">
                    {AMBER_CATEGORIES.map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                          category?.label === c.label
                            ? "border-warning bg-warning/10 text-warning"
                            : "border-foreground/15 text-foreground/70 hover:border-foreground/30"
                        }`}
                      >
                        {c.icon} {c.label}
                      </button>
                    ))}
                  </div>
                )}

                {locError && (
                  <div className="mt-4 text-left">
                    <label className="text-xs font-medium text-foreground/60">Your city</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Goa, Manali"
                      className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
                    />
                    <p className="mt-1 text-xs text-foreground/40">{locError}</p>
                  </div>
                )}
                {!locError && !location && (
                  <p className="mt-3 text-xs text-foreground/40">📍 Getting your location…</p>
                )}
                {location && (
                  <p className="mt-3 text-xs text-foreground/40">📍 Location captured</p>
                )}

                {sendError && (
                  <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {sendError}
                  </div>
                )}

                <div className="mt-5 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || !category}
                    className={`rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${theme.button}`}
                  >
                    {sending ? "Sending…" : openKind === "RED" ? "Yes, Send Alert Now" : "Send Amber Alert"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={sending}
                    className="rounded-full px-6 py-2.5 text-sm font-medium text-foreground/60 hover:text-foreground disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
