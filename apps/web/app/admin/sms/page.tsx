import type { Metadata } from "next";
import { SMSComposer } from "@/components/admin/SMSComposer";

export const metadata: Metadata = { title: "SMS" };

export default function SMSPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Send SMS</h1>
      <p className="mt-1 text-sm text-white/50">Send SMS messages via Twilio.</p>
      <SMSComposer />
    </div>
  );
}