"use client";

import { ArrowLeft, ArrowRight, Truck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useStore } from "@/components/StoreProvider";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextArea, TextField } from "@/components/ui/FormField";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import type { OrderView } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

type Outcome = { kind: "placed"; order: OrderView } | { kind: "signed-out" } | { kind: "stock-changed"; message: string };

// Delivery details and the Place order button. Only ids and quantities are sent; the server reads names and
// prices from the database.
export function CheckoutForm({ onBack, onOutcome }: { onBack: () => void; onOutcome: (outcome: Outcome) => void }) {
  const { cart, subtotal, user, refreshCart, clearCart } = useStore();
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const purchasable = cart.filter((line) => !line.unavailable);

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: purchasable.map((item) => ({ productId: item.id, quantity: item.quantity })), phone, shippingAddress: address, notes }),
      });
      if (response.status === 401) {
        onOutcome({ kind: "signed-out" });
        return;
      }
      const data = (await response.json().catch(() => ({}))) as { order?: OrderView; message?: string };
      if (response.status === 409) {
        // Stock changed since the items were added: re-sync the bag, then show exactly what changed.
        await refreshCart();
        onOutcome({ kind: "stock-changed", message: data.message ?? "Some items in your bag are no longer available." });
        return;
      }
      if (!response.ok || !data.order) {
        setError(data.message ?? "We could not place your order. Please try again.");
        return;
      }
      clearCart();
      onOutcome({ kind: "placed", order: data.order });
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="checkout-form" onSubmit={placeOrder}>
      <button type="button" className="cart-back" onClick={onBack}><ArrowLeft size={14} aria-hidden="true" /> Back to bag</button>
      <p className="checkout-note">
        Ordering as <strong>{user?.name}</strong> ({user?.email}). No payment is taken online: we contact you to confirm the order, then arrange payment and delivery.
      </p>
      <TextField label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" maxLength={20} required placeholder="+92 300 1234567" hint="We call or message this number to confirm your order." />
      <TextArea label="Delivery address" value={address} onChange={(event) => setAddress(event.target.value)} rows={3} maxLength={500} required autoComplete="street-address" placeholder="House, street, area, city" />
      <TextArea label="Notes (optional)" value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} maxLength={1000} placeholder="Custom sizing, finishes, delivery timing" />
      <ul className="checkout-items" aria-label="Items in this order">
        {purchasable.map((item) => <li key={item.id}><span>{item.name} <small>x {item.quantity}</small></span><span>{formatPrice(item.price * item.quantity)}</span></li>)}
      </ul>
      {error ? <Alert>{error}</Alert> : null}
      <div className="cart-summary cart-summary--flat">
        <div className="cart-summary__total"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
        <p className="cart-summary__note"><Truck size={15} aria-hidden="true" /> {subtotal >= FREE_SHIPPING_THRESHOLD ? "Free delivery applies to this order." : "Delivery is confirmed when we review your order."}</p>
        <Button type="submit" size="lg" block loading={submitting}>{submitting ? "Placing order..." : "Place order"} {!submitting ? <ArrowRight size={16} aria-hidden="true" /> : null}</Button>
      </div>
    </form>
  );
}
