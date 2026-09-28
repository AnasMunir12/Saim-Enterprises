"use client";

import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import type { CollectionRecord } from "@/lib/site-data";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadCollections() {
    const response = await fetch("/api/collections");
    const data = (await response.json()) as CollectionRecord[];
    setCollections(data);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCollections();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function handleSave() {
    const payload = { name, description, image, active, featured };
    const endpoint = editingId ? `/api/collections/${editingId}` : "/api/collections";
    const method = editingId ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setName("");
      setDescription("");
      setImage("");
      setActive(true);
      setFeatured(false);
      setEditingId(null);
      await loadCollections();
    }
  }

  async function handleEdit(collection: CollectionRecord) {
    setEditingId(collection.id);
    setName(collection.name);
    setDescription(collection.description ?? "");
    setImage(collection.image ?? "");
    setActive(collection.active);
    setFeatured(collection.featured);
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/collections/${id}`, { method: "DELETE" });
    if (response.ok) {
      await loadCollections();
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.4fr]">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight">{editingId ? "Edit collection" : "Create collection"}</h2>
        <div className="mt-4 space-y-4">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Collection name" className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="min-h-28 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
          <ImageUpload value={image} onChange={setImage} label="Collection image" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Active</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} /> Featured</label>
          <button type="button" onClick={handleSave} className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white">{editingId ? "Update collection" : "Save collection"}</button>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {collections.map((collection) => (
            <div key={collection.id} className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 p-3">
              <div className="flex items-center gap-3">
                {collection.image ? <img src={collection.image} alt={collection.name} className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-stone-200" />}
                <div>
                  <div className="font-medium">{collection.name}</div>
                  <div className="text-sm text-stone-500">{collection.slug}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => handleEdit(collection)} className="rounded-lg border border-stone-200 px-2 py-1 text-xs">Edit</button>
                <button type="button" onClick={() => handleDelete(collection.id)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
