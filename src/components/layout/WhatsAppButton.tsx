"use client";

import { MessageCircle } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { whatsappLink } from "@/lib/whatsapp";

// Floating "Chat with us" link on every storefront page. The number comes from admin Settings (with the built-in
// shop number as a fallback) and the owner can hide the button there.
export function WhatsAppButton() {
  const { settings, whatsappNumber } = useStore();
  if (settings?.showWhatsappButton === false) return null;

  const name = settings?.websiteName || "Saim Enterprises";
  return (
    <a
      className="whatsapp"
      href={whatsappLink(whatsappNumber, `Hi ${name}, I would like to discuss a custom piece.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp (opens in a new tab)"
    >
      <MessageCircle size={20} aria-hidden="true" />
      <span>Chat with us</span>
    </a>
  );
}
