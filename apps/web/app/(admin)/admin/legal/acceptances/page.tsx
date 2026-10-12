import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ConsentRecordsBrowser } from "@/components/admin/legal/ConsentRecordsBrowser";

export const metadata: Metadata = { title: "Consent Records" };

/** ADR-090 — compliance audit of legal acceptances. Admin-only; the API enforces it server-side. */
export default function AdminLegalAcceptancesPage() {
  return (
    <div>
      <Link href="/admin/legal" className="text-xs text-white/50 hover:underline">
        ← Legal overview
      </Link>
      <h1 className="mt-1 text-2xl font-semibold">Consent Records</h1>
      <p className="mt-1 text-sm text-white/50">
        Who accepted which exact version of each legal document, and when. Records are permanent and never updated
        when a newer version is published.
      </p>
      <Suspense fallback={<div className="mt-6 h-40 animate-pulse rounded-xl bg-white/5" />}>
        <ConsentRecordsBrowser />
      </Suspense>
    </div>
  );
}
