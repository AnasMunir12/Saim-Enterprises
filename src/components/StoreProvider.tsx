"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/products";

type CartLine = Product & { quantity: number };
type StoreValue = {
  cart: CartLine[];
  wishlist: string[];
  cartCount: number;
  subtotal: number;
  addToCart: (product: Product) => void;
  toggleWishlist: (id: string) => void;
  changeQuantity: (id: string, change: number) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem("saim-cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem("saim-wishlist");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    window.localStorage.setItem("saim-cart", JSON.stringify(cart));
    window.localStorage.setItem("saim-wishlist", JSON.stringify(wishlist));
  }, [cart, wishlist]);

  const value = useMemo(() => ({
    cart,
    wishlist,
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addToCart: (product: Product) => setCart((items) => items.some((item) => item.id === product.id)
      ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...items, { ...product, quantity: 1 }]),
    toggleWishlist: (id: string) => setWishlist((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]),
    changeQuantity: (id: string, change: number) => setCart((items) => items.map((item) => item.id === id ? { ...item, quantity: item.quantity + change } : item).filter((item) => item.quantity > 0)),
  }), [cart, wishlist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
