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
  address: "",
  socialLinks: [],
  defaultSeoTitle: "",
  defaultSeoDescription: "",
};

function normalizeSettings(value: Partial<WebsiteSettings> | null | undefined): WebsiteSettings {
  return {
    ...emptyWebsiteSettings,
    ...value,
    socialLinks: Array.isArray(value?.socialLinks) ? value.socialLinks : [],
  };
}

export async function getSettings(): Promise<WebsiteSettings> {
  await connectDB();

  const existing = await Settings.findById("site-settings").lean();
  if (existing) {
    return normalizeSettings(existing as Partial<WebsiteSettings>);
  }

  const created = await Settings.findByIdAndUpdate(
    "site-settings",
    { $set: normalizeSettings(undefined) },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();

  return normalizeSettings(created as Partial<WebsiteSettings>);
}

export async function updateSettings(payload: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
  await connectDB();

  const current = await getSettings();
  const updated = normalizeSettings({ ...current, ...payload });
  const saved = await Settings.findByIdAndUpdate(
    "site-settings",
    { $set: updated },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();

  return normalizeSettings(saved as Partial<WebsiteSettings>);
}
