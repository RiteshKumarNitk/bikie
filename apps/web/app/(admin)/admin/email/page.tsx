import type { Metadata } from "next";
import { EmailComposer } from "@/components/admin/EmailComposer";

export const metadata: Metadata = { title: "Email" };

export default function EmailPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Send Email</h1>
      <p className="mt-1 text-sm text-white/50">Send transactional emails to users.</p>
      <EmailComposer />
    </div>
  );
}