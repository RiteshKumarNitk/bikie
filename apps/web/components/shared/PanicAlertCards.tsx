"use client";

import { useState } from "react";
import Link from "next/link";

type SOSType =
  | "ACCIDENT"
  | "BIKE_BREAKDOWN"
  | "FUEL_EMPTY"
  | "MEDICAL"
  | "LOST"
  | "OTHER"
  | "LIFE_THREATENING"
  | "FLAT_TYRE"
  | "BATTERY_ISSUE";
export type AlertKind = "RED" | "AMBER";

interface Category {
  label: string;
  type: SOSType;
  icon: string;
}

// Every category maps to its own real SOSAlertType value now (ADR-033) — no more collapsing
// distinct issues onto a shared backend value with the label preserved only in free text.
const RED_CATEGORIES: Category[] = [
  { label: "Accident", type: "ACCIDENT", icon: "🚨" },
  { label: "Medical Emergency", type: "MEDICAL", icon: "🏥" },
  { label: "Life Threatening", type: "LIFE_THREATENING", icon: "🔥" },
];
const AMBER_CATEGORIES: Category[] = [
  { label: "Bike Breakdown", type: "BIKE_BREAKDOWN", icon: "🔧" },
  { label: "Flat Tyre", type: "FLAT_TYRE", icon: "🔩" },
  { label: "Fuel Required", type: "FUEL_EMPTY", icon: "⛽" },
  { label: "Battery Issue", type: "BATTERY_ISSUE", icon: "🔋" },
  { label: "Lost", type: "LOST", icon: "🗺️" },
  { label: "Other", type: "OTHER", icon: "❗" },
];

/** Mirror of the server's `SOSDispatchSummary` fields this screen reports on (ADR-030). */
interface DispatchSummary {
  nearbyRiders: number;
  serviceProviders: number;
  emergencyContacts: number;
  emergencyServices: number;
  smsAttempted: number;
  smsSent: number;
  whatsappAttempted: number;
  whatsappSent: number;
  emailAttempted: number;
  emailSent: number;
  escalatedToAdmins: number;
  channels?: { sms: boolean; whatsapp: boolean; email: boolean };
}

function recipientCount(d: DispatchSummary) {
  return d.nearbyRiders + d.serviceProviders + d.emergencyContacts + d.emergencyServices;
}

/**
 * The old success screen always claimed "GPS shared via SMS, WhatsApp, and email" even when the
 * fan-out reached nobody and those providers had no credentials — the single most misleading part
 * of the SOS flow. Report what actually happened instead.
 */
function DispatchReport({ dispatch }: { dispatch: DispatchSummary | null }) {
  if (!dispatch) {
    return (
      <p className="mx-auto mt-3 max-w-sm rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
        Your alert is recorded and visible to responders in the app, but the notification dispatch
        failed. Call local emergency services now.
      </p>
    );
  }

  const reached = recipientCount(dispatch);
  const channels = dispatch.channels;
  const offChannels = channels
    ? [
        !channels.sms ? "SMS" : null,
        !channels.whatsapp ? "WhatsApp" : null,
        !channels.email ? "email" : null,
      ].filter(Boolean)
    : [];

  if (reached === 0) {
    return (
      <div className="mx-auto mt-3 max-w-sm space-y-3 text-left">
        <p className="rounded-lg bg-warning/10 p-3 text-sm text-warning">
          ⚠️ Your alert is live in the app, but <strong>no one could be notified</strong> — no
          emergency contacts are saved on your profile, no nearby riders are sharing their
          location, and no service provider matched your city.
          {dispatch.escalatedToAdmins > 0 &&
            ` It was escalated to ${dispatch.escalatedToAdmins} BIKIE admin${dispatch.escalatedToAdmins > 1 ? "s" : ""}.`}
        </p>
        <p className="text-sm font-semibold text-red-400">
          Call local emergency services now — don't wait on the app.
        </p>
        <Link
          href="/dashboard/settings"
          className="block rounded-full bg-accent px-5 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Add emergency contacts
        </Link>
      </div>
    );
  }

  const delivered = [
    dispatch.smsAttempted > 0 ? `SMS ${dispatch.smsSent}/${dispatch.smsAttempted}` : null,
    dispatch.whatsappAttempted > 0
      ? `WhatsApp ${dispatch.whatsappSent}/${dispatch.whatsappAttempted}`
      : null,
    dispatch.emailAttempted > 0 ? `Email ${dispatch.emailSent}/${dispatch.emailAttempted}` : null,
  ].filter(Boolean);

  return (
    <div className="mx-auto mt-3 max-w-sm space-y-2 text-sm">
      <p className="text-foreground/60">
        Your live GPS went out to {reached} responder{reached > 1 ? "s" : ""}
        {dispatch.nearbyRiders > 0 && ` · ${dispatch.nearbyRiders} nearby rider(s)`}
        {dispatch.serviceProviders > 0 && ` · ${dispatch.serviceProviders} provider(s)`}
        {dispatch.emergencyContacts > 0 && ` · ${dispatch.emergencyContacts} emergency contact(s)`}.
      </p>
      {delivered.length > 0 && (
        <p className="text-xs text-foreground/40">Delivered: {delivered.join(" · ")}</p>
      )}
      {offChannels.length > 0 && (
        <p className="rounded-lg bg-warning/10 p-2.5 text-xs text-warning">
          {offChannels.join(" and ")} {offChannels.length > 1 ? "are" : "is"} not configured on this
          deployment, so those messages were not sent.
        </p>
      )}
    </div>
  );
}

