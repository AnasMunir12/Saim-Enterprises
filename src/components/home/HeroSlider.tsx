"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton, SkeletonLine } from "@/components/ui/Skeleton";

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

const AUTOPLAY_MS = 6000;

export function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/content/hero", { cache: "no-store" })
      .then(async (response) => (response.ok ? ((await response.json()) as HeroSlide[]) : []))
      .then((data) => {
        if (mounted) setSlides((data ?? []).filter((slide) => slide.active !== false));
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Autoplay stops while the visitor hovers or focuses the hero, and never runs for reduced-motion visitors.
  useEffect(() => {
    if (slides.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setActive((current) => (current + 1) % slides.length), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, slides.length, paused]);

  const go = (step: number) => setActive((current) => (current + step + slides.length) % slides.length);
  const slide = slides[active];

  if (!slide) {
    if (!loaded) {
      return (
        <section className="hero hero--loading" aria-busy="true" aria-label="Loading featured collection">
          <Skeleton className="hero__media" />
          <div className="hero__copy"><SkeletonLine wide /><SkeletonLine /></div>
        </section>
      );
    }
    // No slides published: a plain brand hero keeps the page useful.
    return (
      <section className="hero hero--plain">
        <div className="hero__copy">
          <p className="eyebrow">Saim Enterprises</p>
          <h4 className="hero__title">Objects with <em>a little soul.</em></h4>
          <p className="hero__lead">Handcrafted lighting, décor and custom pieces, made in our Lahore studio.</p>
          <div className="hero__actions">
            <ButtonLink href="/catalog" size="lg">Shop the collection <ArrowRight size={16} aria-hidden="true" /></ButtonLink>
            <ArrowLink href="/contact">Start a custom piece</ArrowLink>
          </div>
        </div>
      </section>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <section
        className="hero"
        aria-roledescription="carousel"
        aria-label="Featured collections"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            go(-1);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            go(1);
          }
        }}
      >
        <div className="hero__copy">
          <AnimatePresence mode="sync">
            <motion.div
              key={slide.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              aria-live="polite"
            >
              <p className="eyebrow">{slide.eyebrow}</p>
              <h3 className="hero__title">{slide.title}</h3>
              <p className="hero__lead">{slide.description}</p>
              <div className="hero__actions">
                <ButtonLink href={slide.primaryButtonUrl || "/catalog"} size="lg">
                  {slide.primaryButtonText || "Explore collection"} <ArrowRight size={16} aria-hidden="true" />
                </ButtonLink>
                <ArrowLink href={slide.secondaryButtonUrl || "/contact"}>{slide.secondaryButtonText || "Start a custom piece"}</ArrowLink>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hero__media">
          <AnimatePresence mode="popLayout">
            <motion.img
              key={slide.image}
              src={slide.image}
              alt={slide.title}
              fetchPriority={active === 0 ? "high" : undefined}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </AnimatePresence>

          {slides.length > 1 ? (
            <div className="hero__controls">
              <button type="button" className="icon-btn hero__arrow hero__arrow--previous" onClick={() => go(-1)} aria-label="Previous slide"><ChevronLeft size={20} /></button>
              <div className="hero__dots" role="group" aria-label="Choose a slide">
                {slides.map((item, index) => (
                  <button type="button" className="hero__dot" key={item.id ?? item.title} onClick={() => setActive(index)} aria-label={`Show slide ${index + 1} of ${slides.length}`} aria-current={index === active}>
                    <i />
                  </button>
                ))}
              </div>
              <button type="button" className="icon-btn hero__arrow hero__arrow--next" onClick={() => go(1)} aria-label="Next slide"><ChevronRight size={20} /></button>
            </div>
          ) : null}
        </div>
      </section>
    </MotionConfig>
  );
}
