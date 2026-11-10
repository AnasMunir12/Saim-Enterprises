"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowRight, ShoppingBag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { CartLines } from "@/components/cart/CartLines";
import { ShippingProgress } from "@/components/cart/ShippingProgress";
import { useStore } from "@/components/StoreProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { formatPrice } from "@/lib/products";


const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// The bag. Browsing, checkout, and order placement are available without an account.
export function CartDrawer() {
  const router = useRouter();
  const { cart, subtotal, removeFromCart, refreshCart, cartOpen, cartIntent, closeCart } = useStore();
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  const purchasable = cart.filter((line) => !line.unavailable);
  const unavailable = cart.filter((line) => line.unavailable);

  // Sign-in links that used to reopen the drawer now land on the dedicated checkout page.
  useEffect(() => {
    if (cartOpen && cartIntent === "checkout") {
      closeCart();
      router.push("/checkout");
    }
  }, [cartOpen, cartIntent, closeCart, router]);

  // Re-check price and stock every time the bag opens, lock page scroll, trap focus, close on Escape.
  useEffect(() => {
    if (!cartOpen) return;
    if (cartIntent === "checkout") return;
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
  }, [cartOpen, cartIntent, refreshCart, closeCart]);

  function startCheckout() {
    closeCart();
    router.push("/checkout");
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {cartOpen && (
          <motion.div className="cart-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeCart}>
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
                  <p className="eyebrow">Your selection</p>
                  <h2 id="cart-title">Shopping bag</h2>
                </div>
                <button ref={closeButton} type="button" className="icon-btn" onClick={closeCart} aria-label="Close bag"><X size={22} /></button>
              </div>

              {cart.length === 0 ? (
                <div className="empty-cart">
                  <ShoppingBag size={34} aria-hidden="true" />
                  <p>Your bag is waiting for something special.</p>
                  <ButtonLink href="/catalog" onClick={closeCart}>Browse the catalog</ButtonLink>
                </div>
              ) : (
                <>
                  <div className="cart-body">
                    {purchasable.length > 0 ? <ShippingProgress subtotal={subtotal} /> : null}
                    <CartLines onNavigate={closeCart} />
                  </div>
                  <div className="cart-summary">
                    <div className="cart-summary__total"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                    <p className="cart-summary__note">Guest checkout is available. Delivery is confirmed before dispatch.</p>
                    {unavailable.length > 0 ? (
                      <Button variant="light" size="lg" block onClick={() => unavailable.forEach((line) => removeFromCart(line.id))}>Remove unavailable items</Button>
                    ) : (
                      <Button size="lg" block onClick={startCheckout} disabled={purchasable.length === 0}>Checkout <ArrowRight size={16} aria-hidden="true" /></Button>
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
