"use client";

import { ArrowUpRight, Heart, Plus, Star } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";
import { formatPrice, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const wished = wishlist.includes(product.id);
  return <article className="product-card"><div className="product-image"><Link href={`/product/${product.slug}`}><img src={product.image} alt={product.name} /></Link><span className="product-badge">{product.badge || "Handcrafted"}</span><button className={`wishlist ${wished ? "wished" : ""}`} onClick={() => toggleWishlist(product.id)} aria-label={`${wished ? "Remove" : "Add"} ${product.name} ${wished ? "from" : "to"} wishlist`}><Heart size={17} fill={wished ? "currentColor" : "none"} /></button><button className="quick-add" onClick={() => addToCart(product)}>Add to bag <Plus size={14} /></button></div><div className="product-info"><div><Link href={`/product/${product.slug}`}><h3>{product.name}</h3></Link><p>{product.category}</p></div><strong>{formatPrice(product.price)}</strong></div><div className="rating"><Star size={12} fill="currentColor" /> {product.rating} <span>({product.reviews})</span><Link href={`/product/${product.slug}`} aria-label={`View ${product.name}`}><ArrowUpRight size={15} /></Link></div></article>;
}
