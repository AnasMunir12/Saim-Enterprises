"use client";

import { LoaderCircle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GalleryField } from "@/components/admin/GalleryField";
import { FeaturedProductSelection } from "@/components/admin/FeaturedProductSelection";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Alert, Badge, ConfirmDialog, EmptyState, Field, PageHeader, Pagination, SidePanel, Spinner, cardCls, inputCls, primaryBtn, secondaryBtn, smallBtn, smallDangerBtn } from "@/components/admin/ui";
import { adminFetch } from "@/lib/admin-fetch";
import { formatPKR } from "@/lib/format";
import { LOW_STOCK_THRESHOLD, parseStock, stockState, type StockState } from "@/lib/inventory";
import { MAX_FEATURED_PRODUCTS, MAX_PRODUCT_IMAGES } from "@/lib/products";
import type { CategoryRecord, CollectionRecord, ProductRecord } from "@/lib/site-data";

const PAGE_SIZE = 20;
const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=85";

type Draft = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  sku: string;
  stock: string;
  categoryId: string;
  collectionId: string;
  status: "draft" | "active" | "inactive";
  featured: boolean;
  image: string;
  // Shown in the "Details" list on the product page.
  material: string;
  dimensions: string;
  color: string;
  customizable: boolean;
  gallery: string[];
  seoTitle: string;
  seoDescription: string;
};

const emptyDraft: Draft = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  price: "",
  compareAtPrice: "",
  sku: "",
  stock: "0",
  categoryId: "",
  collectionId: "",
  status: "active",
  featured: false,
  image: "",
  material: "",
  dimensions: "",
  color: "",
  customizable: false,
  gallery: [],
  seoTitle: "",
  seoDescription: "",
};

type StockFilter = "all" | StockState;
type StatusFilter = "all" | "active" | "draft" | "inactive";

function StockBadge({ stock }: { stock: number }) {
  const state = stockState(stock);
  if (state === "out") return <Badge tone="red">Out of stock</Badge>;
  if (state === "low") return <Badge tone="amber">Low</Badge>;
  return <Badge tone="green">In stock</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge tone="green">Active</Badge>;
  if (status === "draft") return <Badge tone="blue">Draft</Badge>;
  return <Badge tone="stone">Inactive</Badge>;
}

