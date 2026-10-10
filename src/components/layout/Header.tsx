"use client";

import { Menu, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { navigationLinks } from "@/lib/homeData";
import { UserRound } from "lucide-react";


export function Header({ onCartOpen }: { onCartOpen: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount } = useStore();

  return (
    <header className="site-header">
      <button
        className="icon-button mobile-menu"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
      >
        {menuOpen ? <X size={21} /> : <Menu size={21} />}
      </button>

      <Link className="wordmark" href="/" aria-label="Saim Enterprises home page">
        saim <i>enterprises</i>
      </Link>

      <nav className={`main-nav ${menuOpen ? "nav-open" : ""}`} aria-label="Main navigation">
        {navigationLinks.map(({ href, label }) => (
          <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="header-actions">
        <Link className="search-link" href="/catalog" aria-label="Search catalog">
          <Search size={18} />
        </Link>
     <Link
  className="icon-button header-wishlist"
  href="/login"
  aria-label="Admin Login"
>
  <UserRound size={18} />
</Link>
        <button className="bag-button" onClick={onCartOpen} aria-label={`Open cart with ${cartCount} ${cartCount === 1 ? "item" : "items"}`}>
          <ShoppingBag size={19} />
          <span>{cartCount}</span>
        </button>
      </div>
    </header>
  );
}
