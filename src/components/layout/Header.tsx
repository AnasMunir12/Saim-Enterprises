"use client";

import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/components/StoreProvider";

export function Header({ onCartOpen }: { onCartOpen: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount, wishlist } = useStore();
  const links = [["Home", "/"], ["Catalog", "/catalog"], ["About us", "/about"], ["Contact", "/contact"]];
  return <header className="site-header">
    <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
    <Link className="wordmark" href="/">saim <i>enterprises</i></Link>
    <nav className={`main-nav ${menuOpen ? "nav-open" : ""}`}>{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>)}</nav>
    <div className="header-actions"><Link className="search-link" href="/catalog" aria-label="Search catalog"><Search size={19} /></Link><Link className="icon-button header-wishlist" href="/catalog" aria-label={`Wishlist with ${wishlist.length} items`}><Heart size={19} fill={wishlist.length ? "currentColor" : "none"} /></Link><button className="bag-button" onClick={onCartOpen} aria-label={`Open cart with ${cartCount} items`}><ShoppingBag size={20} /><span>{cartCount}</span></button></div>
  </header>;
}
