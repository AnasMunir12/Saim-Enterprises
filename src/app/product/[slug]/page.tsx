"use client";

import { ArrowRight, Heart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { PageChrome } from "@/components/layout/PageChrome";
import { ProductGrid } from "@/components/product/ProductGrid";
import { formatPrice, type Product } from "@/lib/products";

export default function ProductPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const { addToCart, wishlist, toggleWishlist } = useStore();

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) return;

        const data = (await response.json()) as Array<Record<string, unknown>>;
        const mapped = data
          .filter((item) => item.active !== false && item.status !== "inactive")
          .map((item) => ({
            id: String(item.id),
            name: String(item.name),
            slug: String(item.slug),
            price: Number(item.price),
            category: String(item.categoryId ?? "Uncategorized"),
            image: String(item.image ?? ""),
            detail: String(item.description ?? item.shortDescription ?? ""),
            rating: 0,
            reviews: 0,
            featured: Boolean(item.featured),
          }));
        const current = mapped.find((item) => item.slug === params.slug) ?? null;

        if (mounted) {
          setProduct(current);
          setRelatedProducts(mapped.filter((item) => item.slug !== params.slug).slice(0, 4));
        }
      } catch {
        if (mounted) setProduct(null);
      }
    }

    void loadProduct();
    return () => {
      mounted = false;
    };
  }, [params.slug]);

  if (!product) {
    return <PageChrome><section className="section-pad"><p className="empty-state">Product not found.</p></section></PageChrome>;
  }

  return <PageChrome><section className="product-detail"><div className="detail-image"><img src={product.image} alt={product.name} /></div><div className="detail-copy"><p className="eyebrow">{product.category} / {product.badge || "Handcrafted"}</p><h1>{product.name}</h1><div className="detail-rating"><Star size={14} fill="currentColor" /> {product.rating} ({product.reviews} reviews)</div><p className="detail-price">{formatPrice(product.price)}</p><p className="detail-description">{product.detail}</p><div className="detail-actions"><button className="button button-dark" onClick={() => addToCart(product)}>Add to bag <ArrowRight size={16} /></button><button className={`detail-wishlist ${wishlist.includes(product.id) ? "wished" : ""}`} onClick={() => toggleWishlist(product.id)} aria-label="Toggle wishlist"><Heart fill={wishlist.includes(product.id) ? "currentColor" : "none"} /></button></div><div className="detail-notes"><p>Made to order in our Lahore studio.</p><p>Free delivery on orders over PKR 5,000.</p><p>Message us on WhatsApp for custom sizing or finishes.</p></div></div></section><section className="section-pad"><div className="section-row"><div><p className="eyebrow">You may also like</p><h2>More to keep.</h2></div></div><ProductGrid products={relatedProducts} /></section></PageChrome>;
}
