import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms governing your use of the BIKIE platform.",
};

/** ADR-090 — content comes from the currently published version (Admin → Legal), not this file. */
export default function TermsPage() {
  return <LegalDocumentPage type="TERMS_AND_CONDITIONS" fallbackTitle="Terms & Conditions" />;
}
