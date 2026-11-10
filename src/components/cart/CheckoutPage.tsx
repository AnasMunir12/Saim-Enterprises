"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { OrderConfirmation } from "@/components/cart/OrderConfirmation";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { OrderView } from "@/lib/orders";

type Outcome = { kind: "placed"; order: OrderView } | { kind: "stock-changed"; message: string };

export function CheckoutPage() {
  const router = useRouter();
  const { cart, cartReady, settings, user, openCart } = useStore();
  const [placedOrder, setPlacedOrder] = useState<OrderView | null>(null);
  const [notice, setNotice] = useState("");
  const unavailable = cart.some((line) => line.unavailable);

  function handleOutcome(outcome: Outcome) {
    if (outcome.kind === "placed") {
      setPlacedOrder(outcome.order);
      return;
    }
    setNotice(outcome.message);
  }

  return (
    <section className="checkout-page section" aria-labelledby="checkout-title">
      <div className="checkout-page__top">
        <Link href="/catalog" className="checkout-page__continue"><ArrowLeft size={15} aria-hidden="true" /> Continue shopping</Link>
        <span>Secure order details</span>
      </div>

      {placedOrder ? (
        <div className="checkout-page__confirmation">
          <OrderConfirmation
            order={placedOrder}
            email={settings?.contactEmail}
            isGuest={!user}
            onClose={() => router.push("/catalog")}
          />
        </div>
      ) : !cartReady ? (
        <div className="checkout-loading" role="status" aria-label="Loading your bag">
          <span />
          <span />
          <span />
        </div>
      ) : cart.length === 0 ? (
        <div className="checkout-empty">
          <ShoppingBag size={36} aria-hidden="true" />
          <p className="eyebrow">Your bag is empty</p>
          <h1 id="checkout-title">A good place to start.</h1>
          <p>Browse the collection and add something special to your bag.</p>
          <ButtonLink href="/catalog" size="lg">Browse the collection</ButtonLink>
        </div>
      ) : unavailable ? (
        <div className="checkout-empty checkout-empty--review">
          <p className="eyebrow">One quick update</p>
          <h1 id="checkout-title">Review your bag</h1>
          <p>Some items are no longer available at the selected quantity. Please review your bag before placing the order.</p>
          <Button size="lg" onClick={() => openCart()}>Review bag</Button>
        </div>
      ) : (
        <>
          <div className="checkout-page__heading">
            <p className="eyebrow">Guest checkout available</p>
            <h1 id="checkout-title">A few details, then it’s yours.</h1>
            <p>Enter your delivery information. No account or online payment is required.</p>
          </div>
          {notice ? <Alert>{notice}</Alert> : null}
          <CheckoutForm onBack={() => openCart()} onOutcome={handleOutcome} />
        </>
      )}
    </section>
  );
}
