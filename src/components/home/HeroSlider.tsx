import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { ButtonLink } from "@/components/ui/Button";
import { StoreImage } from "@/components/ui/StoreImage";

type HeroSlide = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  image: string;
  primaryButtonText?: string;
  primaryButtonUrl?: string;
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
  active?: boolean;
  features?: Array<{ title?: string; description?: string; icon?: string }>;
};

const AUTOPLAY_MS = 3000;

export function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);

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

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setTimeout(() => {
      setActive((current) => (current + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, slides.length]);

  const slide = slides[active];

  if (!slide) {
    if (!loaded) return null;
    return (
      <section className="hero hero--static" aria-label="Saim Enterprises handcrafted décor">
        <StoreImage src="/saim-static-hero-banner.png" alt="Saim Enterprises handcrafted wooden décor and gifts" eager fetchPriority="high" />
        <a className="hero__reference-action" href="/catalog">
          Explore Our Collection <ArrowRight size={16} aria-hidden="true" />
        </a>
      </section>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={slide.id ?? slide.image ?? active}
        className="hero"
        aria-label="Featured collections"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
      >
        <div className="hero__copy">
          <div>
            {slide.eyebrow ? <p className="eyebrow">{slide.eyebrow}</p> : null}
            <h3 className="hero__title">{slide.title}</h3>
            {slide.description ? <p className="hero__lead">{slide.description}</p> : null}
            {slide.features?.length ? (
              <div className="hero__features">
                {slide.features.slice(0, 3).map((feature, index) => (
                  <div className="hero__feature" key={`${feature.title}-${index}`}>
                    <strong>{feature.title}</strong>
                    {feature.description ? <small>{feature.description}</small> : null}
                  </div>
                ))}
              </div>
            ) : null}
            <div className="hero__actions">
              <ButtonLink href={slide.primaryButtonUrl || "/catalog"} size="lg">
                {slide.primaryButtonText || "Explore collection"} <ArrowRight size={16} aria-hidden="true" />
              </ButtonLink>
              {slide.secondaryButtonText && slide.secondaryButtonUrl ? (
                <ArrowLink href={slide.secondaryButtonUrl}>{slide.secondaryButtonText}</ArrowLink>
              ) : null}
            </div>
          </div>
        </div>
        <div className="hero__media">
          <StoreImage src={slide.image} alt={slide.title} sizes="(min-width: 900px) 50vw, 100vw" eager fetchPriority={active === 0 ? "high" : undefined} />
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
