"use client";

import { useState, type ReactNode } from "react";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";

export function PageChrome({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  return <main className="site-shell"><AnnouncementBar /><Header onCartOpen={() => setCartOpen(true)} />{children}<Footer /><WhatsAppButton /><CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} /></main>;
}