function StockEditor({ product, onSave }: { product: ProductRecord; onSave: (product: ProductRecord, stock: number) => Promise<void> }) {
  const [value, setValue] = useState(String(product.stock ?? 0));
  const [saving, setSaving] = useState(false);
  const parsed = parseStock(value);
  const dirty = value !== String(product.stock ?? 0);

  async function commit() {
    if (parsed === null || !dirty || saving) return;
    setSaving(true);
    try {
      await onSave(product, parsed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={value}
        aria-label={`Stock quantity for ${product.name}`}
        aria-invalid={parsed === null}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") void commit();
          if (event.key === "Escape") setValue(String(product.stock ?? 0));
        }}
        className={`w-20 rounded-lg border px-2 py-1.5 text-sm ${parsed === null ? "border-red-400 bg-red-50" : "border-stone-300 bg-stone-50"}`}
      />
      {dirty ? (
        <button type="button" onClick={() => void commit()} disabled={parsed === null || saving} className={smallBtn}>
          {saving ? <LoaderCircle size={12} className="animate-spin" /> : null} Save
        </button>
      ) : (
        <StockBadge stock={product.stock ?? 0} />
      )}
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState<{ kind: "one"; product: ProductRecord } | { kind: "bulk" } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const [productData, categoryData, collectionData] = await Promise.all([
        adminFetch<ProductRecord[]>("/api/products"),
        adminFetch<CategoryRecord[]>("/api/categories"),
        adminFetch<CollectionRecord[]>("/api/collections"),
      ]);
      setProducts(productData);
      setCategories(categoryData);
      setCollections(collectionData);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      // Dashboard cards deep-link here with ?stock=low / ?stock=out / ?status=active
      const params = new URLSearchParams(window.location.search);
      const stock = params.get("stock");
      const status = params.get("status");
      if (stock === "low" || stock === "out" || stock === "in") setStockFilter(stock);
      if (status === "active" || status === "draft" || status === "inactive") setStatusFilter(status);
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const categoryName = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return products.filter((product) => {
      if (needle && !`${product.name} ${product.sku ?? ""}`.toLowerCase().includes(needle)) return false;
      if (stockFilter !== "all" && stockState(product.stock) !== stockFilter) return false;
      if (statusFilter !== "all" && product.status !== statusFilter) return false;
      if (categoryFilter !== "all" && product.categoryId !== categoryFilter) return false;
      return true;
    });
  }, [products, search, stockFilter, statusFilter, categoryFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const allVisibleSelected = visible.length > 0 && visible.every((product) => selected.has(product.id));
  const selectedIds = [...selected].filter((id) => products.some((product) => product.id === id));
  const featuredCount = products.filter((product) => product.featured).length;
  const hasFilters = Boolean(search) || stockFilter !== "all" || statusFilter !== "all" || categoryFilter !== "all";

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visible.forEach((product) => next.delete(product.id));
      else visible.forEach((product) => next.add(product.id));
      return next;
    });
  }

  function openCreate() {
    setEditingId(null);
    setDraft({ ...emptyDraft, categoryId: categories[0]?.id ?? "" });
    setErrors({});
    setFormError("");
    setPanelOpen(true);
  }

  function openEdit(product: ProductRecord) {
    setEditingId(product.id);
    setDraft({
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription ?? "",
      description: product.description ?? "",
      price: String(product.price ?? ""),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
      sku: product.sku ?? "",
      stock: String(product.stock ?? 0),
      categoryId: product.categoryId,
      collectionId: product.collectionId ?? "",
      status: product.status ?? (product.active ? "active" : "inactive"),
      featured: Boolean(product.featured),
      image: product.image ?? "",
      material: product.material ?? "",
      dimensions: product.dimensions ?? "",
      color: product.color ?? "",
      customizable: Boolean(product.customizable),
      gallery: (product.images ?? []).filter((image) => image && image !== product.image),
      seoTitle: product.seoTitle ?? "",
      seoDescription: product.seoDescription ?? "",
    });
    setErrors({});
    setFormError("");
    setPanelOpen(true);
  }

  function validate() {
    const next: Partial<Record<keyof Draft, string>> = {};
    if (!draft.name.trim()) next.name = "Name is required.";
    const price = Number(draft.price);
    if (draft.price === "" || !Number.isFinite(price) || price < 0) next.price = "Enter a price of 0 or more.";
    if (draft.compareAtPrice !== "") {
      const compare = Number(draft.compareAtPrice);
      if (!Number.isFinite(compare) || compare < 0) next.compareAtPrice = "Enter a valid amount.";
      else if (Number.isFinite(price) && compare !== 0 && compare <= price) next.compareAtPrice = "Must be higher than the price.";
    }
    if (parseStock(draft.stock) === null) next.stock = "Whole number, 0 or more.";
    if (!draft.categoryId) next.categoryId = "Choose a category.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    setFormError("");
    if (!validate()) return;
    setSaving(true);

    const mainImage = draft.image || (editingId ? "" : PLACEHOLDER_IMAGE);
    const payload = {
      name: draft.name.trim(),
      slug: draft.slug.trim() || undefined,
      shortDescription: draft.shortDescription,
      description: draft.description,
      price: Number(draft.price),
      compareAtPrice: draft.compareAtPrice === "" ? null : Number(draft.compareAtPrice),
      sku: draft.sku.trim() || undefined,
      stock: parseStock(draft.stock),
      categoryId: draft.categoryId,
      collectionId: draft.collectionId,
      status: draft.status,
      featured: draft.featured,
      image: mainImage,
      images: [mainImage, ...draft.gallery].filter((image, index, all) => image && all.indexOf(image) === index),
      material: draft.material,
      dimensions: draft.dimensions,
      color: draft.color,
      customizable: draft.customizable,
      seoTitle: draft.seoTitle,
      seoDescription: draft.seoDescription,
    };

    try {
      if (editingId) await adminFetch(`/api/products/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      else await adminFetch("/api/products", { method: "POST", body: JSON.stringify(payload) });
      setPanelOpen(false);
      setNotice({ tone: "success", text: editingId ? "Product updated." : "Product created." });
      await load();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save the product.");
    } finally {
      setSaving(false);
    }
  }

  async function saveStock(product: ProductRecord, stock: number) {
    try {
      const updated = await adminFetch<ProductRecord>(`/api/products/${product.id}`, { method: "PUT", body: JSON.stringify({ stock }) });
      setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, stock: updated.stock, availability: updated.availability } : item)));
      setNotice({ tone: "success", text: `Stock for "${product.name}" set to ${stock}.` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Could not update stock." });
    }
  }

  async function toggleStatus(product: ProductRecord) {
    const status = product.status === "active" ? "inactive" : "active";
    try {
      await adminFetch(`/api/products/${product.id}`, { method: "PUT", body: JSON.stringify({ status }) });
      setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, status, active: status === "active" } : item)));
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Could not update status." });
    }
  }

  async function bulk(action: "activate" | "deactivate") {
    setBusy(true);
    try {
      const result = await adminFetch<{ affected: number }>("/api/admin/products/bulk", { method: "POST", body: JSON.stringify({ ids: selectedIds, action }) });
      setNotice({ tone: "success", text: `${selectedIds.length} product${selectedIds.length === 1 ? "" : "s"} ${action === "activate" ? "activated" : "deactivated"}${result.affected !== selectedIds.length ? ` (${result.affected} changed)` : ""}.` });
      setSelected(new Set());
      await load();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Bulk action failed." });
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === "one") {
        await adminFetch(`/api/products/${confirm.product.id}`, { method: "DELETE" });
        setNotice({ tone: "success", text: `"${confirm.product.name}" deleted.` });
        setSelected((current) => {
          const next = new Set(current);
          next.delete(confirm.product.id);
          return next;
        });
      } else {
        const result = await adminFetch<{ affected: number }>("/api/admin/products/bulk", { method: "POST", body: JSON.stringify({ ids: selectedIds, action: "delete" }) });
        setNotice({ tone: "success", text: `${result.affected} product${result.affected === 1 ? "" : "s"} deleted.` });
        setSelected(new Set());
      }
      setConfirm(null);
      await load();
    } catch (error) {
      setConfirm(null);
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Could not delete." });
    } finally {
      setBusy(false);
    }
  }

  const field = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const selectCls = `${inputCls} sm:w-auto`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Products & inventory"
        description={`Stock of ${LOW_STOCK_THRESHOLD} or fewer is flagged as low. A product at 0 shows as out of stock on the storefront.`}
        actions={
          <button type="button" onClick={openCreate} className={primaryBtn}>
            <Plus size={16} /> Add product
          </button>
        }
      />

      {notice ? <Alert tone={notice.tone} onDismiss={() => setNotice(null)}>{notice.text}</Alert> : null}
      <FeaturedProductSelection products={products} loading={loading} loadError={loadError} onRefresh={load} />

      <div className={cardCls}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search by name or SKU"
              aria-label="Search products"
              className={`${inputCls} pl-9`}
            />
          </div>
          <select aria-label="Filter by stock" value={stockFilter} onChange={(event) => { setStockFilter(event.target.value as StockFilter); setPage(1); }} className={selectCls}>
            <option value="all">All stock levels</option>
            <option value="in">In stock</option>
            <option value="low">Low stock (5 or fewer)</option>
            <option value="out">Out of stock</option>
          </select>
          <select aria-label="Filter by status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as StatusFilter); setPage(1); }} className={selectCls}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
          <select aria-label="Filter by category" value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1); }} className={selectCls}>
            <option value="all">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>

        {selectedIds.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-stone-100 px-3 py-2.5 text-sm" role="region" aria-label="Bulk actions">
            <span className="mr-2 font-medium">{selectedIds.length} selected</span>
            <button type="button" className={smallBtn} disabled={busy} onClick={() => void bulk("activate")}>Activate</button>
            <button type="button" className={smallBtn} disabled={busy} onClick={() => void bulk("deactivate")}>Deactivate</button>
            <button type="button" className={smallDangerBtn} disabled={busy} onClick={() => setConfirm({ kind: "bulk" })}><Trash2 size={12} /> Delete</button>
            <button type="button" className="ml-auto text-xs underline" onClick={() => setSelected(new Set())}>Clear selection</button>
          </div>
        ) : null}

        {loading ? (
          <Spinner label="Loading products" />
        ) : loadError ? (
          <div className="mt-4"><Alert onRetry={() => { setLoading(true); void load(); }}>{loadError}</Alert></div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No products yet"
            text={categories.length === 0 ? "Create a category first, then add your first product." : "Add your first product to start selling."}
            action={categories.length === 0 ? <Link href="/admin/categories" className={primaryBtn}>Create a category</Link> : <button type="button" onClick={openCreate} className={primaryBtn}><Plus size={16} /> Add product</button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No products match these filters"
            action={hasFilters ? <button type="button" className={secondaryBtn} onClick={() => { setSearch(""); setStockFilter("all"); setStatusFilter("all"); setCategoryFilter("all"); setPage(1); }}>Clear filters</button> : undefined}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="w-8 pb-3 pr-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Select all products on this page" /></th>
                    <th className="pb-3 pr-4 font-medium">Product</th>
                    <th className="pb-3 pr-4 font-medium">Category</th>
                    <th className="pb-3 pr-4 font-medium">Price</th>
                    <th className="pb-3 pr-4 font-medium">Stock</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((product) => (
                    <tr key={product.id} className="border-b border-stone-100 align-middle">
                      <td className="py-3 pr-3"><input type="checkbox" checked={selected.has(product.id)} onChange={() => toggleOne(product.id)} aria-label={`Select ${product.name}`} /></td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          {product.image ? <img src={product.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <div className="h-12 w-12 shrink-0 rounded-lg bg-stone-200" />}
                          <div className="min-w-0">
                            <div className="font-medium">{product.name}{product.featured ? <span className="ml-2 text-[10px] uppercase tracking-widest text-amber-700">Featured</span> : null}</div>
                            <div className="text-xs text-stone-500">{product.sku || "No SKU"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">{categoryName.get(product.categoryId) ?? <span className="text-stone-400">Unknown</span>}</td>
                      <td className="whitespace-nowrap py-3 pr-4">
                        {formatPKR(product.price)}
                        {product.compareAtPrice ? <div className="text-xs text-stone-400 line-through">{formatPKR(product.compareAtPrice)}</div> : null}
                      </td>
                      <td className="py-3 pr-4"><StockEditor key={`${product.id}-${product.stock}`} product={product} onSave={saveStock} /></td>
                      <td className="py-3 pr-4">
                        <button type="button" onClick={() => void toggleStatus(product)} disabled={product.status === "draft"} title={product.status === "draft" ? "Open Edit to publish this draft" : "Click to toggle active / inactive"} className="disabled:cursor-default">
                          <StatusBadge status={product.status} />
                        </button>
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => openEdit(product)} className={smallBtn}><Pencil size={12} /> Edit</button>
                          <button type="button" onClick={() => setConfirm({ kind: "one", product })} className={smallDangerBtn} aria-label={`Delete ${product.name}`}><Trash2 size={12} /> Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="mt-4 space-y-3 md:hidden">
              {visible.map((product) => (
                <li key={product.id} className="rounded-xl border border-stone-200 p-3">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" checked={selected.has(product.id)} onChange={() => toggleOne(product.id)} aria-label={`Select ${product.name}`} />
                    {product.image ? <img src={product.image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" /> : <div className="h-14 w-14 shrink-0 rounded-lg bg-stone-200" />}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-stone-500">{product.sku || "No SKU"} · {categoryName.get(product.categoryId) ?? "Unknown"}</div>
                      <div className="mt-1 text-sm">{formatPKR(product.price)}</div>
                    </div>
                    <StatusBadge status={product.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <StockEditor key={`${product.id}-${product.stock}`} product={product} onSave={saveStock} />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(product)} className={smallBtn}>Edit</button>
                      <button type="button" onClick={() => setConfirm({ kind: "one", product })} className={smallDangerBtn} aria-label={`Delete ${product.name}`}>Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between pt-3 text-xs text-stone-500">
              <span>{filtered.length} product{filtered.length === 1 ? "" : "s"}{hasFilters ? " match" : ""}</span>
            </div>
            <Pagination page={currentPage} pages={pages} onChange={setPage} />
          </>
        )}
      </div>

      <SidePanel
        open={panelOpen}
        title={editingId ? "Edit product" : "Add product"}
        onClose={() => { if (!saving) setPanelOpen(false); }}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button type="button" className={secondaryBtn} onClick={() => setPanelOpen(false)} disabled={saving}>Cancel</button>
            <button type="button" className={primaryBtn} onClick={() => void handleSave()} disabled={saving}>
              {saving ? <LoaderCircle size={14} className="animate-spin" /> : null}
              {saving ? "Saving..." : editingId ? "Save changes" : "Create product"}
            </button>
          </div>
        }
      >
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void handleSave(); }} noValidate>
          {formError ? <Alert>{formError}</Alert> : null}
          {categories.length === 0 ? <Alert tone="info">You need a category before adding products. <Link href="/admin/categories" className="underline">Create one</Link>.</Alert> : null}

          <Field label="Product name" htmlFor="p-name" error={errors.name}>
            <input id="p-name" value={draft.name} onChange={(event) => field("name", event.target.value)} className={inputCls} placeholder="e.g. Walnut table lamp" />
          </Field>
          <Field label="Slug" htmlFor="p-slug" hint="Used in the product URL. Leave blank to generate it from the name.">
            <input id="p-slug" value={draft.slug} onChange={(event) => field("slug", event.target.value)} className={inputCls} />
          </Field>
          <Field label="Short description" htmlFor="p-short">
            <textarea id="p-short" value={draft.shortDescription} onChange={(event) => field("shortDescription", event.target.value)} className={`${inputCls} min-h-20`} />
          </Field>
          <Field label="Full description" htmlFor="p-desc">
            <textarea id="p-desc" value={draft.description} onChange={(event) => field("description", event.target.value)} className={`${inputCls} min-h-28`} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (PKR)" htmlFor="p-price" error={errors.price}>
              <input id="p-price" type="number" min={0} step="any" inputMode="decimal" value={draft.price} onChange={(event) => field("price", event.target.value)} className={inputCls} />
            </Field>
            <Field label="Compare-at price (PKR)" htmlFor="p-compare" error={errors.compareAtPrice} hint="Optional. Shown struck through.">
              <input id="p-compare" type="number" min={0} step="any" inputMode="decimal" value={draft.compareAtPrice} onChange={(event) => field("compareAtPrice", event.target.value)} className={inputCls} />
            </Field>
            <Field label="Stock quantity" htmlFor="p-stock" error={errors.stock} hint="0 marks the product as out of stock.">
              <input id="p-stock" type="number" min={0} step={1} inputMode="numeric" value={draft.stock} onChange={(event) => field("stock", event.target.value)} className={inputCls} />
            </Field>
            <Field label="SKU" htmlFor="p-sku" hint="Blank = auto-generated.">
              <input id="p-sku" value={draft.sku} onChange={(event) => field("sku", event.target.value)} className={inputCls} />
            </Field>
            <Field label="Category" htmlFor="p-cat" error={errors.categoryId}>
              <select id="p-cat" value={draft.categoryId} onChange={(event) => field("categoryId", event.target.value)} className={inputCls}>
                <option value="">Select a category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </Field>
            <Field label="Collection" htmlFor="p-col">
              <select id="p-col" value={draft.collectionId} onChange={(event) => field("collectionId", event.target.value)} className={inputCls}>
                <option value="">None</option>
                {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
              </select>
            </Field>
            <Field label="Status" htmlFor="p-status" hint="Only Active products appear on the storefront.">
              <select id="p-status" value={draft.status} onChange={(event) => field("status", event.target.value as Draft["status"])} className={inputCls}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <div className="self-end">
              <label className="flex items-center gap-2 pb-2.5 text-sm">
                <input type="checkbox" checked={draft.featured} disabled={!draft.featured && featuredCount >= MAX_FEATURED_PRODUCTS} onChange={(event) => field("featured", event.target.checked)} /> Show in Featured Products
              </label>
              {!draft.featured && featuredCount >= MAX_FEATURED_PRODUCTS ? <p className="text-xs text-amber-700">Maximum of {MAX_FEATURED_PRODUCTS} featured products reached.</p> : null}
            </div>
          </div>

          <fieldset className="space-y-4 rounded-xl border border-stone-200 p-4">
            <legend className="px-1 text-sm font-medium text-stone-700">Pictures</legend>
            <p className="text-xs text-stone-500">
              Main image + up to {MAX_PRODUCT_IMAGES - 1} more ({MAX_PRODUCT_IMAGES} in total). The main image is the one shown in listings; customers can browse all of them on the product page.
              {!editingId ? " A placeholder is used as the main image if you do not upload one." : ""}
            </p>
            <ImageUpload value={draft.image} onChange={(image) => field("image", image)} label="Main image" />
            <GalleryField label="Extra image" values={draft.gallery} onChange={(gallery) => field("gallery", gallery)} max={MAX_PRODUCT_IMAGES - 1} />
          </fieldset>

          <fieldset className="space-y-4 rounded-xl border border-stone-200 p-4">
            <legend className="px-1 text-sm font-medium text-stone-700">Details shown on the product page</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Material" htmlFor="p-material"><input id="p-material" value={draft.material} onChange={(event) => field("material", event.target.value)} className={inputCls} placeholder="e.g. Seasoned walnut" /></Field>
              <Field label="Colour" htmlFor="p-color"><input id="p-color" value={draft.color} onChange={(event) => field("color", event.target.value)} className={inputCls} /></Field>
              <div className="sm:col-span-2"><Field label="Dimensions" htmlFor="p-dim"><input id="p-dim" value={draft.dimensions} onChange={(event) => field("dimensions", event.target.value)} className={inputCls} placeholder="e.g. 30 x 18 cm" /></Field></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.customizable} onChange={(event) => field("customizable", event.target.checked)} /> Custom sizes and finishes available</label>
          </fieldset>

          <details className="rounded-xl border border-stone-200 p-4">
            <summary className="cursor-pointer text-sm font-medium text-stone-700">Search engine text (optional)</summary>
            <div className="mt-4 space-y-4">
              <Field label="SEO title" htmlFor="p-seo-t"><input id="p-seo-t" value={draft.seoTitle} onChange={(event) => field("seoTitle", event.target.value)} className={inputCls} maxLength={120} /></Field>
              <Field label="SEO description" htmlFor="p-seo-d"><textarea id="p-seo-d" value={draft.seoDescription} onChange={(event) => field("seoDescription", event.target.value)} className={`${inputCls} min-h-20`} maxLength={320} /></Field>
            </div>
          </details>
        </form>
      </SidePanel>

      <ConfirmDialog
        open={confirm !== null}
        destructive
        busy={busy}
        title={confirm?.kind === "bulk" ? `Delete ${selectedIds.length} products?` : "Delete this product?"}
        message={confirm?.kind === "one" ? <>This permanently removes <strong>{confirm.product.name}</strong> from the catalog. Past orders keep their own copy of the item details. This cannot be undone.</> : <>This permanently removes {selectedIds.length} selected products. This cannot be undone.</>}
        confirmLabel="Delete"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
