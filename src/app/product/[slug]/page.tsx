"use client";

import { ArrowRight, Heart, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { useStore } from "@/components/StoreProvider";
import { PageChrome } from "@/components/layout/PageChrome";
import { ProductGrid } from "@/components/product/ProductGrid";
import { formatPrice, products } from "@/lib/products";

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = products.find((item) => item.slug === params.slug);
  if (!product) notFound();
  const { addToCart, wishlist, toggleWishlist } = useStore();
  return <PageChrome><section className="product-detail"><div className="detail-image"><img src={product.image} alt={product.name} /></div><div className="detail-copy"><p className="eyebrow">{product.category} / {product.badge || "Handcrafted"}</p><h1>{product.name}</h1><div className="detail-rating"><Star size={14} fill="currentColor" /> {product.rating} ({product.reviews} reviews)</div><p className="detail-price">{formatPrice(product.price)}</p><p className="detail-description">{product.detail}</p><div className="detail-actions"><button className="button button-dark" onClick={() => addToCart(product)}>Add to bag <ArrowRight size={16} /></button><button className={`detail-wishlist ${wishlist.includes(product.id) ? "wished" : ""}`} onClick={() => toggleWishlist(product.id)} aria-label="Toggle wishlist"><Heart fill={wishlist.includes(product.id) ? "currentColor" : "none"} /></button></div><div className="detail-notes"><p>Made to order in our Lahore studio.</p><p>Free delivery on orders over PKR 5,000.</p><p>Message us on WhatsApp for custom sizing or finishes.</p></div></div></section><section className="section-pad"><div className="section-row"><div><p className="eyebrow">You may also like</p><h2>More to keep.</h2></div></div><ProductGrid products={products.filter((item) => item.id !== product.id).slice(0, 4)} /></section></PageChrome>;
}
