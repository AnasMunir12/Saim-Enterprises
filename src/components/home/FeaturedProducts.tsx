"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";

type ProductItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  image: string;
  detail: string;
  rating: number;
  reviews: number;
  badge?: string;
  featured?: boolean;
  bestseller?: boolean;
};

export function FeaturedProducts() {
  const [products, setProducts] = useState<ProductItem[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as Array<{
          id: string;
          name: string;
          slug: string;
          price: number;
          categoryId?: string;
          image?: string;
          shortDescription?: string;
          description?: string;
          featured?: boolean;
          active?: boolean;
        }>;

        const mapped = data
          .filter((item) => item.featured && item.active !== false)
          .map((item) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            price: item.price,
            category: item.categoryId ?? "Featured",
            image: item.image ?? "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=85",
            detail: item.shortDescription ?? item.description ?? "",
            rating: 4.9,
            reviews: 12,
            featured: true,
          }));

        if (mounted) {
          setProducts(mapped.slice(0, 4));
        }
      } catch {
        if (mounted) setProducts([]);
      }
    }

    void loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="section-pad featured-section" id="shop">
      <div className="section-row">
        <SectionHeading eyebrow="The edit" title="Pieces to keep." />
        <Link className="text-link" href="/catalog">
          View all pieces <span>↗</span>
        </Link>
      </div>
      {products.length ? <ProductGrid products={products} /> : <p className="empty-state">No featured products found.</p>}
    </section>
  );
}
