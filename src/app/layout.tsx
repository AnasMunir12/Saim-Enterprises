import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import "@/styles/storefront.css";
import { StoreProvider, type SiteSettings } from "@/components/StoreProvider";
import { getSettings } from "@/lib/settings";

// Brand type: a warm editorial serif for headings, a clean sans for everything else. Self-hosted by next/font.
const serif = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const DEFAULT_TITLE = "Saim Enterprises | Objects with a little soul";
const DEFAULT_DESCRIPTION = "Handcrafted lighting, decor and custom pieces for considered homes.";

// Default page title, description and browser-tab icon come from admin Settings (Branding and search).
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings().catch(() => null);
  return {
    title: settings?.defaultSeoTitle || DEFAULT_TITLE,
    description: settings?.defaultSeoDescription || DEFAULT_DESCRIPTION,
    ...(settings?.favicon ? { icons: { icon: settings.favicon } } : {}),
  };
}

// Business details come from the database on every request, so edits in admin Settings show up straight away.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The site must still render when the database is unreachable: fall back to the built-in defaults.
  const settings: SiteSettings | null = await getSettings()
    .then(({ websiteName, contactEmail, phone, whatsapp, showWhatsappButton, address, openingHours, announcement, socialLinks }) => ({ websiteName, contactEmail, phone, whatsapp, showWhatsappButton, address, openingHours, announcement, socialLinks }))
    .catch(() => null);

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body><StoreProvider initialSettings={settings}>{children}</StoreProvider></body>
    </html>
  );
}
