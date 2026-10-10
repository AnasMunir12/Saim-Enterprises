"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { formatPrice } from "@/lib/products";

const defaultMessages: Array<{ text: string; href?: string }> = [
  { text: `Free delivery on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}`, href: "/shipping" },
  { text: "Handcrafted in Lahore. Ships nationwide.", href: "/about" },
  { text: "Custom pieces made to order. Ask the studio.", href: "/contact" },
];

// Rotates every few seconds; stops while hovered or focused and never moves for visitors who ask for less motion.
export function AnnouncementBar() {
  const { settings } = useStore();
  // The owner's announcement from admin Settings leads the rotation.
  const announcement = settings?.announcement?.trim();
  const messages = announcement ? [{ text: announcement }, ...defaultMessages] : defaultMessages;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read a browser media query after mount
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % messages.length), 4500);
    return () => clearInterval(timer);
  }, [paused, reducedMotion, messages.length]);

  const message = messages[index % messages.length];

  return (
    <div
      className="announcement"
      role="region"
      aria-label="Store announcements"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {message.href ? (
        <Link key={index} className="announcement-message" href={message.href}>{message.text}</Link>
      ) : (
        <span key={index} className="announcement-message">{message.text}</span>
      )}
      <span className="announcement-dots" aria-hidden="true">
        {messages.map((_, dot) => <i key={dot} className={dot === index ? "on" : ""} />)}
      </span>
    </div>
  );
}
