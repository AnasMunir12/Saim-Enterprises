"use client";

import { useEffect, useState } from "react";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { CartDrawer } from "@/components/CartDrawer";
import { HeroSlider } from "@/components/home/HeroSlider";
import { CategorySection } from "@/components/home/CategorySection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { EditorialSection } from "@/components/home/EditorialSection";
import { CustomDesignSection } from "@/components/home/CustomDesignSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { ValueSection } from "@/components/home/ValueSection";
import { NewsletterSection } from "@/components/home/NewsletterSection";

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const [sectionState, setSectionState] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    fetch("/api/content/homepage")
      .then(async (response) => (response.ok ? (await response.json()) as Array<{ key: string; enabled: boolean }> : []))
      .then((sections) => setSectionState(Object.fromEntries(sections.map((section) => [section.key, section.enabled]))) )
      .catch(() => setSectionState(null));
  }, []);

  const enabled = (key: string) => sectionState?.[key] !== false;

  return (
    <main className="site-shell">
      <AnnouncementBar />
      <Header onCartOpen={() => setCartOpen(true)} />
      {enabled("hero") ? <HeroSlider /> : null}
      {enabled("collections") ? <CategorySection /> : null}
      {enabled("featured-products") ? <FeaturedProducts /> : null}
      <EditorialSection />
      <CustomDesignSection />
      <TestimonialsSection />
      <ValueSection />
      <NewsletterSection />
      <Footer />
      <WhatsAppButton />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </main>
  );
}
