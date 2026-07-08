import type { Metadata } from "next";
import type { WishlistItemDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { BikeCard } from "@/components/shared/BikeCard";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const { items } = await getJson<{ items: WishlistItemDTO[] }>("/api/wishlist", { auth: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Wishlist</h1>
      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon="❤️"
            title="Your wishlist is empty"
            description="Save bikes you like while exploring to find them here later."
            actionHref="/explore-bikes"
            actionLabel="Explore bikes"
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <BikeCard key={item.id} bike={item.bike} />
          ))}
        </div>
      )}
    </div>
  );
}
