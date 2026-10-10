"use client";

import { Heart } from "lucide-react";
import { useStore } from "@/components/StoreProvider";

// Heart toggle shared by product cards and the product page. Signed-out visitors are sent to sign in first.
export function WishlistButton({ id, name, showLabel, className = "" }: { id: string; name: string; showLabel?: boolean; className?: string }) {
  const { wishlist, toggleWishlist } = useStore();
  const wished = wishlist.includes(id);
  const action = `${wished ? "Remove" : "Add"} ${name} ${wished ? "from" : "to"} wishlist`;

  return (
    <button
      type="button"
      className={showLabel ? `${wished ? "is-wished " : ""}${className}`.trim() : `icon-btn wish-btn${wished ? " is-wished" : ""} ${className}`.trim()}
      onClick={() => toggleWishlist(id)}
      aria-pressed={wished}
      aria-label={showLabel ? undefined : action}
      title={action}
    >
      <Heart size={showLabel ? 18 : 19} fill={wished ? "currentColor" : "none"} aria-hidden="true" />
      {showLabel ? (wished ? "Saved to wishlist" : "Save to wishlist") : null}
    </button>
  );
}
