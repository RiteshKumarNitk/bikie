"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

/**
 * ADR-053 — this page's old job ("any Rider can self-service start a Service Provider
 * application") no longer exists: accountType is fixed at registration and only ever changed by
 * an admin-approved Account Type Change Request. Kept only as a redirect for any stale
 * bookmark/link, so nobody hits a dead page.
 */
export default function BecomeProviderRedirectPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login?next=/dashboard/become-provider");
      return;
    }
    router.replace(session.user.accountType === "SERVICE_PROVIDER" ? "/partner" : "/account-type-request");
  }, [isPending, session, router]);

  return <div className="py-10 text-center text-foreground/50">Redirecting…</div>;
}
