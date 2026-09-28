import { MessageCircle } from "lucide-react";
import { WHATSAPP_LINK } from "@/lib/constants";

export function WhatsAppButton() {
  return (
    <a
      className="whatsapp"
      href={`${WHATSAPP_LINK}?text=Hi%20Saim%20Enterprises,%20I%20would%20like%20to%20discuss%20a%20custom%20piece.`}
      aria-label="Chat with Saim Enterprises on WhatsApp"
    >
      <MessageCircle size={20} />
      <span>Chat with us</span>
    </a>
  );
}
