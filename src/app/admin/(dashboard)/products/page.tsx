"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import type { CategoryRecord, ProductRecord } from "@/lib/site-data";

type ProductDraft = {
  id?: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  categoryId: string;
  image: string;
  featured: boolean;
  active: boolean;
};

const emptyDraft: ProductDraft = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  price: 0,
  categoryId: "",
  image: "",
  featured: false,
  active: true,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    const [productResponse, categoryResponse] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/categories"),
    ]);

    const productData = (await productResponse.json()) as ProductRecord[];
    const categoryData = (await categoryResponse.json()) as CategoryRecord[];

    setProducts(productData);
    setCategories(categoryData);
    if (categoryData[0] && !draft.categoryId) {
      setDraft((current) => ({ ...current, categoryId: categoryData[0].id }));
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [products, search]);

  async function handleSave() {
    setLoading(true);

    const payload = {
      ...draft,
      slug: draft.slug || draft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      price: Number(draft.price),
      categoryId: draft.categoryId || categories[0]?.id || "",
      description: draft.description || draft.shortDescription,
      shortDescription: draft.shortDescription || draft.description,
      image: draft.image || "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=85",
    };

    const response = editingId
      ? await fetch(`/api/products/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    setLoading(false);
    if (response.ok) {
      setDraft(emptyDraft);
      setEditingId(null);
      await loadData();
    }
  }

  async function handleEdit(product: ProductRecord) {
    setEditingId(product.id);
    setDraft({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      shortDescription: product.shortDescription,
      description: product.description,
      categoryId: product.categoryId,
      image: product.image,
      featured: product.featured,
      active: product.active,
    });
  }

  async function handleDelete(productId: string) {
    const response = await fetch(`/api/products/${productId}`, { method: "DELETE" });
    if (response.ok) {
      await loadData();
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Catalog</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Product management</h2>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products"
            className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 lg:max-w-xs"
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">{editingId ? "Edit product" : "Add product"}</h3>

          <div className="mt-4 space-y-4">
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Product name" className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
            <input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} placeholder="Slug" className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
            <textarea value={draft.shortDescription} onChange={(event) => setDraft({ ...draft, shortDescription: event.target.value })} placeholder="Short description" className="min-h-20 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
            <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Full description" className="min-h-28 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="number" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} placeholder="Price" className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5" />
              <select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })} className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5">
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <ImageUpload value={draft.image} onChange={(image) => setDraft({ ...draft, image })} label="Product image" />

            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} /> Featured</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} /> Active</label>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={handleSave} disabled={loading} className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
                {loading ? "Saving..." : editingId ? "Update product" : "Create product"}
              </button>
              <button type="button" onClick={() => { setDraft(emptyDraft); setEditingId(null); }} className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium">Reset</button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500">
                  <th className="pb-3 pr-4 font-medium">Image</th>
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Category</th>
                  <th className="pb-3 pr-4 font-medium">Price</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-stone-100 align-middle">
                    <td className="py-3 pr-4"><img src={product.image} alt={product.name} className="h-12 w-12 rounded-lg object-cover" /></td>
                    <td className="py-3 pr-4 font-medium">{product.name}</td>
                    <td className="py-3 pr-4">{categories.find((category) => category.id === product.categoryId)?.name ?? product.categoryId}</td>
                    <td className="py-3 pr-4">PKR {product.price.toLocaleString("en-PK")}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${product.active ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-600"}`}>
                        {product.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleEdit(product)} className="rounded-lg border border-stone-200 px-2 py-1 text-xs">Edit</button>
                        <button type="button" onClick={() => handleDelete(product.id)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
