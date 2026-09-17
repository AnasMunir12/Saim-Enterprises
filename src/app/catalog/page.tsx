"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PageChrome } from "@/components/layout/PageChrome";
import { ProductGrid } from "@/components/product/ProductGrid";
import { categories, products } from "@/lib/products";

export default function CatalogPage() {
  const [category, setCategory] = useState("All pieces");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => products.filter((product) => category === "All pieces" || product.category === category).filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  return <PageChrome><section className="page-hero"><p className="eyebrow">The complete collection</p><h1>Objects with<br /><em>a little soul.</em></h1></section><section className="section-pad"><div className="catalog-toolbar"><div className="catalog-tabs">{categories.map((item) => <button className={`catalog-tab ${category === item ? "active" : ""}`} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div><label className="catalog-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pieces" aria-label="Search catalog" /></label></div><ProductGrid products={visible} /></section></PageChrome>;
}
