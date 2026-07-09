"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { homeSearchSchema, type HomeSearchInput } from "@bikie/validation";
import { GlassPanel } from "@bikie/ui";

const bikeTypes = [
  "Adventure",
  "Cruiser",
  "Royal Enfield",
  "Sports",
  "Scooter",
  "Electric",
  "Touring",
  "Luxury",
  "Off Road",
];

export function SearchBar() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HomeSearchInput>({
    resolver: zodResolver(homeSearchSchema),
    defaultValues: { passengers: 1 },
  });

  function onSubmit(data: HomeSearchInput) {
    setIsSubmitting(true);
    const params = new URLSearchParams();
    if (data.location) params.set("location", data.location);
    if (data.pickupDate) params.set("pickup", data.pickupDate);
    if (data.returnDate) params.set("return", data.returnDate);
    if (data.bikeType) params.set("type", data.bikeType);

    router.push(`/explore-bikes?${params.toString()}`);
  }

  return (
    <GlassPanel className="w-full max-w-4xl p-4 md:p-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 md:grid-cols-5 md:items-end md:gap-3"
      >
        <div className="md:col-span-2">
          <label className="text-xs font-medium uppercase tracking-wide text-foreground/60">
            Location
          </label>
          <input
            placeholder="Where are you going?"
            className="mt-1 w-full rounded-xl border border-foreground/10 bg-white/40 px-4 py-3 text-sm outline-none placeholder:text-foreground/40 focus:border-accent dark:bg-black/20"
            {...register("location")}
          />
          {errors.location && (
            <p className="mt-1 text-xs text-red-500">{errors.location.message}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-foreground/60">
            Pickup
          </label>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-foreground/10 bg-white/40 px-4 py-3 text-sm outline-none focus:border-accent dark:bg-black/20"
            {...register("pickupDate")}
          />
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-foreground/60">
            Return
          </label>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-foreground/10 bg-white/40 px-4 py-3 text-sm outline-none focus:border-accent dark:bg-black/20"
            {...register("returnDate")}
          />
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-foreground/60">
            Bike Type
          </label>
          <select
            className="mt-1 w-full rounded-xl border border-foreground/10 bg-white/40 px-4 py-3 text-sm outline-none focus:border-accent dark:bg-black/20"
            {...register("bikeType")}
            defaultValue=""
          >
            <option value="" disabled>
              Choose
            </option>
            {bikeTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90 md:col-span-5"
        >
          {isSubmitting ? "Searching..." : "Search"}
        </button>
      </form>
    </GlassPanel>
  );
}
