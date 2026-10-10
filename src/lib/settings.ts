import { connectDB } from "@/lib/mongodb";
import { Settings } from "@/models/Settings";
import type { WebsiteSettings } from "@/lib/site-data";

export const emptyWebsiteSettings: WebsiteSettings = {
  websiteName: "",
  logo: "",
  favicon: "",
  contactEmail: "",
  phone: "",
  whatsapp: "",
  showWhatsappButton: true,
  address: "",
  openingHours: "",
  announcement: "",
  socialLinks: [],
  defaultSeoTitle: "",
  defaultSeoDescription: "",
};

const KEYS = Object.keys(emptyWebsiteSettings) as Array<keyof WebsiteSettings>;

// Keeps only the known public fields (drops _id, timestamps and anything unexpected) and fills the gaps.
// Text fields default to empty and flags to their built-in value, so a Settings document saved before a field existed still reads fine.
function normalizeSettings(value: Partial<WebsiteSettings> | null | undefined): WebsiteSettings {
  const result: Record<string, unknown> = { ...emptyWebsiteSettings };
  for (const key of KEYS) {
    const incoming = value?.[key];
    if (key === "socialLinks") continue;
    if (typeof incoming === "string" || typeof incoming === "boolean") result[key] = incoming;
  }
  result.socialLinks = Array.isArray(value?.socialLinks)
    ? value.socialLinks.filter((link) => link && typeof link.label === "string" && typeof link.url === "string").map((link) => ({ label: link.label, url: link.url }))
    : [];
  return result as WebsiteSettings;
}

/** Read-only: an absent Settings document simply yields empty values (callers fall back to built-in defaults). */
export async function getSettings(): Promise<WebsiteSettings> {
  await connectDB();
  const existing = await Settings.findById("site-settings").lean();
  return normalizeSettings(existing as Partial<WebsiteSettings> | null);
}

export async function updateSettings(payload: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
  await connectDB();

  const current = await getSettings();
  const updated = normalizeSettings({ ...current, ...payload });
  const saved = await Settings.findByIdAndUpdate(
    "site-settings",
    { $set: updated },
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
  ).lean();

  return normalizeSettings(saved as Partial<WebsiteSettings>);
}

// ---- Input validation for the admin PUT ----

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE = /^[0-9+()\-\s]+$/;

function clean(value: string, multiline: boolean) {
  const pattern = multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
  return value.replace(pattern, "").trim();
}

type Rule = { max: number; multiline?: boolean; label: string; check?: (value: string) => string | null };

const RULES: Partial<Record<keyof WebsiteSettings, Rule>> = {
  websiteName: { max: 80, label: "Website name" },
  logo: { max: 2000, label: "Logo" },
  favicon: { max: 2000, label: "Favicon" },
  contactEmail: { max: 254, label: "Public email", check: (v) => (v && !EMAIL.test(v) ? "Enter a valid public email address." : null) },
  phone: { max: 30, label: "Phone", check: (v) => (v && (!PHONE.test(v) || v.replace(/\D/g, "").length < 6) ? "Enter a valid phone number (digits, spaces, + ( ) - only)." : null) },
  whatsapp: { max: 30, label: "WhatsApp number", check: (v) => (v && (!PHONE.test(v) || v.replace(/\D/g, "").length < 10) ? "Enter a valid WhatsApp number with at least 10 digits." : null) },
  address: { max: 300, multiline: true, label: "Address" },
  openingHours: { max: 300, multiline: true, label: "Opening hours" },
  announcement: { max: 200, label: "Announcement" },
  defaultSeoTitle: { max: 120, label: "Default SEO title" },
  defaultSeoDescription: { max: 320, multiline: true, label: "Default SEO description" },
};

export type SettingsInputResult = { ok: true; value: Partial<WebsiteSettings> } | { ok: false; message: string };

/** Validates and cleans a partial settings payload. Unknown fields are ignored. */
export function parseSettingsInput(payload: Record<string, unknown>): SettingsInputResult {
  const value: Record<string, unknown> = {};

  for (const [key, rule] of Object.entries(RULES) as Array<[keyof WebsiteSettings, Rule]>) {
    if (!(key in payload)) continue;
    const raw = payload[key];
    if (raw === null || raw === undefined) {
      value[key] = "";
      continue;
    }
    if (typeof raw !== "string") return { ok: false, message: `${rule.label} must be text.` };
    const cleaned = clean(raw, rule.multiline === true);
    if (cleaned.length > rule.max) return { ok: false, message: `${rule.label} must be ${rule.max} characters or fewer.` };
    const problem = rule.check?.(cleaned) ?? null;
    if (problem) return { ok: false, message: problem };
    value[key] = cleaned;
  }

  if ("showWhatsappButton" in payload) {
    if (typeof payload.showWhatsappButton !== "boolean") return { ok: false, message: "Show WhatsApp button must be on or off." };
    value.showWhatsappButton = payload.showWhatsappButton;
  }

  if ("socialLinks" in payload) {
    if (!Array.isArray(payload.socialLinks)) return { ok: false, message: "Social links must be a list." };
    if (payload.socialLinks.length > 10) return { ok: false, message: "You can add at most 10 social links." };
    const links: { label: string; url: string }[] = [];
    for (const entry of payload.socialLinks as unknown[]) {
      const item = entry as { label?: unknown; url?: unknown } | null;
      if (!item || typeof item.label !== "string" || typeof item.url !== "string") return { ok: false, message: "Each social link needs a name and a web address." };
      const label = clean(item.label, false);
      const url = clean(item.url, false);
      if (!label && !url) continue;
      if (!label || label.length > 40) return { ok: false, message: "Each social link needs a name of 40 characters or fewer." };
      if (url.length > 300 || !/^https?:\/\/[^\s/$.?#][^\s]*$/i.test(url)) return { ok: false, message: `"${label}" link must start with http:// or https://.` };
      links.push({ label, url });
    }
    value.socialLinks = links;
  }

  return { ok: true, value: value as Partial<WebsiteSettings> };
}
