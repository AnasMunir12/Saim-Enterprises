"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { isSoldOut, maxOrderQuantity, type Product } from "@/lib/products";
import { authHref, CHECKOUT_PARAM } from "@/lib/auth-redirect";
import { normalizeWhatsapp } from "@/lib/whatsapp";

// Only what the bag needs is persisted. Stock and price are re-checked against the server (refreshCart).
export type CartLine = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  category: string;
  /** Units on hand as last seen from the server. Undefined for bags saved before stock existed. */
  stock?: number;
  quantity: number;
  /** True when the product is sold out, deleted or hidden. Such lines cannot be ordered. */
  unavailable?: boolean;
  /** Set when the quantity was reduced to match stock. */
  adjustedTo?: number;
};

export type SiteSettings = {
  websiteName: string;
  logo: string;
  logoDesktopWidth: number;
  logoMobileWidth: number;
  logoMaxHeight: number;
  logoObjectFit: "contain" | "cover";
  contactEmail: string;
  phone: string;
  whatsapp: string;
  showWhatsappButton: boolean;
  address: string;
  openingHours: string;
  announcement: string;
  socialLinks: { label: string; url: string }[];
};

function toSiteSettings(data: Partial<SiteSettings>): SiteSettings {
  return {
    websiteName: data.websiteName ?? "",
    logo: data.logo ?? "",
    logoDesktopWidth: typeof data.logoDesktopWidth === "number" && Number.isInteger(data.logoDesktopWidth) && data.logoDesktopWidth >= 64 && data.logoDesktopWidth <= 320 ? data.logoDesktopWidth : 220,
    logoMobileWidth: typeof data.logoMobileWidth === "number" && Number.isInteger(data.logoMobileWidth) && data.logoMobileWidth >= 48 && data.logoMobileWidth <= 240 ? data.logoMobileWidth : 160,
    logoMaxHeight: typeof data.logoMaxHeight === "number" && Number.isInteger(data.logoMaxHeight) && data.logoMaxHeight >= 24 && data.logoMaxHeight <= 56 ? data.logoMaxHeight : 48,
    logoObjectFit: data.logoObjectFit === "cover" ? "cover" : "contain",
    contactEmail: data.contactEmail ?? "",
    phone: data.phone ?? "",
    whatsapp: data.whatsapp ?? "",
    showWhatsappButton: data.showWhatsappButton !== false,
    address: data.address ?? "",
    openingHours: data.openingHours ?? "",
    announcement: data.announcement ?? "",
    socialLinks: Array.isArray(data.socialLinks) ? data.socialLinks : [],
  };
}

export type AddResult = "added" | "sold_out" | "limit";

export type StoreUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  avatar?: string | null;
};

