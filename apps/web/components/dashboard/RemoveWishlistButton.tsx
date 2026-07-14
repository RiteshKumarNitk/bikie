"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RemoveWishlistButton({ bikeId }: { bikeId: string }) {
  const [removing, setRemoving] = useState(false);
  const router = useRouter();

  async function handleRemove(e: React.MouseEvent) {
    e.preventDefault(); // Prevent navigating to the bike page
    e.stopPropagation();
    
    setRemoving(true);
    try {
      const res = await fetch(`/api/wishlist/${bikeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        setRemoving(false);
      }
    } catch (err) {
      setRemoving(false);
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={removing}
      className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm transition hover:scale-110 hover:bg-white disabled:opacity-50"
      aria-label="Remove from Wishlist"
    >
      {removing ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      )}
    </button>
  );
}
