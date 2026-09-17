"use client";

import { useState } from "react";
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
import { NewsletterSection } from "@/components/home/NewsletterSection";

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  return <main className="site-shell"><AnnouncementBar /><Header onCartOpen={() => setCartOpen(true)} /><HeroSlider /><CategorySection /><FeaturedProducts /><EditorialSection /><CustomDesignSection /><TestimonialsSection /><NewsletterSection /><Footer /><WhatsAppButton /><CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} /></main>;
}
