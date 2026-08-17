"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function AdminSignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <button
      type="button"
      disabled={signingOut}
      onClick={async () => {
        setSigningOut(true);
        await authClient.signOut();
        router.push("/login");
      }}
      className="rounded-lg border border-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-50"
    >
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}