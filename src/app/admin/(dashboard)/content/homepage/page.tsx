"use client";

import { useEffect, useState } from "react";
import type { HomepageSection } from "@/lib/site-data";

export default function HomepageContentPage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);

  async function loadSections() {
    const response = await fetch("/api/content/homepage");
    const data = (await response.json()) as HomepageSection[];
    setSections(data);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSections();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function handleToggle(section: HomepageSection) {
    const updated = { ...section, enabled: !section.enabled };
    const response = await fetch("/api/content/homepage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });

    if (response.ok) {
      await loadSections();
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold tracking-tight">Homepage content</h2>
      <div className="mt-5 space-y-3">
        {sections.map((section) => (
          <div key={section.id} className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 p-3">
            <div>
              <div className="font-medium">{section.title}</div>
              <div className="text-sm text-stone-500">{section.subtitle}</div>
            </div>
            <button type="button" onClick={() => handleToggle(section)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${section.enabled ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-700"}`}>
              {section.enabled ? "Enabled" : "Disabled"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
