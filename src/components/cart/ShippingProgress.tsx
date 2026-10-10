import { Truck } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { formatPrice } from "@/lib/products";

// Progress toward free delivery, so shoppers see exactly how far they are.
export function ShippingProgress({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const percent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  return (
    <div className={`ship-progress${remaining === 0 ? " is-done" : ""}`} role="status">
      <p>
        <Truck size={16} aria-hidden="true" />
        {remaining === 0 ? "You have unlocked free delivery." : <>Add <strong>{formatPrice(remaining)}</strong> more for free delivery.</>}
      </p>
      <div className="ship-progress__bar" aria-hidden="true"><i style={{ width: `${percent}%` }} /></div>
    </div>
  );
}
