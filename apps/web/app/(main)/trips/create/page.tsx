"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LocationPicker, type LocationPickerValue } from "@/components/shared/LocationPicker";

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

export default function CreateRidePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("WEEKEND");
  const [difficulty, setDifficulty] = useState("EASY");
  const [seatsTotal, setSeatsTotal] = useState("6");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [meetingLocation, setMeetingLocation] = useState<LocationPickerValue | null>(null);
  const [destinationName, setDestinationName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("0");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login?next=/trips/create");
    }
  }, [isPending, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError("Pick both a start and return date/time.");
      return;
    }
    if (!termsAccepted) {
      setError("You must accept the Organizer Terms and Conditions.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          difficulty,
          seatsTotal: Number(seatsTotal),
          price: Number(price),
          meetingPoint: meetingPoint || undefined,
          meetingLat: meetingLocation?.latitude,
          meetingLng: meetingLocation?.longitude,
          destinationName: destinationName || undefined,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          imageUrl,
        }),
      });

      if (res.status === 403) {
        router.push("/membership?next=/trips/create");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data.error === "string"
            ? data.error
            : "Couldn't create the ride — check the form and try again.",
        );
        return;
      }

      const data = await res.json();
      router.push(`/trips/${data.trip.slug}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isPending || !session) {
    return (
      <div className="pb-24">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Rides", href: "/trips" }, { label: "Create a Ride" }]} />
        <div className="mx-auto max-w-2xl px-6 pt-6">
          <div className="h-64 animate-pulse rounded-3xl bg-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Rides", href: "/trips" }, { label: "Create a Ride" }]} />

      <div className="mx-auto max-w-2xl px-6 pt-6">
        <h1 className="text-3xl font-semibold">Create a Ride</h1>
        <p className="mt-2 text-foreground/60">
          Organize a ride and let the community request to join. You approve who rides with you.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium">Ride Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Jaipur to Mount Abu Weekend Ride"
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
            <input
              value={destinationName}
              onChange={(e) => setDestinationName(e.target.value)}
              placeholder="Mount Abu, Rajasthan"
              className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <p className="mt-1 text-xs text-foreground/50">Write it however riders will recognize it — no fixed list to pick from.</p>
          </div>

          <div>
            <label className="text-sm font-medium">Meeting Point</label>
            <input
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              placeholder="Vaishali Nagar Petrol Pump"
              className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <div className="mt-3">
              <LocationPicker value={meetingLocation} onChange={setMeetingLocation} />
            </div>
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
              placeholder="Weekend ride to Mount Abu. Breakfast at Behror. Stay one night. Return Sunday. Helmet mandatory, no rash riding, follow the leader."
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

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 border-foreground/20 bg-transparent text-accent focus:ring-accent"
            />
            <span className="text-sm text-foreground/80">
              I agree to the <Link href="/terms-and-conditions" className="text-accent hover:underline" target="_blank">Organizer Terms &amp; Conditions</Link>, and acknowledge that I am responsible for organizing and conducting this trip safely.
            </span>
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {isSubmitting ? "Creating…" : "Publish Ride"}
          </button>
          <p className="text-center text-xs text-foreground/50">
            Requires an active <Link href="/membership" className="text-accent-text hover:underline">BIKIE membership</Link>.
          </p>
        </form>
      </div>
    </div>
  );
}
