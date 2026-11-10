"use client";

import { ArrowLeft, ArrowRight, Truck } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useStore } from "@/components/StoreProvider";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextArea, TextField } from "@/components/ui/FormField";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import type { OrderView } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

type Outcome = { kind: "placed"; order: OrderView } | { kind: "stock-changed"; message: string };
type CheckoutDetails = { fullName: string; email: string; phone: string; address: string; city: string; postalCode: string };
type CheckoutState = { details: CheckoutDetails; saveDetails: boolean; hasSavedDetails: boolean; detailsReady: boolean };

const SAVED_DETAILS_KEY = "saim-checkout-details";
const EMPTY_DETAILS: CheckoutDetails = { fullName: "", email: "", phone: "", address: "", city: "", postalCode: "" };

function readSavedDetails(): CheckoutDetails | null {
  try {
    const raw = window.localStorage.getItem(SAVED_DETAILS_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<CheckoutDetails>;
    if (typeof value.fullName !== "string" || typeof value.phone !== "string" || typeof value.address !== "string" || typeof value.city !== "string") {
      return null;
    }
    return {
      fullName: value.fullName,
      email: typeof value.email === "string" ? value.email : "",
      phone: value.phone,
      address: value.address,
      city: value.city,
      postalCode: typeof value.postalCode === "string" ? value.postalCode : "",
    };
  } catch {
    return null;
  }
}

// Only product ids and quantities are sent; the server reads names, prices, and stock from the database.
export function CheckoutForm({ onBack, onOutcome }: { onBack: () => void; onOutcome: (outcome: Outcome) => void }) {
  const { cart, subtotal, user, userLoaded, refreshCart, clearCart, setCheckoutDetails } = useStore();
  const [checkout, setCheckout] = useState<CheckoutState>({
    details: EMPTY_DETAILS,
    saveDetails: false,
    hasSavedDetails: false,
    detailsReady: false,
  });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CheckoutDetails, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const checkoutRequestId = useRef("");
  const purchasable = cart.filter((line) => !line.unavailable);

  useEffect(() => {
    if (!userLoaded) return;
    const saved = user?.checkoutDetails
      ? {
          fullName: user.checkoutDetails.fullName ?? user.name,
          email: user.email,
          phone: user.checkoutDetails.phone ?? "",
          address: user.checkoutDetails.address ?? "",
          city: user.checkoutDetails.city ?? "",
          postalCode: user.checkoutDetails.postalCode ?? "",
        }
      : readSavedDetails();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate saved details after account data loads
    setCheckout({
      details: saved ?? { ...EMPTY_DETAILS, fullName: user?.name ?? "", email: user?.email ?? "" },
      saveDetails: Boolean(saved),
      hasSavedDetails: Boolean(saved),
      detailsReady: true,
    });
  }, [user, userLoaded]);

  function updateDetails(field: keyof CheckoutDetails, value: string) {
    setCheckout((current) => ({ ...current, details: { ...current.details, [field]: value } }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError("");
  }

  async function forgetSavedDetails() {
    setError("");
    if (user) {
      try {
        const response = await fetch("/api/account/me", { method: "DELETE" });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { message?: string };
          setError(data.message ?? "We could not remove your saved details. Please try again.");
          return;
        }
        setCheckoutDetails(null);
      } catch {
        setError("Unable to reach the server. Please try again.");
        return;
      }
    }
    try {
      window.localStorage.removeItem(SAVED_DETAILS_KEY);
    } catch {
      setError("This browser could not remove the saved details. Check your browser storage settings.");
      return;
    }
    setCheckout({
      details: { ...EMPTY_DETAILS, fullName: user?.name ?? "", email: user?.email ?? "" },
      saveDetails: false,
      hasSavedDetails: false,
      detailsReady: true,
    });
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    if (!checkout.detailsReady) {
      setError("Your saved details are still loading. Please try again in a moment.");
      return;
    }
    const digits = checkout.details.phone.replace(/\D/g, "");
    const nextFieldErrors: Partial<Record<keyof CheckoutDetails, string>> = {};
    if (checkout.details.fullName.trim().length < 2) nextFieldErrors.fullName = "Enter your full name.";
    if (!user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkout.details.email.trim())) nextFieldErrors.email = "Enter a valid email address.";
    if (!/^\+?[0-9\s()-]{7,20}$/.test(checkout.details.phone.trim()) || digits.length < 7 || digits.length > 15) {
      nextFieldErrors.phone = "Enter a valid phone number, including your country code.";
    }
    if (checkout.details.address.trim().length < 5) nextFieldErrors.address = "Enter your complete street address.";
    if (checkout.details.city.trim().length < 2) nextFieldErrors.city = "Enter your city.";
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      setError("Please check the highlighted details.");
      return;
    }
    submitLock.current = true;
    setError("");
    setSubmitting(true);

    try {
      if (!checkoutRequestId.current) checkoutRequestId.current = crypto.randomUUID();
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: purchasable.map((item) => ({ productId: item.id, quantity: item.quantity })),
          fullName: checkout.details.fullName,
          email: checkout.details.email,
          phone: checkout.details.phone,
          address: checkout.details.address,
          city: checkout.details.city,
          postalCode: checkout.details.postalCode,
          notes,
          saveDetails: checkout.saveDetails,
          checkoutRequestId: checkoutRequestId.current,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { order?: OrderView; message?: string };
      if (response.status === 409) {
        await refreshCart();
        onOutcome({ kind: "stock-changed", message: data.message ?? "Some items in your bag are no longer available." });
        return;
      }
      if (!response.ok || !data.order) {
        setError(data.message ?? "We could not place your order. Please try again.");
        return;
      }

      try {
        if (!user && checkout.saveDetails) {
          window.localStorage.setItem(SAVED_DETAILS_KEY, JSON.stringify(checkout.details));
        } else {
          window.localStorage.removeItem(SAVED_DETAILS_KEY);
        }
      } catch {
        // A successful order should not be reported as failed because browser storage is unavailable.
      }
      if (user) {
        setCheckoutDetails(
          checkout.saveDetails
            ? {
                fullName: checkout.details.fullName,
                phone: checkout.details.phone,
                address: checkout.details.address,
                city: checkout.details.city,
                ...(checkout.details.postalCode ? { postalCode: checkout.details.postalCode } : {}),
              }
            : null,
        );
      }
      clearCart();
      onOutcome({ kind: "placed", order: data.order });
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form className="checkout-form" onSubmit={placeOrder} noValidate>
      <button type="button" className="cart-back checkout-form__back" onClick={onBack}><ArrowLeft size={14} aria-hidden="true" /> Back to bag</button>
      <div className="checkout-form__intro">
        <p className="eyebrow">Almost there</p>
        <h2>Delivery details</h2>
      </div>
      <p className="checkout-note checkout-form__note">
        {!checkout.detailsReady ? "Preparing your saved details..." : user ? <>Ordering with <strong>{user.email}</strong>. No payment is taken online; we contact you to confirm your order and arrange delivery.</> : <>Checkout as a guest. Use a Google account with this same verified email later to add this order to your dashboard.</>}
      </p>
      <div className="checkout-fields">
        <TextField label="Full name" value={checkout.details.fullName} onChange={(event) => updateDetails("fullName", event.target.value)} autoComplete="name" maxLength={100} required placeholder="Your full name" disabled={!checkout.detailsReady} error={fieldErrors.fullName} />
        {!user ? <TextField label="Email" type="email" value={checkout.details.email} onChange={(event) => updateDetails("email", event.target.value)} autoComplete="email" maxLength={254} required placeholder="you@example.com" disabled={!checkout.detailsReady} error={fieldErrors.email} /> : null}
        <TextField label="Phone" type="tel" value={checkout.details.phone} onChange={(event) => updateDetails("phone", event.target.value)} inputMode="tel" autoComplete="tel" maxLength={20} required placeholder="+92 300 1234567" hint="We call or message this number to confirm your order." disabled={!checkout.detailsReady} error={fieldErrors.phone} />
        <TextArea label="Street address" value={checkout.details.address} onChange={(event) => updateDetails("address", event.target.value)} rows={2} maxLength={500} required autoComplete="street-address" placeholder="House number, street, area" disabled={!checkout.detailsReady} error={fieldErrors.address} />
        <TextField label="City" value={checkout.details.city} onChange={(event) => updateDetails("city", event.target.value)} autoComplete="address-level2" maxLength={100} required placeholder="City" disabled={!checkout.detailsReady} error={fieldErrors.city} />
        <TextField label="Postal code (optional)" value={checkout.details.postalCode} onChange={(event) => updateDetails("postalCode", event.target.value)} autoComplete="postal-code" maxLength={20} placeholder="Postal code" disabled={!checkout.detailsReady} />
        <TextArea label="Notes (optional)" value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} maxLength={1000} placeholder="Custom sizing, finishes, delivery timing" disabled={!checkout.detailsReady} />
        <div className="checkout-save">
          <label>
            <input type="checkbox" checked={checkout.saveDetails} onChange={(event) => setCheckout((current) => ({ ...current, saveDetails: event.target.checked }))} disabled={!checkout.detailsReady} />
            <span>Save my details for next time</span>
          </label>
          {checkout.hasSavedDetails ? <button type="button" className="checkout-save__remove" onClick={() => void forgetSavedDetails()} disabled={!checkout.detailsReady}>Forget saved details</button> : null}
        </div>
      </div>
      <aside className="checkout-summary" aria-label="Order summary">
        <h2>Order summary</h2>
        <ul className="checkout-items" aria-label="Items in this order">
          {purchasable.map((item) => <li key={item.id}><span>{item.name} <small>x {item.quantity}</small></span><span>{formatPrice(item.price * item.quantity)}</span></li>)}
        </ul>
        <div className="cart-summary cart-summary--flat">
          <div className="cart-summary__total"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
          <p className="cart-summary__note"><Truck size={15} aria-hidden="true" /> {subtotal >= FREE_SHIPPING_THRESHOLD ? "Free delivery applies to this order." : "Delivery is confirmed when we review your order."}</p>
          <p className="checkout-summary__payment">No online payment is taken at checkout. We will contact you to confirm payment and delivery.</p>
          {error ? <Alert>{error}</Alert> : null}
          <Button type="submit" size="lg" block loading={submitting} disabled={submitting || !checkout.detailsReady || purchasable.length === 0}>{submitting ? "Placing order..." : "Place order"} {!submitting ? <ArrowRight size={16} aria-hidden="true" /> : null}</Button>
        </div>
      </aside>
    </form>
  );
}
