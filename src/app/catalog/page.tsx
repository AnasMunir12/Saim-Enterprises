"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useEffect } from "react";
import { PageChrome } from "@/components/layout/PageChrome";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product } from "@/lib/products";

export default function CatalogPage() {
  const [category, setCategory] = useState("All pieces");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["All pieces"]);

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
        ]);

        if (!productsResponse.ok || !categoriesResponse.ok) {
          return;
        }

        const productData = (await productsResponse.json()) as Array<Record<string, unknown>>;
        const categoryData = (await categoriesResponse.json()) as Array<{ id: string; name: string; active?: boolean }>;
        const categoryNames = new Map(categoryData.map((item) => [item.id, item.name]));
        const mappedProducts = productData
          .filter((item) => item.active !== false && item.status !== "inactive")
          .map((item) => ({
            id: String(item.id),
            name: String(item.name),
            slug: String(item.slug),
            price: Number(item.price),
            category: categoryNames.get(String(item.categoryId)) ?? "Uncategorized",
            image: String(item.image ?? ""),
            detail: String(item.shortDescription ?? item.description ?? ""),
            rating: 0,
            reviews: 0,
            featured: Boolean(item.featured),
          }));

        if (mounted) {
          setProducts(mappedProducts);
          setCategories(["All pieces", ...categoryData.filter((item) => item.active !== false).map((item) => item.name)]);
        }
      } catch {
        // The catalog remains empty until the API is available.
      }
    }

    void loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  const visible = useMemo(() => products.filter((product) => category === "All pieces" || product.category === category).filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())), [category, products, query]);
  return <PageChrome><section className="page-hero"><p className="eyebrow">The complete collection</p><h1>Objects with<br /><em>a little soul.</em></h1></section><section className="section-pad"><div className="catalog-toolbar"><div className="catalog-tabs">{categories.map((item) => <button className={`catalog-tab ${category === item ? "active" : ""}`} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div><label className="catalog-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pieces" aria-label="Search catalog" /></label></div>{visible.length ? <ProductGrid products={visible} /> : <p className="empty-state">No products found.</p>}</section></PageChrome>;
}
