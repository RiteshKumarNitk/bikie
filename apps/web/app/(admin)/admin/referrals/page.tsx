import type { Metadata } from "next";
import { getJson } from "@/lib/api";

export const metadata: Metadata = { title: "Referrals" };

interface AdminReferral {
  refereeId: string;
  refereeName: string;
  refereeEmail: string;
  createdAt: string;
  referrerId: string;
  referrerName: string;
  referrerEmail: string;
}

export default async function AdminReferralsPage() {
  const { referrals } = await getJson<{ referrals: AdminReferral[] }>("/api/admin/referrals", { auth: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Referrals</h1>
      <p className="mt-1 text-sm text-white/50">Who referred whom, across the platform.</p>

      {referrals.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white/5 p-8 text-center text-sm text-white/50">
          No referrals yet.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl bg-white/5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
                <th className="px-4 py-3">Referrer</th>
                <th className="px-4 py-3">Referee</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.refereeId} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.referrerName}</p>
                    <p className="text-xs text-white/50">{r.referrerEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.refereeName}</p>
                    <p className="text-xs text-white/50">{r.refereeEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/50">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