type StoreValue = {
  cart: CartLine[];
  settings: SiteSettings | null;
  syncSettings: (settings: Partial<SiteSettings>) => void;
  /** Digits-only WhatsApp number (admin setting, normalised, with a built-in fallback). */
  whatsappNumber: string;
  cartOpen: boolean;
  /** Set when the bag was opened to continue checkout (for example right after signing in). */
  cartIntent: "checkout" | null;
  openCart: (intent?: "checkout") => void;
  closeCart: () => void;
  refreshCart: () => Promise<void>;
  notify: (message: string, action?: { label: string; onClick: () => void }) => void;
  removeFromCart: (id: string) => void;
  wishlist: string[];
  user: StoreUser | null;
  userLoaded: boolean;
  cartCount: number;
  subtotal: number;
  addToCart: (product: Product, quantity?: number) => AddResult;
  toggleWishlist: (id: string) => void;
  changeQuantity: (id: string, change: number) => void;
  clearCart: () => void;
  signOut: () => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

function loginUrl() {
  return authHref("login", `${window.location.pathname}${window.location.search}`);
}

function sanitizeLine(raw: unknown): CartLine | null {
  const line = raw as Partial<CartLine> | null;
  if (!line || typeof line.id !== "string" || typeof line.name !== "string") return null;
  const quantity = Math.floor(Number(line.quantity));
  const price = Number(line.price);
  if (!Number.isFinite(quantity) || quantity < 1 || !Number.isFinite(price)) return null;
  const stock = typeof line.stock === "number" && Number.isFinite(line.stock) ? Math.max(0, Math.floor(line.stock)) : undefined;
  return {
    id: line.id,
    slug: typeof line.slug === "string" ? line.slug : "",
    name: line.name,
    price,
    compareAtPrice: typeof line.compareAtPrice === "number" && line.compareAtPrice > price ? line.compareAtPrice : undefined,
    image: typeof line.image === "string" ? line.image : "",
    category: typeof line.category === "string" ? line.category : "",
    stock,
    quantity: Math.min(99, quantity),
    unavailable: line.unavailable === true ? true : undefined,
  };
}

type CheckedLine = { productId: string; name: string; image: string; price: number; compareAtPrice?: number; stock: number; quantity: number; state: string };

export function StoreProvider({ children, initialSettings = null }: { children: ReactNode; initialSettings?: SiteSettings | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartIntent, setCartIntent] = useState<"checkout" | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [user, setUser] = useState<StoreUser | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(initialSettings);
  const [toast, setToast] = useState<{ id: number; message: string; action?: { label: string; onClick: () => void } } | null>(null);
  const userRef = useRef<StoreUser | null>(null);
  const cartRef = useRef<CartLine[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRevision = useRef(0);
  const syncSettings = useCallback((data: Partial<SiteSettings>) => {
    settingsRevision.current += 1;
    setSettings(toSiteSettings(data));
  }, []);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Cart lives in this browser; hydrate after mount so server and client markup match.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("saim-cart");
      if (saved) {
        const parsed = JSON.parse(saved) as unknown;
        if (Array.isArray(parsed)) {
          const lines = parsed.map(sanitizeLine).filter((line): line is CartLine => line !== null);
          // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
          setCart(lines);
        }
      }
      window.localStorage.removeItem("saim-wishlist"); // legacy, wishlist is now per-account
    } catch {
      // ignore corrupt storage
    }
    setCartReady(true);
  }, []);

  useEffect(() => {
    if (!cartReady) return;
    try {
      window.localStorage.setItem("saim-cart", JSON.stringify(cart));
    } catch {
      // storage unavailable
    }
  }, [cart, cartReady]);

  // Public shop settings (WhatsApp, email, phone) arrive with the server render and are re-read once in the
  // browser so a long-lived tab picks up edits made in the admin Settings page.
  useEffect(() => {
    let cancelled = false;
    const revision = settingsRevision.current;
    fetch("/api/settings", { cache: "no-store" })
      .then(async (response) => (response.ok ? ((await response.json()) as Partial<SiteSettings>) : null))
      .then((data) => {
        if (cancelled || !data || revision !== settingsRevision.current) return;
        setSettings(toSiteSettings(data));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the session user, then their wishlist. Re-checked on every route change because this
  // provider lives in the root layout and survives sign-in / sign-out navigations.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/account/me", { cache: "no-store" });
        const data = (await response.json()) as { user: StoreUser | null };
        if (cancelled) return;
        const previousId = userRef.current?.id ?? null;
        const nextUser = data.user ?? null;
        setUser(nextUser);
        setUserLoaded(true);
        if (!nextUser) {
          setWishlist([]);
        } else if (nextUser.id !== previousId) {
          const wl = await fetch("/api/wishlist", { cache: "no-store" });
          if (wl.ok && !cancelled) {
            const list = (await wl.json()) as { productIds?: string[] };
            setWishlist(list.productIds ?? []);
          }
        }
      } catch {
        if (!cancelled) setUserLoaded(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const toggleWishlist = useCallback(
    (id: string) => {
      if (!userRef.current) {
        router.push(loginUrl());
        return;
      }
      // Optimistic update, reconciled with the server's answer.
      setWishlist((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]));
      void (async () => {
        try {
          const response = await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: id }),
          });
          if (response.status === 401) {
            setUser(null);
            setWishlist([]);
            router.push(loginUrl());
            return;
          }
          if (!response.ok) throw new Error("wishlist failed");
          const data = (await response.json()) as { productIds: string[] };
          setWishlist(data.productIds);
        } catch {
          // Roll back by re-reading the truth.
          try {
            const wl = await fetch("/api/wishlist", { cache: "no-store" });
            if (wl.ok) setWishlist(((await wl.json()) as { productIds: string[] }).productIds);
          } catch {
            // offline
          }
        }
      })();
    },
    [router],
  );

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // The bag belongs to this browser, not the account, so it stays; the wishlist is per account.
      setUser(null);
      setWishlist([]);
      router.push("/");
      router.refresh();
    }
  }, [router]);

  const notify = useCallback((message: string, action?: { label: string; onClick: () => void }) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, action });
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  }, []);

  const openCart = useCallback((intent?: "checkout") => {
    setToast(null);
    setCartIntent(intent ?? null);
    setCartOpen(true);
  }, []);
  const closeCart = useCallback(() => {
    setCartOpen(false);
    setCartIntent(null);
  }, []);

  // Re-reads price and stock from the server and corrects the bag: quantities are clamped to what is
  // available and lines that were sold out or removed are flagged. Network failures leave the bag as is.
  const refreshCart = useCallback(async () => {
    const lines = cartRef.current;
    if (lines.length === 0) return;
    try {
      const response = await fetch("/api/orders/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines.map((line) => ({ productId: line.id, quantity: Math.min(99, Math.max(1, line.quantity)) })) }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { lines?: CheckedLine[] };
      const fresh = new Map((data.lines ?? []).map((line) => [line.productId, line]));
      setCart((current) =>
        current.map((line) => {
          const checked = fresh.get(line.id);
          if (!checked) return line;
          if (checked.state === "unavailable" || checked.state === "out_of_stock") {
            return { ...line, stock: 0, unavailable: true, adjustedTo: undefined };
          }
          const quantity = Math.min(line.quantity, checked.stock);
          return {
            ...line,
            name: checked.name || line.name,
            image: checked.image || line.image,
            price: checked.price,
            compareAtPrice: checked.compareAtPrice,
            stock: checked.stock,
            quantity,
            unavailable: undefined,
            adjustedTo: quantity < line.quantity ? quantity : undefined,
          };
        }),
      );
    } catch {
      // offline: keep what we have, the server re-checks at checkout anyway
    }
  }, []);

  // Keep a returning visitor's saved bag honest as soon as it is loaded.
  useEffect(() => {
    if (cartReady && cartRef.current.length > 0) void refreshCart();
  }, [cartReady, refreshCart]);

  // Coming back from sign-in with ?checkout=1: reopen the bag at the checkout step and tidy the address bar.
  useEffect(() => {
    if (!cartReady || !userLoaded || !user) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get(CHECKOUT_PARAM) !== "1") return;
    url.searchParams.delete(CHECKOUT_PARAM);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    if (cartRef.current.length > 0) openCart("checkout");
  }, [cartReady, userLoaded, user, openCart]);

  const addToCart = useCallback(
    (product: Product, quantity = 1): AddResult => {
      if (isSoldOut(product)) {
        notify(`${product.name} is sold out.`);
        return "sold_out";
      }
      const max = maxOrderQuantity(product);
      const existing = cartRef.current.find((line) => line.id === product.id);
      const have = existing && !existing.unavailable ? existing.quantity : 0;
      const wanted = Math.max(1, Math.floor(quantity));
      const next = Math.min(max, have + wanted);
      if (next <= have) {
        notify(`You already have all ${max} available in your bag.`, { label: "View bag", onClick: () => openCart() });
        return "limit";
      }
      setCart((items) =>
        items.some((item) => item.id === product.id)
          ? items.map((item) => (item.id === product.id ? { ...item, price: product.price, compareAtPrice: product.compareAtPrice, stock: product.stock, quantity: next, unavailable: undefined, adjustedTo: undefined } : item))
          : [
              ...items,
              {
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                image: product.image,
                category: product.category,
                stock: product.stock,
                quantity: next,
              },
            ],
      );
      notify(next < have + wanted ? `Added. Only ${max} of ${product.name} available.` : `${product.name} added to your bag.`, { label: "View bag", onClick: () => openCart() });
      return "added";
    },
    [notify, openCart],
  );

  const value = useMemo(() => {
    const purchasable = cart.filter((line) => !line.unavailable);
    return {
      cart,
      settings,
      syncSettings,
      whatsappNumber: normalizeWhatsapp(settings?.whatsapp),
      cartOpen,
      cartIntent,
      openCart,
      closeCart,
      refreshCart,
      notify,
      wishlist,
      user,
      userLoaded,
      cartCount: purchasable.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: purchasable.reduce((sum, item) => sum + item.price * item.quantity, 0),
      addToCart,
      toggleWishlist,
      changeQuantity: (id: string, change: number) =>
        setCart((items) =>
          items
            .map((item) => {
              if (item.id !== id || item.unavailable) return item;
              const ceiling = item.stock === undefined ? 99 : Math.min(99, item.stock);
              return { ...item, quantity: Math.min(ceiling, item.quantity + change), adjustedTo: undefined };
            })
            .filter((item) => item.quantity > 0),
        ),
      removeFromCart: (id: string) => setCart((items) => items.filter((item) => item.id !== id)),
      clearCart: () => setCart([]),
      signOut,
    };
  }, [cart, settings, syncSettings, cartOpen, cartIntent, openCart, closeCart, refreshCart, notify, wishlist, user, userLoaded, addToCart, toggleWishlist, signOut]);

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div className="store-toast-region" role="status" aria-live="polite">
        {toast ? (
          <div className="store-toast" key={toast.id}>
            <span>{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  setToast(null);
                }}
              >
                {toast.action.label}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
