"use client";

import type { ReactNode } from "react";
import { CartDrawer } from "@/components/CartDrawer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";

export function PageChrome({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <AnnouncementBar />
      <Header />
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer />
      <WhatsAppButton />
      <CartDrawer />
    </div>
  );
}
