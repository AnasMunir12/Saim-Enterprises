"use client";

import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/layout/Wordmark";
import { useStore } from "@/components/StoreProvider";
import { BUSINESS_EMAIL, BUSINESS_PHONE } from "@/lib/constants";

type FooterCategory = { id: string; name: string; slug: string; active?: boolean };

export function Footer() {
  const { settings } = useStore();
  const [categories, setCategories] = useState<FooterCategory[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories", { cache: "no-store" })
      .then(async (response) => (response.ok ? ((await response.json()) as FooterCategory[]) : []))
      .then((data) => {
        if (!cancelled) setCategories(data.filter((category) => category.active !== false).slice(0, 6));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const name = settings?.websiteName || "Saim Enterprises";
  const phone = settings?.phone || BUSINESS_PHONE;
  const email = settings?.contactEmail || BUSINESS_EMAIL;
  const socials = (settings?.socialLinks ?? []).filter((link) => /^https?:\/\//.test(link.url));

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Wordmark />
          <p>Handcrafted décor and custom lighting made for warm, modern living.</p>
        </div>

        <nav className="footer-col" aria-label="Shop">
          <p className="footer-label">Shop</p>
          <Link href="/catalog">All pieces</Link>
          {categories.map((category) => <Link key={category.id} href={`/catalog?category=${category.slug}`}>{category.name}</Link>)}
          <Link href="/catalog?sale=1">On sale</Link>
        </nav>

        <nav className="footer-col" aria-label="Help">
          <p className="footer-label">Help</p>
          <Link href="/shipping">Shipping</Link>
          <Link href="/returns">Returns &amp; exchange</Link>
          <Link href="/faq">FAQs</Link>
          <Link href="/track">Track your order</Link>
          <Link href="/contact">Contact us</Link>
        </nav>

        <div className="footer-col">
          <p className="footer-label">Contact</p>
          {email ? <a href={`mailto:${email}`}><Mail size={15} aria-hidden="true" /> {email}</a> : null}
          {phone ? <a href={`tel:${phone.replace(/\s+/g, "")}`}><Phone size={15} aria-hidden="true" /> {phone}</a> : null}
          {socials.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>)}
          {settings?.address ? <p className="footer-address">{settings.address}</p> : null}
          {settings?.openingHours ? <p className="footer-address">{settings.openingHours}</p> : null}
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {name}</span>
        <span className="footer-legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/about">About</Link></span>
      </div>
    </footer>
  );
}
