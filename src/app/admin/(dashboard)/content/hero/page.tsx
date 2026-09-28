"use client";

import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import type { HeroSlideRecord } from "@/lib/site-data";

export default function HeroContentPage() {
  const [slides, setSlides] = useState<HeroSlideRecord[]>([]);
  const [form, setForm] = useState({
    eyebrow: "",
    title: "",
    description: "",
    image: "",
    primaryButtonText: "",
    primaryButtonUrl: "/catalog",
    secondaryButtonText: "",
    secondaryButtonUrl: "/contact",
    active: true,
  });

  async function loadSlides() {
    const response = await fetch("/api/content/hero");
    const data = (await response.json()) as HeroSlideRecord[];
    setSlides(data);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSlides();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function handleSave() {
    const response = await fetch("/api/content/hero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      setForm({
        eyebrow: "",
        title: "",
        description: "",
        image: "",
        primaryButtonText: "",
        primaryButtonUrl: "/catalog",
        secondaryButtonText: "",
        secondaryButtonUrl: "/contact",
        active: true,
      });
      await loadSlides();
    }
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/content/hero?id=${id}`, { method: "DELETE" });
    if (response.ok) {
      await loadSlides();
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight">Hero slider editor</h2>
        <div className="mt-4 space-y-4">
          <input value={form.eyebrow} onChange={(event) => setForm({ ...form, eyebrow: event.target.value })} placeholder="Eyebrow" className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Title" className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" className="min-h-28 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
          <ImageUpload value={form.image} onChange={(image) => setForm({ ...form, image })} label="Hero image" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.primaryButtonText} onChange={(event) => setForm({ ...form, primaryButtonText: event.target.value })} placeholder="Primary button text" className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
            <input value={form.primaryButtonUrl} onChange={(event) => setForm({ ...form, primaryButtonUrl: event.target.value })} placeholder="Primary URL" className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.secondaryButtonText} onChange={(event) => setForm({ ...form, secondaryButtonText: event.target.value })} placeholder="Secondary button text" className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
            <input value={form.secondaryButtonUrl} onChange={(event) => setForm({ ...form, secondaryButtonUrl: event.target.value })} placeholder="Secondary URL" className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Active</label>
          <button type="button" onClick={handleSave} className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white">Add slide</button>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {slides.map((slide) => (
            <div key={slide.id} className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 p-3">
              <div className="flex items-center gap-3">
                <img src={slide.image} alt={slide.title} className="h-14 w-20 rounded-lg object-cover" />
                <div>
                  <div className="font-medium">{slide.title}</div>
                  <div className="text-sm text-stone-500">{slide.eyebrow}</div>
                </div>
              </div>
              <button type="button" onClick={() => handleDelete(slide.id)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