// Exact brand hexes for the two alert kinds (RED #e8000d, AMBER #ffaa00) — intentionally
// more saturated than the shared --color-warning token, since these need to read as urgent
// at a glance and are only ever used here and in the SOS confirm modal, not as a
// general-purpose UI color. Class names below are written out in full (not built from a
// shared variable) because Tailwind's static scanner can't see through string interpolation.
const THEME = {
  RED: {
    label: "Red Alert — Emergency",
    icon: "🆘",
    tagline: "Accident or life-threatening situation. Immediately alerts fellow riders with your GPS.",
    categories: RED_CATEGORIES,
    channels: ["SMS", "WhatsApp", "Fellow Riders", "Emergency Services"],
    footer: "Live GPS shared instantly",
    border: "border-[#e8000d]/30",
    cardBg: "linear-gradient(135deg, rgba(232, 0, 13, .12), rgba(232, 0, 13, .05))",
    cardBorder: "1px solid rgba(232, 0, 13, .35)",
    iconBg: "bg-[#e8000d] shadow-[0_0_30px_rgba(232,0,13,0.45)]",
    chip: "border-[#e8000d]/40 bg-[#e8000d]/20 text-white",
    button: "bg-[#e8000d] hover:bg-[#c40010]",
    titleColor: "text-[#e8000d]",
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
    border: "border-[#ffaa00]/30",
    cardBg: "linear-gradient(135deg, rgba(255, 170, 0, .12), rgba(255, 170, 0, .05))",
    cardBorder: "1px solid rgba(255, 170, 0, .35)",
    iconBg: "bg-[#ffaa00] shadow-[0_0_30px_rgba(255,170,0,0.45)]",
    chip: "border-[#ffaa00]/40 bg-[#ffaa00]/20 text-white",
    button: "bg-[#ffaa00] hover:bg-[#e69500]",
    titleColor: "text-[#ffaa00]",
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

function AlertIcon({ kind }: { kind: AlertKind }) {
  if (kind === "RED") {
    return <span className="text-xs font-bold tracking-wide text-white">SOS</span>;
  }
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function AlertCard({ kind, onOpen }: { kind: AlertKind; onOpen: (kind: AlertKind) => void }) {
  const theme = THEME[kind];
  return (
    <button
      type="button"
      onClick={() => onOpen(kind)}
      className="group w-full rounded-3xl p-6 text-left transition-all hover:-translate-y-1 md:p-8"
      style={{ background: theme.cardBg, border: theme.cardBorder }}
    >
      <div className="flex items-center gap-4">
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${theme.iconBg}`}
        >
          <AlertIcon kind={kind} />
        </span>
        <div>
          <h3 className={`font-display text-xl font-bold ${theme.titleColor}`}>{theme.label}</h3>
          <p className="mt-1 text-sm leading-relaxed text-foreground/70">{theme.tagline}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {theme.categories.map((category) => (
          <span
            key={category.label}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${theme.chip}`}
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

      <div className="mt-5 flex items-center gap-1.5 text-xs text-foreground/50">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
        </span>
        {theme.footer}
      </div>
    </button>
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
  const [dispatch, setDispatch] = useState<DispatchSummary | null>(null);

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
    setDispatch(null);
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
        setDispatch(data.dispatch ?? null);
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
                {(() => {
                  const reachedNobody = !dispatch || recipientCount(dispatch) === 0;
                  return (
                    <>
                      <div className="text-4xl">{reachedNobody ? "⚠️" : "✅"}</div>
                      <h3
                        className={`mt-3 font-display text-xl font-bold ${
                          reachedNobody ? "text-warning" : "text-success"
                        }`}
                      >
                        {reachedNobody ? "Alert recorded — nobody reached" : "Alert Sent!"}
                      </h3>
                    </>
                  );
                })()}
                <DispatchReport dispatch={dispatch} />
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
                            ? "border-[#ffaa00] bg-[#ffaa00]/10 text-[#ffaa00]"
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
