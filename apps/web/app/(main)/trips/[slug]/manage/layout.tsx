import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { getJson } from "@/lib/api";
import { TripDetailDTO } from "@bikie/types";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import ManageTabs from "./ManageTabs";

export default async function TripManageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { trip } = await getJson<{ trip: TripDetailDTO }>(`/api/trips/${slug}`);
  if (!trip) notFound();

  if (trip.organizer.id !== session.user.id) {
    redirect(`/trips/${slug}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Rides", href: "/dashboard/trips" },
          { label: trip.title, href: `/trips/${slug}` },
          { label: "Manage" },
        ]}
      />

      <div className="mt-8">
        <h1 className="text-3xl font-semibold">Organizer Dashboard</h1>
        <p className="text-foreground/60">{trip.title}</p>
      </div>

      <ManageTabs trip={trip} />

      <div className="mt-8">{children}</div>
    </div>
  );
}
