"use client";

import { useState } from "react";
import { Alert, EmptyState, Spinner, cardCls, primaryBtn } from "@/components/admin/ui";
import { adminFetch } from "@/lib/admin-fetch";
import { MAX_FEATURED_PRODUCTS } from "@/lib/products";
import type { ProductRecord } from "@/lib/site-data";

export function FeaturedProductSelection({
  products,
  loading,
  loadError,
  onRefresh,
}: {
  products: ProductRecord[];
  loading: boolean;
  loadError: string;
  onRefresh: () => Promise<void>;
}) {
  const [draftSelection, setDraftSelection] = useState<{ signature: string; ids: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const baselineIds = products.filter((product) => product.featured).map((product) => product.id);
  const signature = JSON.stringify(products.map((product) => [product.id, Boolean(product.featured)]));
  const selectedIds = draftSelection?.signature === signature ? draftSelection.ids : baselineIds;

  function toggle(id: string, checked: boolean) {
    if (checked && !selectedIds.includes(id) && selectedIds.length >= MAX_FEATURED_PRODUCTS) {
      setMessage({ tone: "error", text: `You can select up to ${MAX_FEATURED_PRODUCTS} featured products. Remove one before selecting another.` });
      return;
    }
    setMessage(null);
    setDraftSelection({
      signature,
      ids: checked
        ? selectedIds.includes(id) ? selectedIds : [...selectedIds, id]
        : selectedIds.filter((selectedId) => selectedId !== id),
    });
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const selected = new Set(selectedIds);
    const changes = products.filter((product) => Boolean(product.featured) !== selected.has(product.id));
    const failed: string[] = [];
    const orderedChanges = [
      ...changes.filter((product) => !selected.has(product.id)),
      ...changes.filter((product) => selected.has(product.id)),
    ];
    for (const product of orderedChanges) {
      try {
        await adminFetch(`/api/products/${encodeURIComponent(product.id)}`, {
          method: "PUT",
          body: JSON.stringify({ featured: selected.has(product.id) }),
        });
      } catch {
        failed.push(product.name);
      }
    }
    await onRefresh();
    if (failed.length) {
      setMessage({
        tone: "error",
        text: `Could not update ${failed.length} product${failed.length === 1 ? "" : "s"}: ${failed.join(", ")}. Successful changes were saved; retry after checking these products.`,
      });
    } else {
      setMessage({ tone: "success", text: "Featured Products selection saved." });
    }
    setSaving(false);
  }

  const count = selectedIds.length;
  const canSave = products.some((product) => Boolean(product.featured) !== selectedIds.includes(product.id));

  return (
    <section className={`${cardCls} space-y-4`} aria-labelledby="featured-product-selection-heading">
      <div>
        <h2 id="featured-product-selection-heading" className="text-xl font-semibold tracking-tight">Featured Products Selection</h2>
        <p className="mt-1 text-sm text-stone-500">Choose up to five products shown in the homepage carousel. Only active, published products appear on the storefront.</p>
      </div>
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      {loading ? <Spinner label="Loading product selection" /> : loadError ? (
        <Alert onRetry={() => void onRefresh()}>{loadError}</Alert>
      ) : products.length === 0 ? (
        <EmptyState title="No products are available yet." text="Add a product to make it available for selection." />
      ) : (
        <>
          <p className="text-sm font-medium text-stone-700" aria-live="polite">{count} selected</p>
          {count >= MAX_FEATURED_PRODUCTS ? (
            <Alert tone="info">A maximum of {MAX_FEATURED_PRODUCTS} products can be featured on the homepage. Unselect one before choosing another.</Alert>
          ) : null}
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-label="Choose featured products">
            {products.map((product) => {
              const checked = selectedIds.includes(product.id);
              const eligible = product.active !== false && product.status === "active";
              return (
                <li key={product.id}>
                  <label className="flex h-full cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-3 transition-colors hover:border-stone-400">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- product images may come from arbitrary upload hosts
                      <img src={product.image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                    ) : <div className="h-14 w-14 shrink-0 rounded-lg bg-stone-100" aria-hidden="true" />}
                    <span className="min-w-0 flex-1">
                      <span className="block line-clamp-2 break-words text-sm font-medium text-stone-800">{product.name}</span>
                      <span className={`text-xs ${eligible ? "text-emerald-700" : "text-stone-500"}`}>
                        {eligible ? "Active" : product.status === "draft" ? "Draft" : "Inactive"}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-stone-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={saving || (!eligible && !checked) || (!checked && count >= MAX_FEATURED_PRODUCTS)}
                        onChange={(event) => toggle(product.id, event.currentTarget.checked)}
                      />
                      Show in Featured Products
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <button type="button" className={primaryBtn} disabled={!canSave || saving || Boolean(loadError)} onClick={() => void save()}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </>
      )}
    </section>
  );
}
