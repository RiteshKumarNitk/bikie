import type { Metadata } from "next";
import type { BikeSearchResultDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { formatCurrency } from "@bikie/utils";

export const metadata: Metadata = { title: "Bikes" };

export default async function AdminBikesPage() {
  const { bikes, total } = await getJson<BikeSearchResultDTO>("/api/bikes?pageSize=48");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Bikes ({total})</h1>
      <div className="mt-6 overflow-x-auto rounded-3xl bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-foreground/50">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">City</th>
              <th className="px-5 py-3 font-medium">Price/day</th>
              <th className="px-5 py-3 font-medium">Rating</th>
            </tr>
          </thead>
          <tbody>
            {bikes.map((bike) => (
              <tr key={bike.id} className="border-b border-foreground/5 last:border-0">
                <td className="px-5 py-3">{bike.name}</td>
                <td className="px-5 py-3 text-foreground/60">{bike.category.name}</td>
                <td className="px-5 py-3 text-foreground/60">{bike.city}</td>
                <td className="px-5 py-3">{formatCurrency(bike.pricePerDay)}</td>
                <td className="px-5 py-3">★ {bike.ratingAvg.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
