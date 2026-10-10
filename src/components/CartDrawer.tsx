"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowRight, ShoppingBag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CartLines } from "@/components/cart/CartLines";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { OrderConfirmation } from "@/components/cart/OrderConfirmation";
import { ShippingProgress } from "@/components/cart/ShippingProgress";
import { SignInStep } from "@/components/cart/SignInStep";
import { useStore } from "@/components/StoreProvider";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { OrderView } from "@/lib/orders";
import { formatPrice } from "@/lib/products";


type Step = "bag" | "signin" | "details" | "done";

const TITLES: Record<Step, { eyebrow: string; title: string }> = {
  bag: { eyebrow: "Your selection", title: "Shopping bag" },
  signin: { eyebrow: "One quick step", title: "Sign in to order" },
  details: { eyebrow: "Almost there", title: "Your details" },
  done: { eyebrow: "Thank you", title: "Order placed" },
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// The bag. Browsing and adding never need an account; pressing Checkout asks a signed-out visitor to sign in
// (inline, with the bag kept) and takes a signed-in one straight to delivery details.
export function CartDrawer() {
  const router = useRouter();
  const { cart, subtotal, removeFromCart, refreshCart, user, userLoaded, cartOpen, cartIntent, closeCart, settings } = useStore();
  const [step, setStep] = useState<Step>("bag");
  const [notice, setNotice] = useState("");
  const [placed, setPlaced] = useState<OrderView | null>(null);
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  const purchasable = cart.filter((line) => !line.unavailable);
  const unavailable = cart.filter((line) => line.unavailable);

  // Opening the bag after signing in jumps straight to the details step.
  useEffect(() => {
    if (cartOpen && cartIntent === "checkout" && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- respond to the store asking for checkout
      setStep("details");
    }
  }, [cartOpen, cartIntent, user]);

  // Re-check price and stock every time the bag opens, lock page scroll, trap focus, close on Escape.
  useEffect(() => {
    if (!cartOpen) return;
    void refreshCart();
    const opener = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
      if (event.key !== "Tab" || !dialog.current) return;
      const items = [...dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((node) => node.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [cartOpen, refreshCart, closeCart]);

  function close() {
    closeCart();
    // Reset after the exit animation so a finished order does not linger.
    setTimeout(() => {
      setStep("bag");
      setNotice("");
      setPlaced(null);
    }, 350);
  }

  function startCheckout() {
    setNotice("");
    setStep(user ? "details" : "signin");
  }

  const activeStep: Step = step === "done" && !placed ? "bag" : step === "details" && cart.length === 0 ? "bag" : step === "details" && !user ? "signin" : step;
  const heading = TITLES[activeStep];

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {cartOpen && (
          <motion.div className="cart-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
            <motion.aside
              ref={dialog}
              className="cart-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cart-title"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="cart-header">
                <div>
                  <p className="eyebrow">{heading.eyebrow}</p>
                  <h2 id="cart-title">{heading.title}</h2>
                </div>
                <button ref={closeButton} type="button" className="icon-btn" onClick={close} aria-label="Close bag"><X size={22} /></button>
              </div>

              {activeStep === "done" && placed ? (
                <div className="cart-body"><OrderConfirmation order={placed} email={settings?.contactEmail} onClose={close} /></div>
              ) : cart.length === 0 ? (
                <div className="empty-cart">
                  <ShoppingBag size={34} aria-hidden="true" />
                  <p>Your bag is waiting for something special.</p>
                  <ButtonLink href="/catalog" onClick={close}>Browse the catalog</ButtonLink>
                </div>
              ) : activeStep === "signin" ? (
                <div className="cart-body"><SignInStep onBack={() => setStep("bag")} onNavigate={close} /></div>
              ) : activeStep === "details" ? (
                <div className="cart-body">
                  <CheckoutForm
                    onBack={() => setStep("bag")}
                    onOutcome={(outcome) => {
                      if (outcome.kind === "placed") {
                        setPlaced(outcome.order);
                        setStep("done");
                        router.refresh();
                      } else if (outcome.kind === "signed-out") {
                        setStep("signin");
                      } else {
                        setNotice(outcome.message);
                        setStep("bag");
                      }
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="cart-body">
                    {notice ? <Alert>{notice}</Alert> : null}
                    {purchasable.length > 0 ? <ShippingProgress subtotal={subtotal} /> : null}
                    <CartLines onNavigate={close} />
                  </div>
                  <div className="cart-summary">
                    <div className="cart-summary__total"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                    <p className="cart-summary__note">Delivery is confirmed when we review your order.{userLoaded && !user ? " You will sign in or create an account to place it." : ""}</p>
                    {unavailable.length > 0 ? (
                      <Button variant="light" size="lg" block onClick={() => unavailable.forEach((line) => removeFromCart(line.id))}>Remove unavailable items</Button>
                    ) : (
                      <Button size="lg" block onClick={startCheckout} disabled={purchasable.length === 0 || !userLoaded}>Checkout <ArrowRight size={16} aria-hidden="true" /></Button>
                    )}
                  </div>
                </>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
