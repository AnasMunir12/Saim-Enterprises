"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Field, PageHeader, Spinner, cardCls, inputCls, primaryBtn, secondaryBtn } from "@/components/admin/ui";
import { CheckboxField } from "@/components/admin/FormFields";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { AccountSection } from "@/components/admin/settings/AccountSection";
import { useStore } from "@/components/StoreProvider";
import { adminFetch } from "@/lib/admin-fetch";
import { BUSINESS_EMAIL, BUSINESS_PHONE, WHATSAPP_NUMBER } from "@/lib/constants";
import type { WebsiteSettings } from "@/lib/site-data";

const emptySettings: WebsiteSettings = {
  websiteName: "",
  logo: "",
  logoDesktopWidth: 220,
  logoMobileWidth: 160,
  logoMaxHeight: 48,
  logoObjectFit: "contain",
  favicon: "",
  contactEmail: "",
  businessOrderEmail: "",
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

type Social = { label: string; url: string };
const isInstagram = (link: Social) => /instagram/i.test(link.label) || /instagram\.com/i.test(link.url);
const isFacebook = (link: Social) => /facebook/i.test(link.label) || /(facebook|fb)\.com/i.test(link.url);

function LogoPreview({ src, width, height, fit, label }: { src: string; width: number; height: number; fit: "contain" | "cover"; label: string }) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-stone-700">{label}</p>
      <div className="mt-2 flex min-h-20 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50 p-2">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- Logo previews use stored Cloudinary URLs.
          <img src={src} alt={`${label} preview`} style={{ width: `${width}px`, height: `${height}px`, objectFit: fit, maxWidth: "100%" }} />
        ) : (
          <span className="text-xl font-semibold tracking-tight text-stone-800">saim <span className="text-xs font-medium uppercase tracking-[0.2em]">enterprises</span></span>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { syncSettings } = useStore();
  const [settings, setSettings] = useState<WebsiteSettings>(emptySettings);
  const [persistedSettings, setPersistedSettings] = useState<WebsiteSettings>(emptySettings);
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saved, setSaved] = useState(false);

  const apply = useCallback((data: WebsiteSettings) => {
    const normalized = { ...emptySettings, ...data };
    setSettings(normalized);
    setPersistedSettings(normalized);
    setInstagram(data.socialLinks.find(isInstagram)?.url ?? "");
    setFacebook(data.socialLinks.find((link) => isFacebook(link) && !isInstagram(link))?.url ?? "");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      apply(await adminFetch<WebsiteSettings>("/api/settings", { cache: "no-store" }));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    // Instagram and Facebook are edited as plain fields; any other link already stored is kept as it is.
    const others = settings.socialLinks.filter((link) => !isInstagram(link) && !isFacebook(link));
    const socialLinks = [
      ...others,
      ...(instagram.trim() ? [{ label: "Instagram", url: instagram.trim() }] : []),
      ...(facebook.trim() ? [{ label: "Facebook", url: facebook.trim() }] : []),
    ];
    try {
      const data = await adminFetch<WebsiteSettings>("/api/settings", { method: "PUT", body: JSON.stringify({ ...settings, socialLinks }) });
      apply(data);
      syncSettings(data);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  const set = (key: keyof WebsiteSettings) => (event: { target: { value: string } }) => {
    setSaved(false);
    setSettings((current) => ({ ...current, [key]: event.target.value }));
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Store" title="Settings" description="What you save here appears on the contact page, the footer, the WhatsApp buttons and the announcement bar." />

      {loadError ? <Alert onRetry={() => void load()}>{loadError}</Alert> : null}
      {error ? <Alert onDismiss={() => setError("")}>{error}</Alert> : null}
      {saved ? <Alert tone="success" onDismiss={() => setSaved(false)}>Settings saved. The storefront now shows these details.</Alert> : null}

      {loading ? (
        <div className={cardCls}><Spinner label="Loading settings" /></div>
      ) : loadError ? null : (
        <form onSubmit={(event) => { event.preventDefault(); void handleSave(); }} className="space-y-6">
          <section className={cardCls} aria-labelledby="contact-settings">
            <h3 id="contact-settings" className="text-lg font-semibold tracking-tight">Business contact</h3>
            <p className="mt-1 text-sm text-stone-500">Leave a field empty to use the built-in default shown in grey.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Business name" htmlFor="s-name"><input id="s-name" value={settings.websiteName} onChange={set("websiteName")} placeholder="Saim Enterprises" maxLength={80} className={inputCls} /></Field>
              <Field label="Public email" htmlFor="s-email" hint="Shown to customers. New contact-form messages are also sent here."><input id="s-email" type="email" value={settings.contactEmail} onChange={set("contactEmail")} placeholder={BUSINESS_EMAIL} maxLength={254} className={inputCls} /></Field>
              <Field label="Order Notification Email" htmlFor="s-order-email" hint="Receives company order notifications."><input id="s-order-email" type="email" value={settings.businessOrderEmail} onChange={set("businessOrderEmail")} placeholder={BUSINESS_EMAIL} maxLength={254} className={inputCls} /></Field>
              <Field label="Phone" htmlFor="s-phone"><input id="s-phone" type="tel" value={settings.phone} onChange={set("phone")} placeholder={BUSINESS_PHONE} maxLength={30} className={inputCls} /></Field>
              <Field label="WhatsApp number" htmlFor="s-wa" hint="With country code, for example +92 300 1234567. A local number starting with 0 is read as Pakistan."><input id="s-wa" type="tel" value={settings.whatsapp} onChange={set("whatsapp")} placeholder={`+${WHATSAPP_NUMBER}`} maxLength={30} className={inputCls} /></Field>
              <div className="md:col-span-2">
                <CheckboxField
                  label="Show WhatsApp button"
                  hint="The floating Chat with us button at the bottom corner of every storefront page. It opens a chat with the number above."
                  checked={settings.showWhatsappButton}
                  onChange={(showWhatsappButton) => { setSaved(false); setSettings((current) => ({ ...current, showWhatsappButton })); }}
                />
              </div>
              <div className="md:col-span-2"><Field label="Address" htmlFor="s-address"><textarea id="s-address" value={settings.address} onChange={set("address")} rows={2} maxLength={300} placeholder="Shop address, city" className={inputCls} /></Field></div>
              <div className="md:col-span-2"><Field label="Opening hours" htmlFor="s-hours" hint="One line per day or range, for example: Mon-Sat 10am to 7pm"><textarea id="s-hours" value={settings.openingHours} onChange={set("openingHours")} rows={3} maxLength={300} placeholder="Mon-Sat 10am to 7pm" className={inputCls} /></Field></div>
            </div>
          </section>

          <section className={cardCls} aria-labelledby="website-logo-settings">
            <h3 id="website-logo-settings" className="text-lg font-semibold tracking-tight">Website Logo Settings</h3>
            <p className="mt-1 text-sm text-stone-500">Upload a logo and preview its responsive size. Changes appear on the storefront after you save settings.</p>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <LogoPreview src={persistedSettings.logo} width={persistedSettings.logoDesktopWidth} height={persistedSettings.logoMaxHeight} fit={persistedSettings.logoObjectFit} label="Current saved logo" />
              <ImageUpload
                value={settings.logo}
                onChange={(logo) => { setSaved(false); setSettings((current) => ({ ...current, logo })); }}
                label="Upload or change logo"
                browseLabel="Upload logo"
                replaceLabel="Change logo"
              />
            </div>

            {settings.logo !== persistedSettings.logo ? (
              <p className="mt-3 text-sm text-stone-500" role="status">New logo selected. Save settings to publish this change.</p>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Desktop logo width" htmlFor="s-logo-desktop" hint="64–320 px">
                <input id="s-logo-desktop" type="number" min={64} max={320} step={1} inputMode="numeric" value={settings.logoDesktopWidth} onChange={(event) => { setSaved(false); setSettings((current) => ({ ...current, logoDesktopWidth: Number(event.target.value) })); }} className={inputCls} />
              </Field>
              <Field label="Mobile logo width" htmlFor="s-logo-mobile" hint="48–240 px">
                <input id="s-logo-mobile" type="number" min={48} max={240} step={1} inputMode="numeric" value={settings.logoMobileWidth} onChange={(event) => { setSaved(false); setSettings((current) => ({ ...current, logoMobileWidth: Number(event.target.value) })); }} className={inputCls} />
              </Field>
              <Field label="Logo maximum height" htmlFor="s-logo-height" hint="24–56 px">
                <input id="s-logo-height" type="number" min={24} max={56} step={1} inputMode="numeric" value={settings.logoMaxHeight} onChange={(event) => { setSaved(false); setSettings((current) => ({ ...current, logoMaxHeight: Number(event.target.value) })); }} className={inputCls} />
              </Field>
              <Field label="Image fit" htmlFor="s-logo-fit">
                <select id="s-logo-fit" value={settings.logoObjectFit} onChange={(event) => { setSaved(false); setSettings((current) => ({ ...current, logoObjectFit: event.target.value === "cover" ? "cover" : "contain" })); }} className={inputCls}>
                  <option value="contain">Contain (preserve full logo)</option>
                  <option value="cover">Cover (fill the logo area)</option>
                </select>
              </Field>
            </div>
            <button
              type="button"
              className={`${secondaryBtn} mt-4`}
              onClick={() => {
                setSaved(false);
                setSettings((current) => ({ ...current, logoDesktopWidth: 220, logoMobileWidth: 160, logoMaxHeight: 48, logoObjectFit: "contain" }));
              }}
            >
              Reset logo size
            </button>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <LogoPreview src={settings.logo} width={settings.logoDesktopWidth} height={settings.logoMaxHeight} fit={settings.logoObjectFit} label="Desktop live preview" />
              <LogoPreview src={settings.logo} width={settings.logoMobileWidth} height={settings.logoMaxHeight} fit={settings.logoObjectFit} label="Mobile live preview" />
            </div>
          </section>

          <section className={cardCls} aria-labelledby="social-settings">
            <h3 id="social-settings" className="text-lg font-semibold tracking-tight">Social links and announcement</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Instagram link" htmlFor="s-ig"><input id="s-ig" type="url" value={instagram} onChange={(event) => { setSaved(false); setInstagram(event.target.value); }} placeholder="https://instagram.com/yourshop" maxLength={300} className={inputCls} /></Field>
              <Field label="Facebook link" htmlFor="s-fb"><input id="s-fb" type="url" value={facebook} onChange={(event) => { setSaved(false); setFacebook(event.target.value); }} placeholder="https://facebook.com/yourshop" maxLength={300} className={inputCls} /></Field>
              <div className="md:col-span-2"><Field label="Announcement text" htmlFor="s-ann" hint="Shown first in the bar at the top of every page. Leave empty to show only the standard messages."><input id="s-ann" value={settings.announcement} onChange={set("announcement")} maxLength={200} placeholder="Eid sale: 15% off all lamps" className={inputCls} /></Field></div>
            </div>
          </section>

          <section className={cardCls} aria-labelledby="brand-settings">
            <h3 id="brand-settings" className="text-lg font-semibold tracking-tight">Branding and search</h3>
            <p className="mt-1 text-sm text-stone-500">The tab icon, and the title and description search engines show for pages that do not set their own.</p>
            <div className="mt-5 grid gap-4">
              <ImageUpload value={settings.favicon ?? ""} onChange={(favicon) => { setSaved(false); setSettings((current) => ({ ...current, favicon })); }} label="Browser tab icon (favicon)" />
              <Field label="Default SEO title" htmlFor="s-seo-t"><input id="s-seo-t" value={settings.defaultSeoTitle} onChange={set("defaultSeoTitle")} maxLength={120} className={inputCls} /></Field>
              <Field label="Default SEO description" htmlFor="s-seo-d"><textarea id="s-seo-d" value={settings.defaultSeoDescription} onChange={set("defaultSeoDescription")} rows={3} maxLength={320} className={inputCls} /></Field>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className={primaryBtn}>{saving ? "Saving..." : "Save settings"}</button>
          </div>
        </form>
      )}

      <AccountSection />
    </div>
  );
}
