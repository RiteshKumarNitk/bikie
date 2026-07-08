"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function JoinTripCard({
  tripSlug,
  seatsLeft,
}: {
  tripId: string;
  tripSlug: string;
  seatsLeft: number;
}) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [message, setMessage] = useState<string | null>(null);

  function handleJoin() {
    if (!session) {
      router.push(`/login?next=/trips/${tripSlug}`);
      return;
    }
    setMessage("Trip joining confirmation is coming soon — this is a preview of the flow.");
  }

  return (
    <>
      <button
        type="button"
        onClick={handleJoin}
        disabled={seatsLeft <= 0}
        className="mt-5 w-full rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
      >
        {seatsLeft > 0 ? "Join Trip" : "Fully Booked"}
      </button>
      {message && <p className="mt-3 text-xs text-foreground/60">{message}</p>}
    </>
  );
}
