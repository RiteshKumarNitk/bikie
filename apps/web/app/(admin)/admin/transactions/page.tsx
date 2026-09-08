import type { Metadata } from "next";
import { TransactionsBrowser } from "@/components/admin/TransactionsBrowser";

export const metadata: Metadata = { title: "Transactions" };

/** ADR-076 — every recorded financial transaction (membership activations, Rider + Service
 * Provider), read from the immutable `MembershipInvoice` ledger. Admin-only; the API enforces it
 * server-side. */
export default function AdminTransactionsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Transactions</h1>
      <p className="mt-1 text-sm text-white/50">
        All membership payments across BIKIE. Amounts are the exact value recorded at purchase time.
      </p>
      <TransactionsBrowser />
    </div>
  );
}
