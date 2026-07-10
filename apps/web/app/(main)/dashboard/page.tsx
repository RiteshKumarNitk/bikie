import type { Metadata } from "next";
import Link from "next/link";
import type { BookingDTO, WishlistItemDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { getServerSession } from "@/lib/get-session";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@bikie/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardHomePage() {
  const session = await getServerSession();
  const [{ bookings }, { items: wishlist }] = await Promise.all([
    getJson<{ bookings: BookingDTO[] }>("/api/bookings", { auth: true }),
    getJson<{ items: WishlistItemDTO[] }>("/api/wishlist", { auth: true }),
  ]);

  const upcoming = bookings.find((b) => b.status === "CONFIRMED" || b.status === "PENDING");
  const active = bookings.find((b) => b.status === "ACTIVE");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome back, {session?.user.name.split(" ")[0]}</h1>
      <p className="mt-1 text-foreground/60">Here&apos;s what&apos;s happening with your account.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Upcoming Bookings" value={bookings.filter((b) => b.status !== "COMPLETED" && b.status !== "CANCELLED").length} />
        <StatCard label="Completed Trips" value={bookings.filter((b) => b.status === "COMPLETED").length} />
        <StatCard label="Wishlist" value={wishlist.length} />
        <StatCard label="Total Spent" value={formatCurrency(bookings.reduce((sum, b) => sum + b.totalPrice, 0))} />
      </div>

      <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-lg">🆘</span>
            <div>
              <p className="font-semibold text-red-400">SOS Emergency</p>
              <p className="text-xs text-foreground/50">Need help? Send an alert to nearby users and admins.</p>
            </div>
          </div>
          <Link
            href="/dashboard/sos"
            className="rounded-xl bg-red-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            Alert
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-card p-6">
          <p className="font-semibold">Current / Upcoming Booking</p>
          {active || upcoming ? (
            <div className="mt-4">
              <p className="font-medium">{(active ?? upcoming)!.bike.name}</p>
              <p className="text-sm text-foreground/60">
                {new Date((active ?? upcoming)!.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} –{" "}
                {new Date((active ?? upcoming)!.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
              <Link href="/dashboard/bookings" className="mt-3 inline-flex text-sm font-medium text-accent-text">
                View booking →
              </Link>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-foreground/60">No active or upcoming bookings.</p>
              <Link href="/explore-bikes" className="mt-3 inline-flex text-sm font-medium text-accent-text">
                Explore bikes →
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-card p-6">
          <p className="font-semibold">Emergency Contacts</p>
          <p className="mt-2 text-sm text-foreground/60">
            Roadside assistance is available 24/7 for every active booking.
          </p>
          <Link href="/roadside-assistance" className="mt-3 inline-flex text-sm font-medium text-accent-text">
            Get Roadside Assistance →
          </Link>
        </div>
      </div>
    </div>
  );
}
