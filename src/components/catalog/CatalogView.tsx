"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductGrid";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCatalog } from "@/components/useCatalog";
import { isSoldOut, soldOutLast, type Product } from "@/lib/products";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

const isSort = (value: string | null): value is Sort => SORTS.some((sort) => sort.value === value);
const positive = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

function sortProducts(products: Product[], sort: Sort) {
  const byDate = (a: Product, b: Product) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  const list = [...products];
  if (sort === "price-asc") list.sort((a, b) => a.price - b.price || byDate(a, b));
  else if (sort === "price-desc") list.sort((a, b) => b.price - a.price || byDate(a, b));
  else if (sort === "featured") list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || byDate(a, b));
  else list.sort(byDate);
  // Sold-out pieces stay visible but always come after what can be bought.
  return soldOutLast(list);
}

export function CatalogView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { products, categories, collections, status, reload } = useCatalog();

  const categoryParam = params.get("category") ?? "";
  const collectionParam = params.get("collection") ?? "";
  const q = params.get("q") ?? "";
  const minParam = params.get("min") ?? "";
  const maxParam = params.get("max") ?? "";
  const sortParam = params.get("sort");
  const sort: Sort = isSort(sortParam) ? sortParam : "newest";
  const inStockOnly = params.get("instock") === "1";
  const saleOnly = params.get("sale") === "1";

  // Typed fields are held locally and pushed to the URL after a short pause.
  const [draft, setDraft] = useState({ q, min: minParam, max: maxParam });
  const lastPushed = useRef({ q, min: minParam, max: maxParam });
  const searchRef = useRef<HTMLInputElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  // Follow the URL when it changes from outside (back/forward, a link from the homepage).
  useEffect(() => {
    const current = { q, min: minParam, max: maxParam };
    if (current.q !== lastPushed.current.q || current.min !== lastPushed.current.min || current.max !== lastPushed.current.max) {
      lastPushed.current = current;
      setDraft(current);
    }
  }, [q, minParam, maxParam]);

  useEffect(() => {
    if (draft.q === lastPushed.current.q && draft.min === lastPushed.current.min && draft.max === lastPushed.current.max) return;
    const timer = setTimeout(() => {
      lastPushed.current = { ...draft };
      update({ q: draft.q.trim(), min: draft.min, max: draft.max });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `update` is recreated every render by design
  }, [draft]);

  useEffect(() => {
    if (window.location.hash === "#search") searchRef.current?.focus();
  }, []);

  const category = useMemo(() => {
    if (!categoryParam) return null;
    const needle = categoryParam.toLowerCase();
    return categories.find((item) => item.slug.toLowerCase() === needle || item.id === categoryParam || item.name.toLowerCase() === needle) ?? null;
  }, [categories, categoryParam]);

  const collection = useMemo(() => {
    if (!collectionParam) return null;
    const needle = collectionParam.toLowerCase();
    return collections.find((item) => item.slug.toLowerCase() === needle || item.id === collectionParam || item.name.toLowerCase() === needle) ?? null;
  }, [collections, collectionParam]);

  const unknownFilter = (categoryParam && !category && status === "ready") || (collectionParam && !collection && status === "ready");
  const min = positive(minParam);
  const max = positive(maxParam);
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

  const visible = useMemo(() => {
    const filtered = products.filter((product) => {
      if (categoryParam && (!category || product.categoryId !== category.id)) return false;
      if (collectionParam && (!collection || product.collectionId !== collection.id)) return false;
      if (inStockOnly && isSoldOut(product)) return false;
      if (saleOnly && !product.compareAtPrice) return false;
      if (min !== null && product.price < min) return false;
      if (max !== null && product.price > max) return false;
      if (tokens.length) {
        const haystack = `${product.name} ${product.category} ${product.detail} ${product.sku ?? ""} ${(product.tags ?? []).join(" ")}`.toLowerCase();
        if (!tokens.every((token) => haystack.includes(token))) return false;
      }
      return true;
    });
    return sortProducts(filtered, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `tokens` derives from `q`
  }, [products, categoryParam, category, collectionParam, collection, inStockOnly, saleOnly, min, max, q, sort]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) if (product.categoryId) map.set(product.categoryId, (map.get(product.categoryId) ?? 0) + 1);
    return map;
  }, [products]);

  const priceBounds = useMemo(() => {
    const prices = products.map((product) => product.price);
    return prices.length ? { low: Math.min(...prices), high: Math.max(...prices) } : null;
  }, [products]);

  const hasFilters = Boolean(categoryParam || collectionParam || q || minParam || maxParam || inStockOnly || saleOnly);

  function clearAll() {
    lastPushed.current = { q: "", min: "", max: "" };
    setDraft({ q: "", min: "", max: "" });
    router.replace(pathname, { scroll: false });
  }

  const tabs = categories.filter((item) => (counts.get(item.id) ?? 0) > 0 || item.id === category?.id);

  return (
    <section className="section catalog" aria-labelledby="catalog-results-heading">
      <div className="catalog-tabs" role="group" aria-label="Filter by category">
        <button type="button" className={`catalog-tab${!categoryParam ? " is-active" : ""}`} aria-pressed={!categoryParam} onClick={() => update({ category: null })}>
          All pieces <small>{products.length}</small>
        </button>
        {tabs.map((item) => (
          <button
            type="button"
            className={`catalog-tab${category?.id === item.id ? " is-active" : ""}`}
            aria-pressed={category?.id === item.id}
            onClick={() => update({ category: item.slug })}
            key={item.id}
          >
            {item.name} <small>{counts.get(item.id) ?? 0}</small>
          </button>
        ))}
      </div>

      <div className="catalog-controls">
        <label className="catalog-search" id="search">
          <Search size={18} aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            value={draft.q}
            onChange={(event) => setDraft((current) => ({ ...current, q: event.target.value }))}
            placeholder="Search pieces"
            aria-label="Search catalog"
          />
        </label>

        <Button variant="outline" className="filters-toggle" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} aria-controls="catalog-filters">
          <SlidersHorizontal size={16} aria-hidden="true" /> Filters
        </Button>

        <div className={`catalog-filters${filtersOpen ? " is-open" : ""}`} id="catalog-filters">
          <fieldset className="price-filter">
            <legend>Price (PKR)</legend>
            <input
              className="field__control"
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.min}
              onChange={(event) => setDraft((current) => ({ ...current, min: event.target.value }))}
              placeholder={priceBounds ? String(priceBounds.low) : "Min"}
              aria-label="Minimum price"
            />
            <span aria-hidden="true">to</span>
            <input
              className="field__control"
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.max}
              onChange={(event) => setDraft((current) => ({ ...current, max: event.target.value }))}
              placeholder={priceBounds ? String(priceBounds.high) : "Max"}
              aria-label="Maximum price"
            />
          </fieldset>
          <label className="check">
            <input type="checkbox" checked={inStockOnly} onChange={(event) => update({ instock: event.target.checked ? "1" : null })} /> In stock only
          </label>
          <label className="check">
            <input type="checkbox" checked={saleOnly} onChange={(event) => update({ sale: event.target.checked ? "1" : null })} /> On sale
          </label>
          <label className="sort-select">
            <span>Sort by</span>
            <select className="field__control" value={sort} onChange={(event) => update({ sort: event.target.value === "newest" ? null : event.target.value })}>
              {SORTS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="catalog-summary">
        <h2 id="catalog-results-heading" className="sr-only">Results</h2>
        <p aria-live="polite">
          {status === "loading" ? "Loading pieces..." : `${visible.length} ${visible.length === 1 ? "piece" : "pieces"}`}
          {collection ? <> in <strong>{collection.name}</strong></> : null}
        </p>
        <div className="active-filters">
          {collection ? <button type="button" className="chip" onClick={() => update({ collection: null })}>Collection: {collection.name} <X size={14} aria-label="Remove collection filter" /></button> : null}
          {hasFilters ? <button type="button" className="link-arrow" onClick={clearAll}><span>Clear all filters</span></button> : null}
        </div>
      </div>

      {status === "loading" ? (
        <ProductGridSkeleton />
      ) : status === "error" ? (
        <EmptyState role="alert" title="We could not load the collection." actions={<Button onClick={reload}>Try again</Button>}>
          Please check your connection and try again.
        </EmptyState>
      ) : visible.length ? (
        <ProductGrid products={visible} />
      ) : (
        <EmptyState
          title={products.length === 0 ? "Pieces are on their way." : "Nothing matches that search."}
          actions={
            <>
              {hasFilters ? <Button onClick={clearAll}>Clear filters</Button> : null}
              <ArrowLink href="/contact">Ask the studio</ArrowLink>
            </>
          }
        >
          {products.length === 0
            ? "We are preparing the collection. Send the studio a message and we will help you find something."
            : unknownFilter
              ? "That category or collection is not available."
              : "Try removing a filter or searching for something else."}
        </EmptyState>
      )}
    </section>
  );
}
