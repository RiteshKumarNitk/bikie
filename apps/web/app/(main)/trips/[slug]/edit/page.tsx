"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

interface DestinationOption {
  id: string;
  name: string;
  state: string;
}

const RIDE_TYPES = [
  { value: "WEEKEND", label: "Weekend Ride" },
  { value: "ADVENTURE", label: "Adventure Ride" },
  { value: "ROAD_TRIP", label: "Road Trip" },
  { value: "INTERNATIONAL", label: "International" },
  { value: "GUIDED_TOUR", label: "Guided Tour" },
];

const DIFFICULTIES = [
  { value: "EASY", label: "Beginner" },
  { value: "MODERATE", label: "Intermediate" },
  { value: "HARD", label: "Advanced" },
];

export default function EditRidePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [destinations, setDestinations] = useState<DestinationOption[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("WEEKEND");
  const [difficulty, setDifficulty] = useState("EASY");
  const [seatsTotal, setSeatsTotal] = useState("6");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("0");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/destinations")
      .then((r) => r.json())
      .then((data) => setDestinations(data.destinations ?? []));
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push(`/login?next=/trips/${resolvedParams.slug}/edit`);
      return;
    }

    fetch(`/api/trips/${resolvedParams.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.trip) {
          if (data.trip.organizer?.id !== session.user.id) {
            router.push(`/trips/${resolvedParams.slug}`);
            return;
          }
          const t = data.trip;
          setTitle(t.title);
          setDescription(t.description || "");
          setType(t.type);
          setDifficulty(t.difficulty);
          setSeatsTotal(t.seatsTotal.toString());
          setMeetingPoint(t.meetingPoint || "");
          if (t.destination) setDestinationId(t.destination.id || ""); // Need id if possible, wait, getBySlug only has summary fields?
          // Fallback if destination id isn't populated exactly:
          setStartDate(new Date(t.startDate).toISOString().slice(0, 16));
          setEndDate(new Date(t.endDate).toISOString().slice(0, 16));
          setImageUrl(t.imageUrl || "");
          setPrice(t.price?.toString() || "0");
        }
        setInitialLoading(false);
      })
      .catch(() => setInitialLoading(false));
  }, [resolvedParams.slug, session, isPending, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError("Pick both a start and return date/time.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/trips/${resolvedParams.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          difficulty,
          seatsTotal: Number(seatsTotal),
          price: Number(price),
          meetingPoint: meetingPoint || undefined,
          destinationId: destinationId || undefined,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          imageUrl,
        }),
      });

      if (res.status === 403) {
        setError("You do not have permission to edit this ride.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data.error === "string"
            ? data.error
            : "Couldn't update the ride — check the form and try again.",
        );
        return;
      }

      router.push(`/trips/${resolvedParams.slug}`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isPending || !session || initialLoading) {
    return (
      <div className="pb-24">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Rides", href: "/trips" }, { label: "Edit Ride" }]} />
        <div className="mx-auto max-w-2xl px-6 pt-6">
          <div className="h-64 animate-pulse rounded-3xl bg-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Rides", href: "/trips" }, { label: "Edit Ride" }]} />

      <div className="mx-auto max-w-2xl px-6 pt-6">
        <h1 className="text-3xl font-semibold">Edit Ride</h1>
        <p className="mt-2 text-foreground/60">
          Update the details of your ride.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium">Ride Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Ride Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
              >
                {RIDE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Destination (optional)</label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
            >
              <option value="">No specific destination</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}, {d.state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Meeting Point</label>
            <input
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Ride Date &amp; Time</label>
              <input
                required
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Return Date &amp; Time</label>
              <input
                required
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Maximum Riders</label>
              <input
                required
                type="number"
                min={1}
                max={200}
                value={seatsTotal}
                onChange={(e) => setSeatsTotal(e.target.value)}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Estimated Price (₹)</label>
              <input
                required
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Cover Image</label>
            <div className="mt-1 flex items-center gap-4">
              {imageUrl && (
                <div className="relative h-20 w-32 overflow-hidden rounded-xl border border-foreground/10">
                  <img src={imageUrl} alt="Cover" className="h-full w-full object-cover" />
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    try {
                      const formData = new FormData();
                      formData.append("file", file);
                      const res = await fetch("/api/upload", { method: "POST", body: formData });
                      if (res.ok) {
                        const { url } = await res.json();
                        setImageUrl(url);
                      }
                    } catch (err) {
                      console.error("Failed to upload image", err);
                    }
                  }}
                  className="mt-1 block w-full text-sm text-foreground/60 file:mr-4 file:rounded-xl file:border-0 file:bg-foreground/5 file:px-4 file:py-2.5 file:text-sm file:font-semibold hover:file:bg-foreground/10 focus:outline-none"
                />
                <p className="mt-1 text-xs text-foreground/50">Upload a cover image (JPG, PNG). Max size 5MB.</p>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
