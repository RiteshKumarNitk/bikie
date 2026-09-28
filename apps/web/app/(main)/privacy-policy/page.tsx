import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How BIKIE collects, uses, and protects your personal information.",
};

/** ADR-090 — content comes from the currently published version (Admin → Legal), not this file. */
export default function PrivacyPolicyPage() {
  return <LegalDocumentPage type="PRIVACY_POLICY" fallbackTitle="Privacy Policy" />;
}
