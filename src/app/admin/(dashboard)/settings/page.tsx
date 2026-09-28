"use client";

import { useEffect, useState } from "react";
import type { WebsiteSettings } from "@/lib/site-data";
import { ImageUpload } from "@/components/admin/ImageUpload";

const emptySettings: WebsiteSettings = {
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<WebsiteSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function loadSettings() {
    setLoading(true);
    setFeedback("");

    try {
      const response = await fetch("/api/settings");
      const data = (await response.json()) as WebsiteSettings & { message?: string };

      if (!response.ok) {
        setFeedback(data.message ?? "Unable to load settings.");
        return;
      }

      setSettings(data);
    } catch {
      setFeedback("Unable to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSettings();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function handleSave() {
    setSaving(true);
    setFeedback("");

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = (await response.json()) as WebsiteSettings & { message?: string };

      if (response.status === 401) {
        setFeedback("Your session may have expired. Please sign in again.");
        return;
      }

      if (!response.ok) {
        setFeedback(data.message ?? "Unable to save settings.");
        return;
      }

      setSettings(data);
      setFeedback("Settings saved successfully.");
    } catch {
      setFeedback("Unable to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold tracking-tight">Website settings</h2>
      {loading ? <p className="mt-5 text-sm text-stone-500">Loading settings...</p> : null}
      {feedback ? <p className="mt-5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600" role="status">{feedback}</p> : null}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <input value={settings.websiteName} onChange={(event) => setSettings({ ...settings, websiteName: event.target.value })} placeholder="Website name" className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
        <input value={settings.contactEmail} onChange={(event) => setSettings({ ...settings, contactEmail: event.target.value })} placeholder="Contact email" className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
        <input value={settings.phone} onChange={(event) => setSettings({ ...settings, phone: event.target.value })} placeholder="Phone" className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
        <input value={settings.whatsapp} onChange={(event) => setSettings({ ...settings, whatsapp: event.target.value })} placeholder="WhatsApp" className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
        <ImageUpload value={settings.logo} onChange={(logo) => setSettings({ ...settings, logo })} label="Logo" className="md:col-span-2" />
        <input value={settings.address} onChange={(event) => setSettings({ ...settings, address: event.target.value })} placeholder="Address" className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 md:col-span-2" />
        <input value={settings.defaultSeoTitle} onChange={(event) => setSettings({ ...settings, defaultSeoTitle: event.target.value })} placeholder="Default SEO title" className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 md:col-span-2" />
        <textarea value={settings.defaultSeoDescription} onChange={(event) => setSettings({ ...settings, defaultSeoDescription: event.target.value })} placeholder="Default SEO description" className="min-h-28 rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 md:col-span-2" />
      </div>
      <button type="button" onClick={handleSave} disabled={loading || saving} className="mt-5 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : "Save settings"}</button>
    </div>
  );
}
