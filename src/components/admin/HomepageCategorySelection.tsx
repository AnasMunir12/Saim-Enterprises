"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alert, EmptyState, Spinner, cardCls, primaryBtn, smallBtn } from "@/components/admin/ui";
import { adminFetch } from "@/lib/admin-fetch";
import { HOMEPAGE_CATEGORY_LIMIT, sectionId, type ResolvedSection } from "@/lib/homepage-sections";
import type { CategoryRecord } from "@/lib/site-data";

type SelectionData = {
  categories: CategoryRecord[];
  categoryIds: string[] | null;
};

export function HomepageCategorySelection() {
  const [data, setData] = useState<SelectionData | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const loadCategories = useCallback(async () => {
    setError("");
    try {
      const categories = await adminFetch<CategoryRecord[]>("/api/categories", { cache: "no-store" });
      setData((current) => current ? { ...current, categories } : { categories, categoryIds: null });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not refresh categories.");
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [categories, sections] = await Promise.all([
        adminFetch<CategoryRecord[]>("/api/categories", { cache: "no-store" }),
        adminFetch<ResolvedSection[]>("/api/content/homepage", { cache: "no-store" }),
      ]);
      const savedIds = sections.find((section) => section.key === "collections")?.categoryIds ?? null;
      setData({ categories, categoryIds: savedIds });
      setSelectedIds(savedIds ?? categories.filter((category) => category.active).slice(0, HOMEPAGE_CATEGORY_LIMIT).map((category) => category.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load homepage category settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const refresh = () => void loadCategories();
    window.addEventListener("category-records-changed", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("category-records-changed", refresh);
    };
  }, [load, loadCategories]);

  function toggle(id: string, checked: boolean) {
    setMessage("");
    if (checked) {
      if (selectedIds.length >= HOMEPAGE_CATEGORY_LIMIT) {
        setMessage(`You can select up to ${HOMEPAGE_CATEGORY_LIMIT} categories. Remove one before selecting another.`);
        return;
      }
      setSelectedIds((current) => [...current, id]);
    } else {
      setSelectedIds((current) => current.filter((selectedId) => selectedId !== id));
    }
  }

  function move(id: string, direction: -1 | 1) {
    setSelectedIds((current) => {
      const index = current.indexOf(id);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  async function save() {
    if (!data || invalidIds.length || selectedIds.length > HOMEPAGE_CATEGORY_LIMIT) return;
    setSaving(true);
    setError("");
    setSavedMessage("");
    try {
      await adminFetch<ResolvedSection>(`/api/content/homepage/${encodeURIComponent(sectionId("collections"))}`, {
        method: "PUT",
        body: JSON.stringify({ categoryIds: selectedIds }),
      });
      setData((current) => current ? { ...current, categoryIds: selectedIds } : current);
      setSavedMessage("Homepage category selection saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save homepage category selection.");
    } finally {
      setSaving(false);
    }
  }

  const categories = data?.categories ?? [];
  const invalidIds = selectedIds.filter((id) => !categories.some((category) => category.id === id && category.active));
  const hasUnavailable = selectedIds.some((id) => !categories.some((category) => category.id === id));

  return (
    <section className={`${cardCls} space-y-5`} aria-labelledby="homepage-category-selection-title">
      <div>
        <h2 id="homepage-category-selection-title" className="text-xl font-semibold tracking-tight">Homepage Category Selection</h2>
        <p className="mt-1 text-sm text-stone-500">Choose and order up to {HOMEPAGE_CATEGORY_LIMIT} active categories. This does not change whether a category is active on the storefront.</p>
      </div>

      {error ? <Alert onRetry={() => void load()}>{error}</Alert> : null}
      {savedMessage ? <Alert tone="success">{savedMessage}</Alert> : null}
      {message ? <Alert tone="info">{message}</Alert> : null}
      {data?.categoryIds === null ? <Alert tone="info">No selection has been saved yet. The homepage currently uses the first active categories in the default order until you save a selection.</Alert> : null}

      {loading ? <Spinner label="Loading homepage category selection" /> : !data ? (
        <EmptyState title="Homepage category settings are unavailable." text="Retry loading the category list and saved selection." />
      ) : (
        <>
          <p className="text-sm font-medium text-stone-700" aria-live="polite">{selectedIds.length} of {HOMEPAGE_CATEGORY_LIMIT} selected</p>

          {selectedIds.length ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-stone-700">Homepage display order</h3>
              <ol className="space-y-2">
                {selectedIds.map((id, index) => {
                  const category = categories.find((item) => item.id === id);
                  return (
                    <li key={id} className="flex items-center gap-3 rounded-xl border border-stone-200 p-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600">{index + 1}</span>
                      {category?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- category images may be stored on arbitrary upload hosts
                        <img src={category.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                      ) : <div className="h-12 w-12 shrink-0 rounded-lg bg-stone-100" aria-hidden="true" />}
                      <span className="min-w-0 flex-1 break-words text-sm font-medium text-stone-800">{category?.name ?? "Unavailable category"}</span>
                      {category && !category.active ? <span className="text-xs text-amber-700">Inactive</span> : null}
                      {!category ? (
                        <button type="button" className={smallBtn} onClick={() => toggle(id, false)}>Remove</button>
                      ) : (
                        <>
                          <button type="button" className={smallBtn} disabled={index === 0} onClick={() => move(id, -1)} aria-label={`Move ${category.name} up`}><ArrowUp size={14} /></button>
                          <button type="button" className={smallBtn} disabled={index === selectedIds.length - 1} onClick={() => move(id, 1)} aria-label={`Move ${category.name} down`}><ArrowDown size={14} /></button>
                          <button type="button" className={smallBtn} onClick={() => toggle(id, false)}>Remove</button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : <p className="text-sm text-stone-500">No categories selected. Saving this will hide the category grid on the homepage.</p>}

          {hasUnavailable ? <Alert>Some saved selections refer to categories that are no longer available. Remove them before saving.</Alert> : null}
          {invalidIds.some((id) => categories.some((category) => category.id === id && !category.active)) ? <Alert>Remove inactive categories from the selection before saving.</Alert> : null}
          {selectedIds.length > HOMEPAGE_CATEGORY_LIMIT ? <Alert>The saved selection exceeds the allowed limit. Remove categories before saving.</Alert> : null}

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold text-stone-700">All categories</legend>
            {categories.length === 0 ? <p className="text-sm text-stone-500">Create a category above to make it available here.</p> : null}
            {categories.map((category) => {
              const selected = selectedIds.includes(category.id);
              return (
                <label key={category.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-3">
                  {category.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- category images may be stored on arbitrary upload hosts
                    <img src={category.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  ) : <div className="h-12 w-12 shrink-0 rounded-lg bg-stone-100" aria-hidden="true" />}
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-medium text-stone-800">{category.name}</span>
                    <span className={`text-xs ${category.active ? "text-emerald-700" : "text-stone-500"}`}>{category.active ? "Active" : "Inactive"}</span>
                    {selected ? <span className="ml-2 text-xs font-medium text-stone-500">Homepage order {selectedIds.indexOf(category.id) + 1}</span> : null}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-stone-700">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={!category.active && !selected}
                      onChange={(event) => toggle(category.id, event.currentTarget.checked)}
                    />
                    Show on Homepage
                  </span>
                </label>
              );
            })}
          </fieldset>

          <button type="button" className={primaryBtn} disabled={saving || invalidIds.length > 0 || selectedIds.length > HOMEPAGE_CATEGORY_LIMIT} onClick={() => void save()}>{saving ? "Saving..." : "Save Changes"}</button>
        </>
      )}
    </section>
  );
}
