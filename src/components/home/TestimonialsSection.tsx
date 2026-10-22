"use client";

import { Quote, Star, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { NO_COPY, type HomeSectionCopy } from "@/lib/homepage-sections";

type Testimonial = {
  id?: string;
  name: string;
  role: string;
  quote: string;
  image?: string;
  rating?: number;
  active?: boolean;
};

const CARD_GAP_FALLBACK = 22;
const LONG_QUOTE_LENGTH = 80;

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function visibleCapacity(width: number, gap: number) {
  if (width < 560) return 1;
  if (width < 850) return 2;
  return Math.min(5, Math.max(1, Math.floor((width + gap) / (220 + gap))));
}

function TestimonialCard({ item }: { item: Testimonial }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogTitleId = useId();
  const [imageFailed, setImageFailed] = useState(false);
  const canReadMore = item.quote.length > LONG_QUOTE_LENGTH;

  return (
    <figure className="testimonial">
      <div className="testimonial__topline">
        <div
          className="testimonial__stars"
          aria-hidden={item.rating ? undefined : true}
          role={item.rating ? "img" : undefined}
          aria-label={item.rating ? `${item.rating} out of 5 stars` : undefined}
        >
          {item.rating ? [1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={15} fill={star <= item.rating! ? "currentColor" : "none"} aria-hidden="true" />
          )) : null}
        </div>
      </div>
      <blockquote className="testimonial__quote" data-truncated={canReadMore}>{item.quote}</blockquote>
      {canReadMore ? (
        <button
          className="testimonial__read-more"
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          aria-label={`Read full review from ${item.name}`}
        >
          Read full review
        </button>
      ) : null}
      <figcaption className="testimonial__customer">
        <span className="testimonial__avatar" aria-hidden="true">
          {item.image && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element -- owner-managed images may come from any host.
            <img src={item.image} alt="" width={52} height={52} loading="lazy" onError={() => setImageFailed(true)} />
          ) : (
            <span>{initials(item.name)}</span>
          )}
        </span>
        <span className="testimonial__customer-copy">
          <strong>{item.name}</strong>
          {item.role ? <small>{item.role}</small> : null}
        </span>
      </figcaption>
      {canReadMore ? (
        <dialog
          className="testimonial-dialog"
          ref={dialogRef}
          aria-labelledby={dialogTitleId}
          onClick={(event) => {
            if (event.target === event.currentTarget) event.currentTarget.close();
          }}
        >
          <div className="testimonial-dialog__content">
            <div className="testimonial-dialog__header">
              <div>
                <p className="eyebrow">Customer review</p>
                <h3 id={dialogTitleId}>{item.name}</h3>
              </div>
              <button className="testimonial-dialog__close" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close full review">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            {item.rating ? (
              <div className="testimonial__stars" role="img" aria-label={`${item.rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={15} fill={star <= item.rating! ? "currentColor" : "none"} aria-hidden="true" />
                ))}
              </div>
            ) : null}
            <blockquote>{item.quote}</blockquote>
            {item.role ? <p className="testimonial-dialog__role">{item.role}</p> : null}
          </div>
        </dialog>
      ) : null}
    </figure>
  );
}

export function TestimonialsSection({ copy = NO_COPY }: { copy?: HomeSectionCopy }) {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionInView, setSectionInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [layout, setLayout] = useState({ width: 0, gap: CARD_GAP_FALLBACK });
  const [duration, setDuration] = useState(40);
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const visibleCount = Math.min(visibleCapacity(layout.width, layout.gap), items.length || 1);
  const cardWidth = layout.width
    ? Math.min((layout.width - layout.gap * (visibleCount - 1)) / visibleCount, layout.width < 600 ? 360 : 280)
    : 0;
  const canScroll = items.length > visibleCount;

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/testimonials", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Testimonials request failed with status ${response.status}.`);
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("Testimonials response was not a list.");
        return (data as Testimonial[]).filter((item) => item.active !== false);
      })
      .then((testimonials) => {
        setItems(testimonials);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Unable to load homepage testimonials:", error);
        setItems([]);
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || loading || !items.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => setSectionInView(entry.isIntersecting && entry.intersectionRatio >= 0.1),
      { threshold: [0, 0.1] },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [items.length, loading]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || loading || !items.length) return;

    const updateLayout = (width: number) => {
      const gap = width < 600 ? 16 : width < 900 ? 20 : CARD_GAP_FALLBACK;
      setLayout((current) => current.width === width && current.gap === gap ? current : { width, gap });
    };
    const measureLayout = () => {
      const styles = getComputedStyle(viewport);
      updateLayout(viewport.clientWidth - Number.parseFloat(styles.paddingLeft) - Number.parseFloat(styles.paddingRight));
    };
    measureLayout();

    const handleWindowResize = () => measureLayout();
    window.addEventListener("resize", handleWindowResize);
    const observer = new ResizeObserver(([entry]) => updateLayout(entry.contentRect.width));
    observer.observe(viewport);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [items.length, loading]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group || !canScroll) return;
    const updateDuration = () => setDuration(Math.max(1, group.getBoundingClientRect().width / 40));
    updateDuration();
    const observer = new ResizeObserver(updateDuration);
    observer.observe(group);
    return () => observer.disconnect();
  }, [canScroll, cardWidth, items.length, layout.gap]);

  if (!loading && items.length === 0) return null;

  if (loading) {
    return (
      <section className="section testimonials" aria-labelledby="testimonials-heading" aria-busy="true">
        <SectionHeading id="testimonials-heading" eyebrow={copy.subtitle || "Kind words"} title="In their words." />
        <div className="testimonial-skeletons" aria-hidden="true">
          {[0, 1, 2].map((item) => (
            <div className="testimonial-skeleton" key={item}>
              <span />
              <span />
              <span />
              <span />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const style = {
    "--testimonial-card-width": `${cardWidth}px`,
    "--testimonial-gap": `${layout.gap}px`,
    "--testimonial-duration": `${duration}s`,
  } as CSSProperties;

  return (
    <section className="section testimonials" aria-labelledby="testimonials-heading" ref={sectionRef}>
      <SectionHeading id="testimonials-heading" eyebrow={copy.subtitle || "Reviews"} title="Loved By Thousands" />
      <div
        className="testimonial-carousel"
        data-in-view={sectionInView}
        data-paused={paused}
        data-loop={canScroll}
        role="region"
        aria-roledescription="carousel"
        aria-label="Customer testimonials"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          const nextTarget = event.relatedTarget;
          if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) setPaused(false);
        }}
      >
        <div
          className="testimonial-carousel__viewport"
          ref={viewportRef}
          style={style}
          tabIndex={canScroll ? 0 : undefined}
          aria-label={canScroll ? "Testimonial cards, scrollable" : undefined}
        >
          <div className="testimonial-track">
            <div className="testimonial-group" ref={groupRef}>
              {items.map((item, index) => (
                <TestimonialCard item={item} key={item.id ?? `${item.name}-${item.quote}-${index}`} />
              ))}
            </div>
            {canScroll ? (
              <div className="testimonial-group" aria-hidden="true" inert>
                {items.map((item, index) => (
                  <TestimonialCard item={item} key={`${item.id ?? `${item.name}-${item.quote}-${index}`}-loop`} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
