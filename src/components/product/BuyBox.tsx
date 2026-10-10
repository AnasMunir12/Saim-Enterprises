"use client";

import { ArrowRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ShareButton } from "@/components/product/ShareButton";
import { WishlistButton } from "@/components/product/WishlistButton";
import { useStore } from "@/components/StoreProvider";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { isLowStock, isSoldOut, maxOrderQuantity, stockMessage, type Product } from "@/lib/products";

// Stock line, quantity, add-to-bag, wishlist/share/enquire, plus a sticky bar on phones once the main button scrolls away.
export function BuyBox({ product }: { product: Product }) {
  const { addToCart, cart, user, userLoaded } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [barVisible, setBarVisible] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);

  const soldOut = isSoldOut(product);
  const low = isLowStock(product);
  const max = maxOrderQuantity(product);
  const inBag = cart.find((line) => line.id === product.id && !line.unavailable)?.quantity ?? 0;
  const tone = soldOut ? "is-out" : low ? "is-low" : "";

  // Show the mobile bar only once the real button has scrolled out of view.
  useEffect(() => {
    const node = anchor.current;
    if (!node || soldOut) return;
    const observer = new IntersectionObserver(([entry]) => setBarVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [soldOut]);

  const ask = `/contact?subject=${encodeURIComponent(`${soldOut ? "Restock question" : "Question"} about ${product.name}${product.sku ? ` (${product.sku})` : ""}`)}`;

  return (
    <>
      <p className={`pdp__stock ${tone}`.trim()}>
        <span className="dot" aria-hidden="true" />
        {stockMessage(product)}
        {!soldOut && max > 0 && !low ? <small> · Made in our Lahore studio</small> : null}
        {inBag > 0 ? <small> · {inBag} in your bag</small> : null}
      </p>

      <div className="pdp__buy">
        <div className="pdp__buy-row" ref={anchor}>
          {!soldOut ? <QuantityStepper value={quantity} max={max} onChange={setQuantity} label={product.name} /> : null}
          <Button size="lg" disabled={soldOut} onClick={() => addToCart(product, quantity)}>
            {soldOut ? "Sold out" : <>Add to bag <ArrowRight size={16} aria-hidden="true" /></>}
          </Button>
        </div>
        {!soldOut && userLoaded && !user ? <p className="field__hint">Browse freely. You will sign in or create an account when you place your order.</p> : null}
        <div className="pdp__aux">
          <WishlistButton id={product.id} name={product.name} showLabel />
          <Link href={ask}><MessageSquare size={18} aria-hidden="true" /> {soldOut ? "Ask about restock" : "Ask about this piece"}</Link>
          <ShareButton title={product.name} />
        </div>
      </div>

      {!soldOut ? (
        <div className={`buybar${barVisible ? " is-visible" : ""}`} aria-hidden={!barVisible}>
          <div className="buybar__price">
            <Price product={product} />
            <span className="buybar__name">{product.name}</span>
          </div>
          <Button tabIndex={barVisible ? 0 : -1} onClick={() => addToCart(product, quantity)}>Add to bag</Button>
        </div>
      ) : null}
    </>
  );
}
