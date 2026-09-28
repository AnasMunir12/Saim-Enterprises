"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type HeroSlide = {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  primaryButtonText?: string;
  primaryButtonUrl?: string;
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
  active?: boolean;
};

export function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadSlides() {
      try {
        const response = await fetch("/api/content/hero");
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as HeroSlide[];
        const activeSlides = (data ?? []).filter((slide) => slide.active !== false);

        if (mounted) {
          setSlides(activeSlides);
          setActive(0);
        }
      } catch {
        if (mounted) setSlides([]);
      }
    }

    void loadSlides();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!slides.length) {
      return;
    }

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [slides]);

  const goNext = () => {
    setActive((current) => (current + 1) % slides.length);
  };

  const goPrevious = () => {
    setActive((current) => (current - 1 + slides.length) % slides.length);
  };

  const slide = slides[active];

  if (!slide) {
    return <section className="hero-slider" id="top"><div className="hero-content"><p className="eyebrow">Saim Enterprises</p><p className="hero-copy">Loading the latest collection...</p></div></section>;
  }

  return (
    <section className="hero-slider" id="top">
      <div className="hero-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p className="eyebrow">{slide.eyebrow}</p>
            <h1>{slide.title}</h1>
            <p className="hero-copy">{slide.description}</p>

            <div className="hero-actions">
              <Link className="button button-dark" href={slide.primaryButtonUrl ?? "/catalog"}>
                {slide.primaryButtonText ?? "Explore collection"}
                <ArrowRight size={16} />
              </Link>

              <Link className="text-link" href={slide.secondaryButtonUrl ?? "/contact"}>
                {slide.secondaryButtonText ?? "Start a custom piece"}
                <ArrowRight size={15} />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="hero-controls" aria-live="polite">
          <span>
            0{active + 1} <i>/ 0{slides.length || 1}</i>
          </span>
        </div>
      </div>

      <div className="hero-visual">
        <div className="hero-image-frame">
          <AnimatePresence mode="wait">
            <motion.img
              key={slide.image}
              src={slide.image}
              alt={slide.title}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </AnimatePresence>
        </div>

        <div className="image-note">
          <span>0{active + 1}</span>
          <span>Handcrafted for modern living</span>
        </div>

        <div className="hero-side-controls" aria-label="Hero slide controls">
          <button type="button" onClick={goPrevious} aria-label="Previous slide">
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <button type="button" onClick={goNext} aria-label="Next slide">
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  );
}