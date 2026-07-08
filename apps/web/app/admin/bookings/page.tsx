import type { Metadata } from "next";
import { getJson } from "@/lib/api";
import { formatCurrency } from "@bikie/utils";

export const metadata: Metadata = { title: "Bookings" };

interface AdminBooking {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  bike: { name: string; slug: string };
  renter: { name: string; email: string };
}

export default async function AdminBookingsPage() {
  const { bookings } = await getJson<{ bookings: AdminBooking[] }>("/api/admin/bookings", { auth: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Bookings ({bookings.length})</h1>
      <div className="mt-6 overflow-x-auto rounded-3xl bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-foreground/50">
              <th className="px-5 py-3 font-medium">Bike</th>
              <th className="px-5 py-3 font-medium">Renter</th>
              <th className="px-5 py-3 font-medium">Dates</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b border-foreground/5 last:border-0">
                <td className="px-5 py-3">{booking.bike.name}</td>
                <td className="px-5 py-3 text-foreground/60">{booking.renter.email}</td>
                <td className="px-5 py-3 text-foreground/60">
                  {new Date(booking.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} –{" "}
                  {new Date(booking.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </td>
                <td className="px-5 py-3">{formatCurrency(booking.totalPrice)}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium">{booking.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
