"use client";

import { Star } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { NO_COPY, type HomeSectionCopy } from "@/lib/homepage-sections";

type Testimonial = { id?: string; name: string; role: string; quote: string; image?: string; rating?: number; active?: boolean };

// Shows up to three active, distinct testimonials the owner has entered. Nothing is invented, and nothing is
// labelled "verified" because the shop cannot check that a quote came from a buyer.
export function TestimonialsSection({ copy = NO_COPY }: { copy?: HomeSectionCopy }) {
  const [items, setItems] = useState<Testimonial[]>([]);

  useEffect(() => {
    fetch("/api/testimonials", { cache: "no-store" })
      .then(async (response) => (response.ok ? ((await response.json()) as Testimonial[]) : []))
      .then((list) => {
        const seen = new Set<string>();
        const unique = list.filter((item) => {
          const key = item.quote.trim().toLowerCase();
          if (item.active === false || !key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setItems(unique.slice(0, 3));
      })
      .catch(() => setItems([]));
  }, []);

  if (!items.length) return null;

  return (
    <section className="section testimonials" aria-labelledby="testimonials-heading">
      <SectionHeading id="testimonials-heading" eyebrow={copy.subtitle || "Kind words"} title="In their words." />
      <div className="testimonial-grid" data-count={items.length} style={{ "--cols": items.length } as CSSProperties}>
        {items.map((item) => (
          <figure className="testimonial" key={item.id ?? item.quote}>
            {item.rating ? (
              <div className="testimonial__stars" role="img" aria-label={`${item.rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={15} fill={n <= (item.rating ?? 0) ? "currentColor" : "none"} aria-hidden="true" />)}
              </div>
            ) : null}
            <blockquote>“{item.quote}”</blockquote>
            <figcaption>
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- owner-supplied avatar from any host
                <img src={item.image} alt="" width={40} height={40} loading="lazy" />
              ) : null}
              <div>{item.name}{item.role ? <> <span>· {item.role}</span></> : null}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
