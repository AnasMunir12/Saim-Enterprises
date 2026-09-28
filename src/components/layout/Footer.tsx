"use client";

import { Camera } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type FooterSettings = {
  websiteName: string;
  contactEmail: string;
  phone: string;
  whatsapp: string;
};

export function Footer() {
  const [settings, setSettings] = useState<FooterSettings | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as FooterSettings;
        setSettings(data);
      } catch {
        setSettings(null);
      }
    }

    void loadSettings();
  }, []);

  const currentSettings = settings ?? { websiteName: "", contactEmail: "", phone: "", whatsapp: "" };

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <Link className="wordmark footer-mark" href="/" aria-label="Saim Enterprises home page">
            saim <i>enterprises</i>
          </Link>
          <p>Handcrafted décor and custom lighting made for warm, modern living.</p>
        </div>

        <div>
          <p className="footer-label">Explore</p>
          <Link href="/">Home</Link>
          <Link href="/catalog">Catalog</Link>
          <Link href="/about">About us</Link>
          <Link href="/contact">Contact</Link>
        </div>

        <div>
          <p className="footer-label">Collections</p>
          <Link href="/catalog">Hanging lights</Link>
          <Link href="/catalog">Wall décor</Link>
          <Link href="/catalog">Custom designs</Link>
          <Link href="/catalog">Ramadan collection</Link>
        </div>

        <div>
          <p className="footer-label">Contact</p>
          {currentSettings.contactEmail ? <a href={`mailto:${currentSettings.contactEmail}`}>{currentSettings.contactEmail}</a> : null}
          {currentSettings.phone ? <a href={`tel:${currentSettings.phone.replace(/\s+/g, "")}`}>{currentSettings.phone}</a> : null}
          {currentSettings.whatsapp ? <a href={`https://wa.me/${currentSettings.whatsapp.replace(/\D/g, "")}`}>WhatsApp</a> : null}
          <a href="#top">
            <Camera size={16} /> Instagram
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 {currentSettings.websiteName}</span>
        <span>Thoughtfully made in Pakistan</span>
        <span>Privacy • Refunds • Shipping • Terms</span>
      </div>
    </footer>
  );
}
