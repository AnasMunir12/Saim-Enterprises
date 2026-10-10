"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { StoreImage } from "@/components/ui/StoreImage";
import { formatPrice } from "@/lib/products";

export function CartLines({ onNavigate }: { onNavigate: () => void }) {
  const { cart, changeQuantity, removeFromCart } = useStore();

  return (
    <ul className="cart-lines">
      {cart.map((item) => {
        const href = item.slug ? `/product/${item.slug}` : "/catalog";
        const ceiling = item.stock === undefined ? 99 : Math.min(99, item.stock);
        const atMax = item.quantity >= ceiling;
        return (
          <li className={`cart-line${item.unavailable ? " is-unavailable" : ""}`} key={item.id}>
            <Link href={href} onClick={onNavigate} className="cart-line__image" tabIndex={-1} aria-hidden="true">
              <StoreImage src={item.image} alt="" />
            </Link>
            <div className="cart-line__body">
              <h3><Link href={href} onClick={onNavigate}>{item.name}</Link></h3>
              <p className="cart-line__price">
                {formatPrice(item.price)}
                {item.compareAtPrice ? <s>{formatPrice(item.compareAtPrice)}</s> : null}
              </p>
              {item.unavailable ? (
                <p className="cart-line__note is-warn" role="status">Sold out or no longer available. Remove it to check out.</p>
              ) : (
                <>
                  <QuantityStepper value={item.quantity} max={ceiling} onChange={(next) => changeQuantity(item.id, next - item.quantity)} label={item.name} />
                  {item.adjustedTo !== undefined ? (
                    <p className="cart-line__note is-warn" role="status">Quantity reduced to {item.adjustedTo}, the most we have.</p>
                  ) : atMax && item.stock !== undefined && item.stock <= 5 ? (
                    <p className="cart-line__note">Only {item.stock} available.</p>
                  ) : null}
                </>
              )}
            </div>
            <button type="button" className="icon-btn cart-line__remove" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name} from bag`}><Trash2 size={17} /></button>
          </li>
        );
      })}
    </ul>
  );
}
