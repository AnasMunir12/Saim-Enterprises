"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  {
    eyebrow: "Lighting / The new collection",
    title: "Crafted with light & precision.",
    copy: "Warm, sculptural lighting made to turn an ordinary corner into your favourite room.",
    image:
      "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1800&q=90",
  },
  {
    eyebrow: "Studio service / Made to order",
    title: "Your vision, our craftsmanship.",
    copy: "From laser-cut initials to CNC wall art, bring us the idea you have been carrying.",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=90",
  },
  {
    eyebrow: "Home edit / Designed with feeling",
    title: "Objects that make a space feel yours.",
    copy: "Hand-finished details for homes that value texture, quiet colour and a little soul.",
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1800&q=90",
  },
];

export function HeroSlider() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  const goNext = () => {
    setActive((current) => (current + 1) % slides.length);
  };

  const goPrevious = () => {
    setActive(
      (current) => (current - 1 + slides.length) % slides.length
    );
  };

  const slide = slides[active];

  return (
    <section className="hero-slider" id="top">
      {/* LEFT CONTENT */}
      <div className="hero-content">
        <p className="eyebrow">{slide.eyebrow}</p>

        <h1>{slide.title}</h1>

        <p className="hero-copy">{slide.copy}</p>

        <div className="hero-actions">
          <Link className="button button-dark" href="/catalog">
            Explore the collection
            <ArrowRight size={16} />
          </Link>

          <Link className="text-link" href="/contact">
            Start a custom piece
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* SLIDE COUNTER */}
        <div className="hero-controls">
          <span>
            0{active + 1} <i>/ 0{slides.length}</i>
          </span>
        </div>
      </div>

      {/* RIGHT IMAGE */}
      <div className="hero-image">
        <img
          key={slide.image}
          src={slide.image}
          alt="Saim Enterprises handcrafted home décor"
        />

        {/* IMAGE INFO */}
        <div className="image-note">
          <span>0{active + 1}</span>
          <span>Made for slow living</span>
        </div>

        {/* LEFT / RIGHT BUTTONS */}
        <div className="hero-side-controls">
          <button
            type="button"
            onClick={goPrevious}
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next slide"
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  );
}