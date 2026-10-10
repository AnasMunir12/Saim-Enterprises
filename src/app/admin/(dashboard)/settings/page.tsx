"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Field, PageHeader, Spinner, cardCls, inputCls, primaryBtn } from "@/components/admin/ui";
import { CheckboxField } from "@/components/admin/FormFields";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { AccountSection } from "@/components/admin/settings/AccountSection";
import { adminFetch } from "@/lib/admin-fetch";
import { BUSINESS_EMAIL, BUSINESS_PHONE, WHATSAPP_NUMBER } from "@/lib/constants";
import type { WebsiteSettings } from "@/lib/site-data";

const emptySettings: WebsiteSettings = {
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

type Social = { label: string; url: string };
const isInstagram = (link: Social) => /instagram/i.test(link.label) || /instagram\.com/i.test(link.url);
const isFacebook = (link: Social) => /facebook/i.test(link.label) || /(facebook|fb)\.com/i.test(link.url);

export default function SettingsPage() {
  const [settings, setSettings] = useState<WebsiteSettings>(emptySettings);
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saved, setSaved] = useState(false);

  const apply = useCallback((data: WebsiteSettings) => {
    setSettings({ ...emptySettings, ...data });
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
