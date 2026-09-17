import { MessageCircle } from "lucide-react";
import { WHATSAPP_LINK } from "@/lib/constants";

export function WhatsAppButton() {
  return <a className="whatsapp" href={`${WHATSAPP_LINK}?text=Hi%20Saim%20Enterprises,%20I%20need%20help%20with%20a%20piece.`} aria-label="Chat with Saim Enterprises on WhatsApp"><MessageCircle size={21} /><span>Chat with us</span></a>;
}
