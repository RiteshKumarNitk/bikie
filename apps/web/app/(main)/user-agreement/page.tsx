import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";

export const metadata: Metadata = {
  title: "User Agreement",
  description: "The legal terms you agree to when you create a BIKIE account.",
};

/** ADR-090 — content comes from the currently published version (Admin → Legal). */
export default function UserAgreementPage() {
  return <LegalDocumentPage type="USER_AGREEMENT" fallbackTitle="User Agreement" />;
}
