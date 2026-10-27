"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/products";

const TRANSITION_MS = 650;

function visibleCountForWidth(width: number) {
  if (width < 600) return 1;
  if (width < 900) return 2;
  return 3;
}

export function FeaturedProductsCarousel({ products }: { products: Product[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const transitionTimer = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);
  const indexRef = useRef(0);
  const animationLocked = useRef(false);
  const wheelGestureActive = useRef(false);
  const wheelGestureTimer = useRef<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [index, setIndex] = useState(0);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const canScroll = products.length > visibleCount;
  const maxIndex = Math.max(0, products.length - visibleCount);

  const slideTo = useCallback((slideIndex: number, duration = TRANSITION_MS) => {
    const viewport = viewportRef.current;
    const slide = viewport?.querySelector<HTMLElement>(`[data-slide-index="${slideIndex}"]`);
    if (!viewport || !slide) return;
    if (animationFrame.current !== null) window.cancelAnimationFrame(animationFrame.current);
    animationFrame.current = null;
    const padding = Number.parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
    const from = viewport.scrollLeft;
    const to = slide.getBoundingClientRect().left - viewport.getBoundingClientRect().left - padding + from;
    if (duration <= 0) {
      viewport.scrollLeft = to;
      return;
    }
    let startedAt: number | null = null;
    const animate = (now: number) => {
      if (startedAt === null) startedAt = now;
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - ((-2 * progress + 2) ** 3) / 2;
      viewport.scrollLeft = from + (to - from) * eased;
      if (progress < 1) animationFrame.current = window.requestAnimationFrame(animate);
      else animationFrame.current = null;
    };
    animationFrame.current = window.requestAnimationFrame(animate);
  }, []);

  const step = useCallback((direction: -1 | 1) => {
    if (!canScroll || animationLocked.current) return false;
    const nextIndex = indexRef.current + direction;
    if (nextIndex < 0 || nextIndex > maxIndex) return false;

    indexRef.current = nextIndex;
    setIndex(nextIndex);
    setInteracting(true);
    const duration = reducedMotion ? 0 : TRANSITION_MS;
    slideTo(nextIndex, duration);
    animationLocked.current = duration > 0;
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    if (duration === 0) {
      setInteracting(false);
      return true;
    }
    transitionTimer.current = window.setTimeout(() => {
      animationLocked.current = false;
      transitionTimer.current = null;
      setInteracting(false);
    }, duration);
    return true;
  }, [canScroll, maxIndex, reducedMotion, slideTo]);

  useEffect(() => {
    const resize = () => {
      const nextVisibleCount = visibleCountForWidth(window.innerWidth);
      setVisibleCount((current) => current === nextVisibleCount ? current : nextVisibleCount);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const nextIndex = Math.min(indexRef.current, maxIndex);
    if (nextIndex !== indexRef.current) {
      indexRef.current = nextIndex;
      setIndex(nextIndex);
    }
    const frame = window.requestAnimationFrame(() => slideTo(nextIndex, 0));
    return () => window.cancelAnimationFrame(frame);
  }, [maxIndex, slideTo, visibleCount]);

  useEffect(() => () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    if (wheelGestureTimer.current !== null) window.clearTimeout(wheelGestureTimer.current);
    if (animationFrame.current !== null) window.cancelAnimationFrame(animationFrame.current);
  }, []);

  useEffect(() => {
    const carousel = sectionRef.current;
    if (!carousel) return;
    const scrollSection = carousel.closest<HTMLElement>("#shop") ?? carousel;

    function handleWheel(event: WheelEvent) {
      if (window.innerWidth < 900 || reducedMotion || products.length < 4 || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const bounds = scrollSection.getBoundingClientRect();
      const activePosition = window.innerHeight / 2;
      if (bounds.top > activePosition || bounds.bottom < activePosition) return;

      const direction = event.deltaY > 0 ? 1 : -1;
      const atBoundary = direction > 0 ? indexRef.current >= maxIndex : indexRef.current <= 0;
      if (atBoundary && !animationLocked.current) return;

      event.preventDefault();
      if (wheelGestureTimer.current !== null) window.clearTimeout(wheelGestureTimer.current);
      wheelGestureTimer.current = window.setTimeout(() => {
        wheelGestureActive.current = false;
        wheelGestureTimer.current = null;
      }, 350);
      if (wheelGestureActive.current || animationLocked.current || atBoundary) return;

      wheelGestureActive.current = true;
      step(direction === 1 ? 1 : -1);
    }

    scrollSection.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      scrollSection.removeEventListener("wheel", handleWheel);
      if (wheelGestureTimer.current !== null) window.clearTimeout(wheelGestureTimer.current);
      wheelGestureActive.current = false;
    };
  }, [maxIndex, products.length, reducedMotion, step]);

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = touchStartX.current;
    touchStartX.current = null;
    setInteracting(false);
    if (start === null) return;
    const delta = event.changedTouches[0]?.clientX - start;
    if (typeof delta === "number" && Math.abs(delta) > 48) step(delta < 0 ? 1 : -1);
  }

  if (!products.length) return null;

  return (
    <div
      ref={sectionRef}
      className="featured-carousel"
      role="region"
      onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => { touchStartX.current = null; }}
      onKeyDown={(event) => {
        if (event.target !== viewportRef.current) return;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          step(-1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          step(1);
        }
      }}
      aria-roledescription="carousel"
      aria-label="Featured products"
    >
      <div className="featured-carousel__viewport" ref={viewportRef} tabIndex={canScroll ? 0 : undefined} role={canScroll ? "group" : undefined} aria-label={canScroll ? "Featured product slides; use the arrow keys to navigate" : undefined}>
        <div className={`featured-carousel__track${products.length <= visibleCount ? " featured-carousel__track--static" : ""}`}>
          {products.map((product, trackIndex) => {
            return (
              <div
                className="featured-carousel__slide"
                data-slide-index={trackIndex}
                key={product.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${trackIndex + 1} of ${products.length}: ${product.name}`}
              >
                <ProductCard product={product} />
              </div>
            );
          })}
        </div>
      </div>
      {canScroll ? (
        <div className="featured-carousel__controls">
          <button type="button" className="featured-carousel__control" aria-label="Previous featured products" disabled={interacting || index === 0} onClick={() => step(-1)}><ArrowLeft size={18} /></button>
          <button type="button" className="featured-carousel__control" aria-label="Next featured products" disabled={interacting || index === maxIndex} onClick={() => step(1)}><ArrowRight size={18} /></button>
        </div>
      ) : null}
    </div>
  );
}
