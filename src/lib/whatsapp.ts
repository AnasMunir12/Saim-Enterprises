import { WHATSAPP_NUMBER } from "@/lib/constants";

/**
 * Turns whatever the admin typed in Settings into digits-only international format for wa.me.
 * "0300 8004204" becomes "923008004204" (Pakistan); numbers that already carry a country code are kept.
 * Falls back to the built-in shop number when the setting is empty or too short to be real.
 */
export function normalizeWhatsapp(value?: string | null): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length < 10) return WHATSAPP_NUMBER;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

/**
 * A customer's phone number as wa.me digits, or "" when it is too short to be a real number.
 * Unlike normalizeWhatsapp this never falls back to the shop's own number.
 */
export function customerWhatsappNumber(value?: string | null): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length < 10) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

export function whatsappLink(number: string, message?: string) {
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
