"use client";

import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/layout/Wordmark";
import { useStore } from "@/components/StoreProvider";
import { navigationLinks } from "@/lib/homeData";

export function Header() {
  const pathname = usePathname();
  // The menu is "open for this page": navigating anywhere closes it without an effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const menuOpen = openOn === pathname;
  const headerRef = useRef<HTMLElement>(null);
  const { cartCount, wishlist, user, openCart, settings } = useStore();
  const accountHref = !user ? "/login" : user.role === "admin" ? "/admin/dashboard" : "/account";
  const accountLabel = !user ? "Sign in" : user.role === "admin" ? "Admin dashboard" : "My account";

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateLogoPosition = () => {
      const styles = window.getComputedStyle(header);
      const horizontalPadding = Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight);
      const availableWidth = Math.max(0, header.clientWidth - horizontalPadding);
      const position = settings?.logoHorizontalPosition ?? 0;
      header.style.setProperty("--logo-horizontal-offset", `${availableWidth * position / 100}px`);
    };

    updateLogoPosition();
    const observer = new ResizeObserver(updateLogoPosition);
    observer.observe(header);
    return () => observer.disconnect();
  }, [settings?.logoHorizontalPosition]);

  return (
    <header ref={headerRef} className="site-header">
      <button
        type="button"
        className="icon-btn mobile-menu"
        onClick={() => setOpenOn(menuOpen ? null : pathname)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="main-nav"
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <div className="header-brand">
        <Wordmark />
        {/* eslint-disable-next-line @next/next/no-img-element -- Bundled brand image is a local static asset. */}
      </div>

      <nav id="main-nav" className={`main-nav${menuOpen ? " nav-open" : ""}`} aria-label="Main navigation">
        {navigationLinks.map(({ href, label }) => {
          const current = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} aria-current={current ? "page" : undefined}>{label}</Link>;
        })}
        <Link className="mobile-only-link" href="/track" aria-current={pathname === "/track" ? "page" : undefined}>Track order</Link>
      </nav>

      <div className="header-actions">
        <Link className="icon-btn" href="/catalog#search" aria-label="Search the catalog">
          <Search size={19} />
        </Link>
        <Link className="icon-btn hide-sm" href={user ? "/account#wishlist" : "/login?next=%2Faccount%23wishlist"} aria-label={user ? `Wishlist, ${wishlist.length} saved` : "Wishlist (sign in to use)"}>
          <Heart size={19} />
          {wishlist.length > 0 ? <span className="count">{wishlist.length}</span> : null}
        </Link>
        <Link className="icon-btn" href={accountHref} aria-label={accountLabel} title={accountLabel}>
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- Google avatar hosts are not configured for next/image
            <img className="account-avatar" src={user.avatar} alt="" referrerPolicy="no-referrer" />
          ) : <UserRound size={19} />}
        </Link>
        <button type="button" className="icon-btn" onClick={() => openCart()} aria-label={`Open bag, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}>
          <ShoppingBag size={20} />
          {cartCount > 0 ? <span className="count">{cartCount}</span> : null}
        </button>
      </div>
    </header>
  );
}
