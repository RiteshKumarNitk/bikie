import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { getJson } from "@/lib/api";
import { TripDetailDTO } from "@bikie/types";
import Link from "next/link";

export default async function RequestsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { trip } = await getJson<{ trip: TripDetailDTO }>(`/api/trips/${slug}`);
  if (!trip) notFound();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Join Requests</h2>
      <div className="rounded-3xl bg-card border border-foreground/10 p-6 text-center py-12">
        <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">Manage Requests centrally</h3>
        <p className="text-foreground/60 text-sm mt-2 max-w-sm mx-auto">
          We've moved request management to your central Community Dashboard so you can see all your rides at once.
        </p>
        <div className="mt-6">
          <Link href="/dashboard/requests" className="bg-foreground text-background px-6 py-3 rounded-full font-semibold hover:bg-foreground/90 transition">
            Go to Request Inbox
          </Link>
        </div>
      </div>
    </div>
  );
}
