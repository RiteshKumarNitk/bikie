import type { Metadata } from "next";
import { getJson } from "@/lib/api";
import { SOSAlertsFeed } from "@/components/sos/SOSAlertsFeed";

export const metadata: Metadata = { title: "SOS Alerts" };

export default async function SOSAdminPage() {
  const { alerts } = await getJson<{ alerts: any[] }>("/api/sos/alerts", { auth: true });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Active SOS Alerts</h1>
      <p className="mt-1 text-sm text-white/50">Monitor and respond to emergency alerts across all cities.</p>
      <SOSAlertsFeed alerts={alerts} live />
    </div>
  );
}