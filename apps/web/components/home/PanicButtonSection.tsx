"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Reveal } from "@/components/shared/Reveal";
import { PanicAlertCards, type PanicGateState } from "@/components/shared/PanicAlertCards";

export function PanicButtonSection() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [isMember, setIsMember] = useState(false);

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

  const gateState: PanicGateState = sessionPending
    ? "checking"
    : !session
      ? "login-required"
      : checkingMembership
        ? "checking"
        : !isMember
          ? "membership-required"
          : "ready";

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

      <Reveal delay={0.05} className="mt-10">
        <PanicAlertCards gateState={gateState} />
      </Reveal>
    </section>
  );
}
